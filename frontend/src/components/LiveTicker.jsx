import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ShieldAlert, Radio, BellRing, Sparkles } from 'lucide-react';

export default function LiveTicker({ streamEvents, latestLevel5Event }) {
  const [muted, setMuted] = useState(false);

  // Play Web Audio API sound alert on Level 5 emergency
  useEffect(() => {
    if (!latestLevel5Event || muted) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();

      // Double high-pitch warning beep synth
      const playBeep = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      playBeep(880, 0, 0.15);
      playBeep(1200, 0.18, 0.25);
    } catch (err) {
      console.log('Audio Context playback prevented by browser auto-play policy:', err);
    }
  }, [latestLevel5Event, muted]);

  // Test Audio Sound
  const handleTestSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-[#131B2A] border-b border-[#1E293B] px-6 py-2.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-red-950/80 text-red-400 border border-red-800 text-xs font-mono font-bold shrink-0 animate-pulse">
          <BellRing className="w-3.5 h-3.5" />
          <span>LIVE EVENT STREAM</span>
        </div>

        {/* Ticker marquee / feed */}
        <div className="overflow-hidden whitespace-nowrap text-xs font-mono text-slate-300 flex-1">
          {streamEvents.length === 0 ? (
            <span className="text-slate-500 italic">Listening for WebSocket incident events...</span>
          ) : (
            <div className="inline-flex space-x-6 animate-pulse">
              {streamEvents.slice(0, 5).map((evt, idx) => (
                <span key={idx} className="inline-flex items-center space-x-1.5">
                  <span className="text-cyan-400 font-bold">[{evt.time}]</span>
                  <span className="text-slate-200 font-semibold">{evt.message}</span>
                  {idx < streamEvents.slice(0, 5).length - 1 && <span className="text-slate-600">|</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 shrink-0 ml-4 border-l border-slate-800 pl-4">
        <button
          onClick={handleTestSound}
          className="text-[11px] font-mono px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded flex items-center space-x-1 cursor-pointer"
          title="Test Web Audio API emergency alert chime"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Test Audio Alert</span>
        </button>

        <button
          onClick={() => setMuted(!muted)}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            muted
              ? 'bg-red-950/50 text-red-400 border-red-900'
              : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
          }`}
          title={muted ? 'Unmute Level 5 Alert Sound' : 'Mute Level 5 Alert Sound'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
