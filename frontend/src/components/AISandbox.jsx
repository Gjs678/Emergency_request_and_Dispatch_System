import React, { useState, useEffect } from 'react';
import { emergencyApi } from '../services/api';
import { Brain, AlertTriangle, ShieldAlert, CheckCircle2, Zap, Send } from 'lucide-react';

export default function AISandbox({ onCreateIncident }) {
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('DISPATCHER-112');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!description.trim()) {
      setAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await emergencyApi.classifyPriority(description);
        if (res.success) {
          setAnalysis(res.data);
        }
      } catch (err) {
        console.error('AI Sandbox error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || submitting) return;

    setSubmitting(true);
    try {
      // Default location randomly scattered around Mangalore City Center (12.9141, 74.8560)
      const defaultLat = 12.9141 + (Math.random() - 0.5) * 0.04;
      const defaultLng = 74.8560 + (Math.random() - 0.5) * 0.04;

      await onCreateIncident({
        user_id: userId,
        location: { lat: defaultLat, lng: defaultLng },
        description,
      });

      setDescription('');
      setAnalysis(null);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (score) => {
    switch (score) {
      case 5: return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50', badge: 'bg-red-500 text-white animate-pulse' };
      case 4: return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50', badge: 'bg-orange-500 text-white' };
      case 3: return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50', badge: 'bg-yellow-500 text-black' };
      case 2: return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50', badge: 'bg-blue-500 text-white' };
      default: return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50', badge: 'bg-emerald-500 text-white' };
    }
  };

  const style = analysis ? getPriorityColor(analysis.priority_score) : null;

  return (
    <div className="bg-[#131B2A] border border-[#1E293B] rounded-xl p-5 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-md font-bold tracking-wide text-slate-100 uppercase">
            AI Priority Live Sandbox
          </h2>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
          NLP Model v2.4
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">DISPATCHER OFFICER ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-mono text-slate-400 mb-1 flex justify-between">
            <span>LIVE INCIDENT DESCRIPTION TYPER</span>
            {loading && <span className="text-cyan-400 animate-pulse">Analyzing...</span>}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Type emergency description here (e.g. 'Vehicle collision at Hampankatta Circle, driver injured' or 'Fire outbreak near State Bank market')..."
            className="w-full flex-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans resize-none min-h-[100px]"
          />
        </div>

        {/* Live Analysis Display */}
        {analysis ? (
          <div className={`p-4 rounded-xl border ${style.border} ${style.bg} transition-all duration-300 space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className={`w-6 h-6 ${style.text}`} />
                <div>
                  <div className="text-xs font-mono text-slate-400">CLASSIFIED URGENCY</div>
                  <div className={`text-base font-extrabold font-mono ${style.text}`}>
                    {analysis.urgency_level} (SCORE {analysis.priority_score}/5)
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${style.badge}`}>
                Level {analysis.priority_score}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1 uppercase">Detected Risk Factors</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.risk_factors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-900/90 text-cyan-300 border border-cyan-900/40"
                  >
                    #{factor}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 flex items-start space-x-2">
              <Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span>{analysis.recommendation}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-[#1E293B] bg-[#0B0F17]/50 text-center text-slate-500 text-xs py-6">
            Type an emergency description above to see real-time AI priority classification & risk extraction.
          </div>
        )}

        <button
          type="submit"
          disabled={!description.trim() || submitting}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-sm rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'DISPATCHING INCIDENT...' : 'SUBMIT INCIDENT TO REDIS QUEUE'}</span>
        </button>
      </form>
    </div>
  );
}