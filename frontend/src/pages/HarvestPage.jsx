import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api';
import { Mic, MicOff, Loader2, CheckCircle, AlertTriangle, RefreshCw, Printer } from 'lucide-react';
import MarketAdvisor from '../components/MarketAdvisor';

export default function HarvestPage() {
  const { t, i18n } = useTranslation();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parseError, setParseError] = useState(false);
  const [form, setForm] = useState({
    cropType: '', quantity: '', unit: 'kg', harvestDate: '',
    farmerPayout: '', transportCost: '', finalConsumerPrice: '',
  });
  const [suggestedPrices, setSuggestedPrices] = useState(null); // from market advisor
  const [priceConfirmed, setPriceConfirmed] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Called by MarketAdvisor when analysis loads
  const handlePricesReady = (prices) => {
    setSuggestedPrices(prices);
    setPriceConfirmed(false);
    // Pre-fill only if farmer hasn't entered prices yet
    setForm(f => ({
      ...f,
      farmerPayout: f.farmerPayout || String(prices.farmerPayout),
      transportCost: f.transportCost || String(prices.transportCost),
      finalConsumerPrice: f.finalConsumerPrice || String(prices.finalConsumerPrice),
    }));
  };

  const getLang = () => {
    const map = { hi: 'hi-IN', kn: 'kn-IN', te: 'te-IN', ta: 'ta-IN' };
    return map[i18n.language] || 'en-IN';
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Speech recognition not supported in this browser'); return; }
    setParseError(false);
    const rec = new SpeechRecognition();
    rec.lang = getLang();
    rec.interimResults = false;
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      try {
        const { data } = await api.post('/harvest/voice', { transcript: text, language: i18n.language });
        const p = data.parsed;
        if (!p.cropType && !p.quantity) {
          setParseError(true);
          toast.error('Could not understand. Please try again or fill manually.');
          return;
        }
        setForm((f) => ({
          ...f,
          cropType: p.cropType || f.cropType,
          quantity: p.quantity != null ? String(p.quantity) : f.quantity,
          unit: p.unit || f.unit,
          farmerPayout: p.farmerPayout != null ? String(p.farmerPayout) : f.farmerPayout,
          transportCost: p.transportCost != null ? String(p.transportCost) : f.transportCost,
          finalConsumerPrice: p.finalConsumerPrice != null ? String(p.finalConsumerPrice) : f.finalConsumerPrice,
          harvestDate: p.harvestDate || f.harvestDate,
        }));
        const filled = [p.cropType, p.quantity, p.farmerPayout, p.transportCost, p.finalConsumerPrice, p.harvestDate].filter(Boolean);
        toast.success(filled.length >= 3 ? `Filled ${filled.length} fields from voice` : `Heard: ${p.quantity || ''} ${p.unit || ''} ${p.cropType || ''}`);
      } catch {
        setParseError(true);
        toast.error('Could not parse voice. Please fill the form manually.');
      }
    };
    rec.onerror = () => { setListening(false); toast.error('Microphone error'); };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const handleDownloadPDF = () => {
    const rec = result.record;
    const pb = rec?.payoutBreakdown || {};
    const unit = rec?.unit || 'kg';
    const status = result.fairPriceCompliant ? '✅ Fair Price Compliant' : '⚠️ Price Violation Detected';
    const statusColor = result.fairPriceCompliant ? '#16a34a' : '#d97706';
    const harvestDateStr = rec?.harvestDate
      ? new Date(rec.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Harvest Certificate — ${rec?.cropType || 'Crop'}</title>
<style>* { margin:0;padding:0;box-sizing:border-box; } body{font-family:Arial,sans-serif;padding:48px;color:#111;background:#fff;}
.header{text-align:center;border-bottom:2px solid #16a34a;padding-bottom:16px;margin-bottom:24px;}
.logo{font-size:1.8rem;font-weight:800;color:#16a34a;} .subtitle{font-size:.95rem;color:#555;margin-top:4px;}
.status{font-size:1.15rem;font-weight:700;color:${statusColor};margin-bottom:24px;}
.body{display:flex;gap:48px;align-items:flex-start;} .details{flex:1;}
table{width:100%;border-collapse:collapse;font-size:.93rem;}
td{padding:10px 14px;border-bottom:1px solid #e5e7eb;}
td:first-child{font-weight:700;color:#374151;width:45%;}
.qr-section{text-align:center;flex-shrink:0;} .qr-section img{width:180px;height:180px;}
.qr-section p{font-size:.78rem;color:#6b7280;margin-top:6px;}
.footer{margin-top:36px;font-size:.78rem;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:14px;}
</style></head><body>
<div class="header"><div class="logo">🌾 Krishi-Trace AI</div><div class="subtitle">Harvest Record — Supply Chain Certificate</div></div>
<div class="status">${status}</div>
<div class="body"><div class="details"><table>
<tr><td>Crop Type</td><td>${rec?.cropType || '—'}</td></tr>
<tr><td>Quantity</td><td>${rec?.quantity ?? '—'} ${unit}</td></tr>
<tr><td>Farmer Payout</td><td>₹${pb.farmerPayout ?? '—'} / ${unit}</td></tr>
<tr><td>Transport Cost</td><td>₹${pb.transportCost ?? '—'} / ${unit}</td></tr>
<tr><td>Final Consumer Price</td><td>₹${pb.finalConsumerPrice ?? '—'} / ${unit}</td></tr>
<tr><td>Harvest Date</td><td>${harvestDateStr}</td></tr>
<tr><td>Logged On</td><td>${new Date().toLocaleString('en-IN')}</td></tr>
<tr><td>Transaction Hash</td><td style="word-break:break-all;font-size:.75rem">${rec?.txHash || '—'}</td></tr>
</table></div>
${rec?.qrCode ? `<div class="qr-section"><img src="${rec.qrCode}" alt="QR"/><p>Scan to verify on blockchain</p></div>` : ''}
</div>
<div class="footer">This document is auto-generated by Krishi-Trace AI. Verify authenticity by scanning the QR code above.</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  const handleSubmit = async () => {
    if (!form.cropType || !form.quantity) { toast.error('Crop type and quantity are required'); return; }
    if (suggestedPrices && !priceConfirmed) {
      toast.error('Please confirm or adjust the suggested prices before submitting.');
      document.getElementById('price-confirm-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        farmerPayout: form.farmerPayout || String(suggestedPrices?.farmerPayout || 0),
        transportCost: form.transportCost || String(suggestedPrices?.transportCost || 0),
        finalConsumerPrice: form.finalConsumerPrice || String(suggestedPrices?.finalConsumerPrice || 0),
        voiceTranscript: transcript,
        language: i18n.language,
      };
      const { data } = await api.post('/harvest', payload);
      setResult(data);
      toast.success(t('harvest.success'));
      setForm({ cropType: '', quantity: '', unit: 'kg', harvestDate: '', farmerPayout: '', transportCost: '', finalConsumerPrice: '' });
      setSuggestedPrices(null); setPriceConfirmed(false);
      setTranscript(''); setParseError(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title"><Mic size={26} /> {t('harvest.title')}</h2>
      </div>

      {/* Voice Section */}
      <div className="voice-section">
        <button
          className={`voice-btn ${listening ? 'listening' : ''}`}
          onMouseDown={startListening} onMouseUp={stopListening}
          onTouchStart={startListening} onTouchEnd={stopListening}
        >
          {listening ? <MicOff size={44} /> : <Mic size={44} />}
        </button>
        <p className="voice-hint">
          {listening ? '🎙 Listening... Release to stop' : t('harvest.pressToSpeak')}
        </p>
        <p style={{ fontSize: '.82rem', color: 'var(--gray-400)', textAlign: 'center' }}>
          Say: <em>"Crop type is Tomato 50 kgs harvest date is 10th March 2026"</em>
        </p>
        {transcript && !parseError && <div className="transcript-box">🗣 "{transcript}"</div>}
        {parseError && (
          <div style={{ background:'var(--red-50)',border:'1.5px solid var(--red-200)',borderRadius:12,padding:'14px 20px',color:'var(--red-700)',display:'flex',alignItems:'center',gap:10,maxWidth:480 }}>
            <AlertTriangle size={20} />
            <div>
              <strong>Could not understand your speech.</strong>
              <p style={{ fontSize:'.875rem',marginTop:2 }}>Please try again — say the crop name and quantity clearly.</p>
            </div>
            <button onClick={() => { setParseError(false); setTranscript(''); }} style={{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'var(--red-500)' }}>
              <RefreshCw size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Harvest Form — simplified */}
      <div className="harvest-form">
        <p style={{ fontSize:'.85rem',color:'var(--gray-500)',marginBottom:12 }}>
          Enter your harvest details below. Pricing fields are optional — our Market Advisor will suggest the best selling price after you log.
        </p>
        <div className="form-row">
          <div className="form-group">
            <label>{t('harvest.cropType')}</label>
            <input value={form.cropType} onChange={(e) => set('cropType', e.target.value)} required placeholder="e.g. Tomato" />
          </div>
          <div className="form-group">
            <label>{t('harvest.quantity')}</label>
            <input type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required min="0.1" step="0.1" placeholder="e.g. 50" />
          </div>
          <div className="form-group">
            <label>{t('harvest.unit')}</label>
            <select value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              <option value="kg">kg</option>
              <option value="quintal">quintal</option>
              <option value="ton">ton</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ maxWidth: 320 }}>
          <label>{t('harvest.harvestDate')}</label>
          <input type="date" value={form.harvestDate} onChange={(e) => set('harvestDate', e.target.value)} />
        </div>
      </div>

      {/* Fallback submit — shown when Market Advisor hasn't loaded prices yet */}
      {!suggestedPrices && !result && (
        <div style={{ marginTop: 16 }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ padding: '12px 28px' }}>
            {loading ? <Loader2 size={18} className="spin" /> : '📋 Submit to Ledger'}
          </button>
        </div>
      )}

      {/* Price Confirmation Banner — shown when market prices are suggested */}
      {suggestedPrices && form.cropType && form.quantity && !result && (
        <div id="price-confirm-section" className="price-confirm-banner">
          <div className="pcb-header">
            <span>💡</span>
            <div>
              <strong>Suggested Selling Prices for {form.cropType}</strong>
              <p>Based on current mandi market rates. Confirm or adjust before submitting to ledger.</p>
            </div>
          </div>
          <div className="pcb-prices">
            <div className="pcb-field">
              <label>Farmer Payout (₹/{form.unit})</label>
              <input type="number" value={form.farmerPayout} onChange={e => { set('farmerPayout', e.target.value); setPriceConfirmed(false); }} min="0" step="0.5" />
            </div>
            <div className="pcb-field">
              <label>Transport Cost (₹/{form.unit})</label>
              <input type="number" value={form.transportCost} onChange={e => { set('transportCost', e.target.value); setPriceConfirmed(false); }} min="0" step="0.5" />
            </div>
            <div className="pcb-field">
              <label>Final Consumer Price (₹/{form.unit})</label>
              <input type="number" value={form.finalConsumerPrice} onChange={e => { set('finalConsumerPrice', e.target.value); setPriceConfirmed(false); }} min="0" step="0.5" />
            </div>
          </div>
          <div className="pcb-actions">
            {!priceConfirmed ? (
              <button className="btn-confirm" onClick={() => setPriceConfirmed(true)}>
                ✅ Confirm these prices & Submit to Ledger
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : '📋 Submit to Ledger'}
              </button>
            )}
            <button className="btn-reset-prices" onClick={() => {
              set('farmerPayout', String(suggestedPrices.farmerPayout));
              set('transportCost', String(suggestedPrices.transportCost));
              set('finalConsumerPrice', String(suggestedPrices.finalConsumerPrice));
              setPriceConfirmed(false);
            }}>↺ Reset to suggested</button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`result-card ${result.fairPriceCompliant ? 'success' : 'warning'}`}>
          <div className="result-header">
            {result.fairPriceCompliant ? <CheckCircle size={22} color="var(--green-600)" /> : <AlertTriangle size={22} color="var(--amber-600)" />}
            <span>{result.fairPriceCompliant ? t('ledger.compliant') : t('ledger.violation')}</span>
          </div>
          {result.violation && <p className="violation-msg">{result.violation}</p>}
          <p className="tx-hash">TX: {result.record?.txHash?.slice(0, 24)}...</p>
          {result.record?.qrCode && (
            <div className="qr-display">
              <img src={result.record.qrCode} alt="QR Code" width={160} />
              <p style={{ fontSize:'.875rem',color:'var(--gray-500)' }}>Scan to verify this harvest</p>
            </div>
          )}
          <button onClick={handleDownloadPDF} className="btn-print no-print">
            <Printer size={16} /> Download as PDF
          </button>
        </div>
      )}

      {/* Market Price Advisor — shown after crop is entered or after submit */}
      {(form.cropType || result) && (
        <MarketAdvisor
          cropType={result?.record?.cropType || form.cropType}
          quantity={result?.record?.quantity || form.quantity}
          unit={result?.record?.unit || form.unit}
          onPricesReady={!result ? handlePricesReady : undefined}
        />
      )}
    </div>
  );
}
