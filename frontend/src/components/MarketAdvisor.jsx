import { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Send, Bot, User, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import api from '../api';

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text.replace(/₹/g, 'rupees').replace(/\n/g, '. '));
  utt.lang = 'en-IN';
  utt.rate = 0.95;
  window.speechSynthesis.speak(utt);
}

export default function MarketAdvisor({ cropType, quantity, unit, onPricesReady }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Namaste! 🙏 I'm your Market Price Advisor. Ask me anything about selling your ${cropType || 'crop'} — prices, best time to sell, MSP, or revenue estimates.` }
  ]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const chatEndRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => {
    if (!cropType) return;
    setLoading(true);
    api.get(`/market/analysis?crop=${encodeURIComponent(cropType)}&quantity=${quantity || ''}&unit=${unit || 'kg'}`)
      .then(({ data }) => {
        setAnalysis(data);
        if (data.found && onPricesReady) {
          onPricesReady({
            farmerPayout: data.recommendedMin,
            transportCost: Math.round(data.currentPrice * 0.05),
            finalConsumerPrice: data.recommendedMax,
          });
        }
      })
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false));
  }, [cropType, quantity, unit]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMessages(m => [...m, { role: 'user', text: q }]);
    setInput('');
    setAsking(true);
    try {
      const { data } = await api.post('/market/ask', { question: q, cropContext: cropType?.toLowerCase() });
      setMessages(m => [...m, { role: 'bot', text: data.answer }]);
      if (speakEnabled) speak(data.answer);
    } catch {
      const err = 'Sorry, could not fetch answer. Please try again.';
      setMessages(m => [...m, { role: 'bot', text: err }]);
      if (speakEnabled) speak(err);
    } finally { setAsking(false); }
  }, [input, cropType, speakEnabled]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser'); return; }
    window.speechSynthesis?.cancel();
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setVoiceActive(false);
      sendMessage(text);
    };
    rec.onerror = () => setVoiceActive(false);
    rec.onend = () => setVoiceActive(false);
    recRef.current = rec;
    rec.start();
    setVoiceActive(true);
  };

  const stopVoice = () => { recRef.current?.stop(); setVoiceActive(false); };

  const TrendIcon = analysis?.trend === 'rising' ? TrendingUp : analysis?.trend === 'falling' ? TrendingDown : Minus;
  const trendColor = analysis?.trend === 'rising' ? '#16a34a' : analysis?.trend === 'falling' ? '#dc2626' : '#d97706';

  const chartData = analysis?.monthlyPrices?.map((price, i) => ({
    month: analysis.months[i].slice(0, 3),
    price,
  })) || [];

  return (
    <div className="market-advisor">
      <div className="market-advisor-header">
        <span>📊</span>
        <div>
          <h3>Market Price Advisor</h3>
          <p>Live mandi prices & selling recommendations</p>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Loader2 size={28} className="spin" color="var(--green-600)" />
        </div>
      )}

      {analysis && analysis.found && (
        <>
          <div className="market-price-grid">
            <div className="market-price-card highlight">
              <div className="mpc-label">Current Market Price</div>
              <div className="mpc-value">₹{analysis.currentPrice}<span>/kg</span></div>
              <div className="mpc-sub">{analysis.currentMonth}</div>
            </div>
            <div className="market-price-card">
              <div className="mpc-label">Recommended Sell Price</div>
              <div className="mpc-value green">₹{analysis.recommendedMin}–{analysis.recommendedMax}<span>/kg</span></div>
              <div className="mpc-sub">Your fair share (70–82%)</div>
            </div>
            <div className="market-price-card">
              <div className="mpc-label">Next Month Trend</div>
              <div className="mpc-value" style={{ color: trendColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendIcon size={20} /> ₹{analysis.nextMonthPrice}/kg
              </div>
              <div className="mpc-sub" style={{ color: trendColor }}>
                {analysis.trendPercent > 0 ? '+' : ''}{analysis.trendPercent}% {analysis.trend}
              </div>
            </div>
            {analysis.msp > 0 && (
              <div className="market-price-card">
                <div className="mpc-label">Govt. MSP</div>
                <div className="mpc-value">₹{analysis.msp}<span>/kg</span></div>
                <div className="mpc-sub">Minimum Support Price</div>
              </div>
            )}
          </div>

          {analysis.revenueEstimate && (
            <div className="revenue-estimate">
              <span>💰</span>
              <div>
                <strong>Estimated Revenue for {quantity} {unit}:</strong>
                <span className="rev-range"> ₹{analysis.revenueEstimate.min.toLocaleString('en-IN')} – ₹{analysis.revenueEstimate.max.toLocaleString('en-IN')}</span>
                {analysis.revenueEstimate.atMSP && (
                  <span className="rev-msp"> (At MSP: ₹{analysis.revenueEstimate.atMSP.toLocaleString('en-IN')})</span>
                )}
              </div>
            </div>
          )}

          <div className="market-chart">
            <div className="chart-title">Annual Price Trend (₹/kg)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={36} />
                <Tooltip formatter={(v) => [`₹${v}/kg`, 'Price']} />
                {analysis.msp > 0 && <ReferenceLine y={analysis.msp} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'MSP', fontSize: 10, fill: '#f59e0b' }} />}
                <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="market-tip">
            <span>💡</span><p>{analysis.tip}</p>
          </div>
          <div className="market-tip" style={{ background: 'var(--green-50)', borderColor: 'var(--green-200)' }}>
            <span>🏆</span>
            <p>Best month to sell: <strong>{analysis.peakMonth}</strong> — prices reach ₹{analysis.peakPrice}/kg</p>
          </div>
        </>
      )}

      {analysis && !analysis.found && (
        <div className="market-tip" style={{ background: '#fef3c7', borderColor: '#fcd34d' }}>
          <span>⚠️</span><p>{analysis.message}</p>
        </div>
      )}

      {/* Voice Chat */}
      <div className="market-chat">
        <div className="chat-title">
          <Bot size={16} /> Ask the Market Advisor
          <button
            onClick={() => setSpeakEnabled(s => !s)}
            title={speakEnabled ? 'Mute voice responses' : 'Enable voice responses'}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {speakEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              <div className="chat-avatar">{m.role === 'bot' ? <Bot size={14} /> : <User size={14} />}</div>
              <div className="chat-bubble" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
            </div>
          ))}
          {asking && (
            <div className="chat-msg bot">
              <div className="chat-avatar"><Bot size={14} /></div>
              <div className="chat-bubble"><Loader2 size={14} className="spin" /></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Ask about ${cropType || 'your crop'} prices, MSP, best time to sell...`}
          />
          {/* Voice mic button */}
          <button
            className={`chat-mic-btn ${voiceActive ? 'active' : ''}`}
            onMouseDown={startVoice} onMouseUp={stopVoice}
            onTouchStart={startVoice} onTouchEnd={stopVoice}
            title="Hold to speak"
          >
            {voiceActive ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button onClick={() => sendMessage()} disabled={asking || !input.trim()} title="Send">
            <Send size={16} />
          </button>
        </div>

        {voiceActive && (
          <div style={{ textAlign: 'center', padding: '6px 0', fontSize: '.8rem', color: 'var(--green-700)', background: '#f0fdf4' }}>
            🎙 Listening... Release to send
          </div>
        )}

        <div className="chat-suggestions">
          {[`Price of ${cropType || 'tomato'}?`, 'When should I sell?', 'What is MSP?', 'Will prices go up?'].map(s => (
            <button key={s} onClick={() => sendMessage(s)}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
