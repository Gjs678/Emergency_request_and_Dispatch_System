import React, { useState, useEffect } from 'react';
import { emergencyApi } from '../services/api';
import { Truck, Shield, Activity, Plus, RefreshCw } from 'lucide-react';

export default function FleetManagement() {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // New Responder Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('AMBULANCE');
  const [lat, setLat] = useState('12.8700');
  const [lng, setLng] = useState('74.8400');

  // Fetch responders
  const fetchFleet = async () => {
    setLoading(true);
    try {
      const res = await emergencyApi.getResponders();
      if (res.data) setResponders(res.data);
    } catch (err) {
      console.error('Error fetching fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // Register New Vehicle
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await emergencyApi.createResponder({
        name,
        type,
        status: 'AVAILABLE',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });
      setName('');
      fetchFleet();
    } catch (err) {
      console.error('Error registering unit:', err);
    }
  };

  return (
    <div className="p-6 bg-[#0B0F17] min-h-screen text-slate-100 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-wider text-cyan-400 flex items-center gap-2">
            <Truck className="w-6 h-6" /> FLEET & RESPONDER MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400">Mangalore Emergency Dispatch Service Fleet Control</p>
        </div>
        <button 
          onClick={fetchFleet} 
          className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-800 text-xs text-slate-300 rounded flex items-center gap-1.5 border border-slate-700 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Fleet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register Vehicle Form */}
        <div className="bg-[#131B2A] border border-[#1E293B] rounded-xl p-5 shadow-xl h-fit">
          <h2 className="text-sm font-bold font-mono uppercase text-slate-200 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" /> Register New Emergency Vehicle
          </h2>

          <form onSubmit={handleRegister} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">UNIT NAME / ID</label>
              <input 
                type="text" 
                placeholder="e.g. 108 Ambulance - Pandeshwar" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">UNIT TYPE</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="AMBULANCE">🚑 Ambulance (EMS)</option>
                <option value="FIRE_ENGINE">🚒 Fire Engine</option>
                <option value="POLICE_UNIT">🚓 Police Patrol (PCR)</option>
                <option value="SWAT">🛡️ Special Tactical Unit</option>
                <option value="HAZMAT">☣️ Hazmat Unit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">STATION LATITUDE</label>
                <input 
                  type="number" 
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">STATION LONGITUDE</label>
                <input 
                  type="number" 
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all shadow-md mt-2"
            >
              ADD UNIT TO FLEET
            </button>
          </form>
        </div>

        {/* Right Column: Active Fleet Directory */}
        <div className="lg:col-span-2 bg-[#131B2A] border border-[#1E293B] rounded-xl p-5 shadow-xl">
          <h2 className="text-sm font-bold font-mono uppercase text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Active Fleet Roster ({responders.length} Units)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400 font-mono">
                  <th className="pb-3">UNIT</th>
                  <th className="pb-3">TYPE</th>
                  <th className="pb-3">LOCATION (MANGALORE)</th>
                  <th className="pb-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {responders.map((unit) => (
                  <tr key={unit.id} className="hover:bg-[#0B0F17]/40">
                    <td className="py-3 font-semibold text-slate-200">{unit.name}</td>
                    <td className="py-3 font-mono text-slate-400">{unit.type}</td>
                    <td className="py-3 font-mono text-slate-400">{unit.lat.toFixed(4)}, {unit.lng.toFixed(4)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        unit.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                        unit.status === 'DISPATCHED' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                        'bg-slate-700/40 text-slate-400'
                      }`}>
                        {unit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}