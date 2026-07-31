import React, { useState } from 'react';
import { X, PlusCircle, MapPin, Send, AlertTriangle } from 'lucide-react';

export default function CreateIncidentModal({ isOpen, onClose, onCreate }) {
  const [userId, setUserId] = useState('CITIZEN-991');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(37.7749);
  const [lng, setLng] = useState(-122.4194);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || loading) return;

    setLoading(true);
    try {
      await onCreate({
        user_id: userId,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        description,
      });
      onClose();
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomCoords = () => {
    // Randomize around San Francisco center
    setLat(parseFloat((37.74 + Math.random() * 0.06).toFixed(4)));
    setLng(parseFloat((-122.45 + Math.random() * 0.06).toFixed(4)));
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131B2A] border border-[#1E293B] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-md font-bold text-slate-100 uppercase tracking-wide">
              Create Emergency Incident (API #1)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">USER / CALLER ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">EMERGENCY DESCRIPTION</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact incident description (e.g., 'Cardiac arrest patient, unresponsive' or 'Building fire on 5th floor')..."
              className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">LATITUDE</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">LONGITUDE</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRandomCoords}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-400 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pick Random City Location</span>
          </button>

          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!description.trim() || loading}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-950/50 flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating...' : 'Post Emergency (API #1)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
