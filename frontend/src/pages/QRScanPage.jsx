import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Camera, CameraOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recordId, setRecordId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(null);

  const handleLookup = (e) => {
    e.preventDefault();
    if (!recordId.trim()) { toast.error('Enter a Record ID'); return; }
    navigate(`/verify/${recordId.trim()}`);
  };

  const handleScanned = (text) => {
    stopScanner();
    try {
      const parsed = JSON.parse(text);
      navigate(`/verify/${parsed.recordId || text}`);
    } catch {
      navigate(`/verify/${text}`);
    }
  };

  const tick = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const codes = await detector.detect(canvas);
      if (codes.length > 0) { handleScanned(codes[0].rawValue); return; }
    } catch {}
    rafRef.current = requestAnimationFrame(tick);
  };

  const startScanner = async () => {
    setCameraError('');
    if (!('BarcodeDetector' in window)) {
      setCameraError('not_supported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setScanning(true);
      await new Promise(r => setTimeout(r, 150));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Click the camera icon in your browser address bar to allow access.'
        : err?.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : 'Could not start camera. Please use Chrome or Edge.';
      setCameraError(msg);
    }
  };

  const stopScanner = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScanning(false);
  };

  useEffect(() => () => stopScanner(), []);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title"><QrCode size={26} /> {t('qr.title')}</h2>
        <button className="btn-secondary" onClick={() => { stopScanner(); navigate(-1); }}>
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>

      <div className="scan-container">
        {scanning ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', background: '#000' }}>
              <video ref={videoRef} style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }} playsInline muted />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {/* green scan box overlay */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: 220, height: 220, border: '3px solid #4ade80', borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,.5)' }} />
              </div>
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '.9rem', textAlign: 'center' }}>
              Align the QR code inside the green box
            </p>
            <button className="btn-secondary" onClick={stopScanner} style={{ width: '100%', justifyContent: 'center' }}>
              <CameraOff size={18} /> Stop Camera
            </button>
          </div>
        ) : (
          <>
            <div className="scan-icon-area">
              <QrCode size={80} className="scan-icon" />
              <p style={{ fontSize: '1rem', color: 'var(--gray-500)' }}>{t('qr.scanPrompt')}</p>
            </div>

            <button className="btn-primary" onClick={startScanner}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
              <Camera size={22} /> Open Camera to Scan QR
            </button>

            {cameraError === 'not_supported' && (
              <div style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-200)', borderRadius: 10, padding: '14px 16px', fontSize: '.875rem', color: 'var(--amber-700)', textAlign: 'center', lineHeight: 1.7 }}>
                <strong>Camera scanning not supported in this browser.</strong><br />
                Please use <strong>Google Chrome</strong> (version 83+) on desktop or Android.<br />
                Or enter the Record ID manually below.
              </div>
            )}

            {cameraError && cameraError !== 'not_supported' && (
              <div style={{ background: 'var(--red-50)', border: '1px solid var(--red-200)', borderRadius: 10, padding: '14px 16px', fontSize: '.875rem', color: 'var(--red-700)', textAlign: 'center' }}>
                ⚠️ {cameraError}
              </div>
            )}

            <div className="scan-divider"><span>or enter Record ID manually</span></div>

            <form onSubmit={handleLookup} className="scan-form">
              <input
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                placeholder="Enter product Record ID..."
                className="scan-input"
              />
              <button type="submit" className="btn-primary">
                <Search size={16} /> Lookup
              </button>
            </form>

            <p className="scan-note">
              On iPhone, use the native camera app to scan the QR code — it opens the verify page automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
