import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { CheckCircle, XCircle, Leaf, MapPin, Calendar, Hash, ArrowLeft } from 'lucide-react';

export default function QRVerifyPage() {
  const { t } = useTranslation();
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/qr/${recordId}`)
      .then((r) => setData(r.data))
      .catch(() => setData({ verified: false }))
      .finally(() => setLoading(false));
  }, [recordId]);

  if (loading) return <div className="verify-page"><div className="loading-state">{t('common.loading')}</div></div>;

  if (!data?.verified) return (
    <div className="verify-page">
      <div className="verify-card error">
        <XCircle size={48} className="verify-icon red" />
        <h2>{t('qr.notFound')}</h2>
        <p style={{ color: 'var(--gray-500)', margin: '8px 0 20px' }}>Record ID: {recordId}</p>
        <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Go Back</button>
      </div>
    </div>
  );

  const pb = data.payoutBreakdown;

  return (
    <div className="verify-page">
      <div className="verify-card">
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: 20, alignSelf: 'flex-start' }}>
          <ArrowLeft size={16} /> Go Back
        </button>
        <div className="verify-header">
          <CheckCircle size={40} className="verify-icon green" />
          <h2>{t('qr.verified')}</h2>
        </div>

        <div className="verify-section">
          <div className="verify-row"><Leaf size={16} /><span><strong>Crop:</strong> {data.cropType}</span></div>
          <div className="verify-row"><span className="label">{t('qr.farmerName')}:</span> {data.farmerName}</div>
          <div className="verify-row"><MapPin size={16} /><span>{data.farmAddress || 'Location on record'}</span></div>
          <div className="verify-row"><Calendar size={16} /><span>{new Date(data.harvestDate).toLocaleDateString()}</span></div>
          <div className="verify-row"><Hash size={16} /><span className="hash-text">{data.txHash?.slice(0, 30)}...</span></div>
        </div>

        <div className="price-breakdown">
          <h3>{t('qr.payoutBreakdown')}</h3>
          <div className="price-bar">
            <div className="price-segment farmer" style={{ flex: pb.farmerPayout }}>
              <span>{t('qr.farmerPayout')}</span>
              <strong>₹{pb.farmerPayout}/kg</strong>
            </div>
            <div className="price-segment transport" style={{ flex: pb.transportCost || 1 }}>
              <span>{t('qr.transport')}</span>
              <strong>₹{pb.transportCost || 0}/kg</strong>
            </div>
          </div>
          <div className="final-price">
            <span>{t('qr.finalPrice')}</span>
            <strong>₹{pb.finalConsumerPrice}/kg</strong>
          </div>
        </div>

        <div className="farmer-share">
          Farmer receives <strong>{((pb.farmerPayout / pb.finalConsumerPrice) * 100).toFixed(0)}%</strong> of the final price
        </div>
      </div>
    </div>
  );
}
