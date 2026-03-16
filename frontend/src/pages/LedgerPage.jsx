import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { BookOpen, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export default function LedgerPage() {
  const { t } = useTranslation();
  const [data, setData] = useState({ records: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/ledger?page=${page}&limit=15`);
        setData(res.data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [page]);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title"><BookOpen size={22} /> {t('ledger.title')}</h2>
        <span className="badge badge-blue">{data.total} records</span>
      </div>

      {loading ? (
        <div className="loading-state">{t('common.loading')}</div>
      ) : data.records.length === 0 ? (
        <div className="empty-state">{t('common.noData')}</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('ledger.crop')}</th>
                  <th>{t('ledger.quantity')}</th>
                  <th>{t('ledger.payout')}</th>
                  <th>Final Price</th>
                  <th>{t('ledger.txHash')}</th>
                  <th>{t('ledger.block')}</th>
                  <th>{t('ledger.status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r._id}>
                    <td><strong>{r.cropType}</strong><br /><small>{r.farmerName}</small></td>
                    <td>{r.quantity} {r.unit}</td>
                    <td>₹{r.payoutBreakdown?.farmerPayout}/kg</td>
                    <td>₹{r.payoutBreakdown?.finalConsumerPrice}/kg</td>
                    <td className="hash-cell">
                      <span title={r.txHash}>{r.txHash?.slice(0, 14)}...</span>
                      <ExternalLink size={12} />
                    </td>
                    <td>{r.blockNumber?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${r.fairPriceCompliant ? 'badge-green' : 'badge-red'}`}>
                        {r.fairPriceCompliant ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                        {r.fairPriceCompliant ? t('ledger.compliant') : t('ledger.violation')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
            <span>Page {page} of {data.pages}</span>
            <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}><ChevronRight size={16} /></button>
          </div>
        </>
      )}
    </div>
  );
}
