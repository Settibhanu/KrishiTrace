import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';
import toast from 'react-hot-toast';
import { Map, Plus, Loader2, AlertTriangle, Clock, CheckCircle, Truck, X } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Custom colored markers
const makeIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7]
});

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#0d9488', '#dc2626'];

// Component that flies the map to a position
function MapFlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target.center, target.zoom, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

export default function GISPage() {
  const { t } = useTranslation();
  const [shipments, setShipments] = useState([]);
  const [selected, setSelected] = useState(null); // null = show all
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    originLat: '12.9716', originLng: '77.5946', originAddress: 'Bengaluru Farm',
    destLat: '13.0827', destLng: '80.2707', destAddress: 'Chennai Market'
  });
  const [loading, setLoading] = useState(false);
  const [delivering, setDelivering] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  const load = async () => {
    try { const r = await api.get('/gis/shipments'); setShipments(r.data); } catch {}
  };

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, []);

  const handleSelect = (s) => {
    if (selected?._id === s._id) {
      // deselect — show all
      setSelected(null);
      setFlyTarget({ center: [12.9716, 77.5946], zoom: 6 });
    } else {
      setSelected(s);
      // fly to midpoint between origin and destination
      const midLat = (s.origin.coordinates[1] + s.destination.coordinates[1]) / 2;
      const midLng = (s.origin.coordinates[0] + s.destination.coordinates[0]) / 2;
      setFlyTarget({ center: [midLat, midLng], zoom: 7 });
    }
  };

  const createShipment = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/gis/shipments', form);
      toast.success('Shipment created'); setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  };

  const markDelivered = async (shipmentId, e) => {
    e.stopPropagation();
    setDelivering(shipmentId);
    try {
      await api.patch(`/gis/shipments/${shipmentId}/deliver`);
      toast.success('Shipment marked as delivered');
      if (selected?._id === shipmentId) setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setDelivering(null); }
  };

  const statusColor = (s) => s === 'delivered' ? 'green' : s === 'delayed' ? 'red' : s === 'in_transit' ? 'blue' : 'amber';

  // Which shipments to render on map
  const visibleShipments = selected ? shipments.filter(s => s._id === selected._id) : shipments;

  return (
    <div className="page gis-page">
      <div className="page-header">
        <h2 className="page-title"><Map size={26} /> {t('gis.title')}</h2>
        <button className="btn-primary small" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {t('gis.newShipment')}
        </button>
      </div>

      {/* Info bar */}
      <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-100)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: '.875rem', color: 'var(--blue-700)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Truck size={16} style={{ flexShrink: 0 }} />
        <span>Click a shipment card to focus it on the map. Click again to deselect and show all.</span>
      </div>

      {showForm && (
        <form onSubmit={createShipment} className="shipment-form card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>New Shipment</span>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}><X size={18} /></button>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Origin Lat</label><input value={form.originLat} onChange={(e) => setForm({...form, originLat: e.target.value})} /></div>
            <div className="form-group"><label>Origin Lng</label><input value={form.originLng} onChange={(e) => setForm({...form, originLng: e.target.value})} /></div>
            <div className="form-group"><label>Origin Address</label><input value={form.originAddress} onChange={(e) => setForm({...form, originAddress: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Dest Lat</label><input value={form.destLat} onChange={(e) => setForm({...form, destLat: e.target.value})} /></div>
            <div className="form-group"><label>Dest Lng</label><input value={form.destLng} onChange={(e) => setForm({...form, destLng: e.target.value})} /></div>
            <div className="form-group"><label>Dest Address</label><input value={form.destAddress} onChange={(e) => setForm({...form, destAddress: e.target.value})} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : 'Create Shipment'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="gis-layout">
        {/* Shipment list */}
        <div className="shipment-list">
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--gray-700)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('gis.activeShipments')} ({shipments.length})</span>
            {selected && (
              <button onClick={() => { setSelected(null); setFlyTarget({ center: [12.9716, 77.5946], zoom: 6 }); }}
                style={{ fontSize: '.75rem', color: 'var(--blue-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Show All
              </button>
            )}
          </div>

          {shipments.map((s, idx) => {
            const color = COLORS[idx % COLORS.length];
            const isSelected = selected?._id === s._id;
            return (
              <div
                key={s._id}
                className={`shipment-card ${isSelected ? 'active' : ''} ${s.deviationAlert ? 'alert' : ''}`}
                onClick={() => handleSelect(s)}
                style={{ cursor: 'pointer', borderLeft: `4px solid ${color}`, transition: 'all .2s' }}
              >
                {/* Color dot + ID */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span className="shipment-id">{s.shipmentId?.slice(0, 12)}...</span>
                </div>
                <div className="shipment-route">{s.origin.address} → {s.destination.address}</div>
                <div className="shipment-meta">
                  <span className={`badge badge-${statusColor(s.status)}`}>{s.status}</span>
                  {s.eta && <span><Clock size={12} /> {new Date(s.eta).toLocaleTimeString()}</span>}
                  {s.deviationAlert && <span className="deviation-badge"><AlertTriangle size={12} /> {s.deviationKm}km off</span>}
                </div>

                {isSelected && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--gray-50)', borderRadius: 8, fontSize: '.8rem', color: 'var(--gray-600)' }}>
                    <div>📍 From: {s.origin.address}</div>
                    <div>🏁 To: {s.destination.address}</div>
                    {s.eta && <div>⏱ ETA: {new Date(s.eta).toLocaleString()}</div>}
                  </div>
                )}

                {s.status !== 'delivered' && (
                  <button
                    className="btn-primary small"
                    style={{ marginTop: 10, width: '100%', justifyContent: 'center', fontSize: '.8rem', padding: '7px' }}
                    onClick={(e) => markDelivered(s._id, e)}
                    disabled={delivering === s._id}
                  >
                    {delivering === s._id ? <Loader2 size={14} className="spin" /> : <><CheckCircle size={14} /> Mark Delivered</>}
                  </button>
                )}
                {s.status === 'delivered' && (
                  <div style={{ marginTop: 8, fontSize: '.8rem', color: 'var(--green-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={14} /> Delivered {s.deliveredAt ? new Date(s.deliveredAt).toLocaleDateString() : ''}
                  </div>
                )}
              </div>
            );
          })}

          {shipments.length === 0 && (
            <div className="empty-state" style={{ padding: '30px 10px' }}>No active shipments</div>
          )}
        </div>

        {/* Map */}
        <div className="map-container">
          <MapContainer center={[12.9716, 77.5946]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
            <MapFlyTo target={flyTarget} />

            {visibleShipments.map((s, idx) => {
              const color = COLORS[shipments.indexOf(s) % COLORS.length];
              return (
                <div key={s._id}>
                  {/* Planned route (dashed) */}
                  {s.plannedRoute?.length > 0 && (
                    <Polyline
                      positions={s.plannedRoute.map(([lng, lat]) => [lat, lng])}
                      color={color} dashArray="8 5" weight={selected ? 3 : 2} opacity={0.7}
                    />
                  )}
                  {/* Actual path (solid) */}
                  {s.actualPath?.length > 0 && (
                    <Polyline
                      positions={s.actualPath.map((p) => [p.coordinates[1], p.coordinates[0]])}
                      color={color} weight={4} opacity={0.9}
                    />
                  )}
                  {/* Current position */}
                  {s.currentLocation && (
                    <CircleMarker
                      center={[s.currentLocation[1], s.currentLocation[0]]}
                      radius={selected?._id === s._id ? 12 : 8}
                      pathOptions={{ color: s.deviationAlert ? '#ef4444' : color, fillColor: s.deviationAlert ? '#ef4444' : color, fillOpacity: 0.9 }}
                    >
                      <Popup><strong>{s.shipmentId?.slice(0, 10)}</strong><br />Status: {s.status}</Popup>
                    </CircleMarker>
                  )}
                  {/* Origin marker */}
                  <Marker position={[s.origin.coordinates[1], s.origin.coordinates[0]]} icon={makeIcon(color)}>
                    <Popup>
                      <strong>📍 Origin</strong><br />{s.origin.address}
                    </Popup>
                  </Marker>
                  {/* Destination marker */}
                  <Marker position={[s.destination.coordinates[1], s.destination.coordinates[0]]} icon={makeIcon('#374151')}>
                    <Popup>
                      <strong>🏁 Destination</strong><br />{s.destination.address}
                    </Popup>
                  </Marker>
                </div>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
