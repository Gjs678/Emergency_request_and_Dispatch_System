import React from 'react';
import { Truck, Shield, Flame, Crosshair, AlertOctagon, Radio, Move, MapPin } from 'lucide-react';

// Math formula to calculate straight-line distance between two GPS coordinates in KM
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Returns distance formatted to 1 decimal place
}

export default function ResponderPanel({
  responders = [],
  onManualAssign,
  activeIncidents = [],
  pendingIncidents = [],
}) {
  const getIcon = (type) => {
    switch (type) {
      case 'AMBULANCE':
        return <Truck className="w-4 h-4 text-emerald-400" />;
      case 'FIRE_ENGINE':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'POLICE_UNIT':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'SWAT':
        return <Crosshair className="w-4 h-4 text-yellow-400" />;
      case 'HAZMAT':
        return <AlertOctagon className="w-4 h-4 text-purple-400" />;
      default:
        return <Radio className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            READY
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse">
            DISPATCHED
          </span>
        );
      case 'ON_SCENE':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            ON SCENE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400">
            OFF DUTY
          </span>
        );
    }
  };

  const handleDragStart = (e, responder) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        responderId: responder.id,
        responderName: responder.name,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Extract pending emergencies list
  const unassignedIncidents =
    pendingIncidents.length > 0
      ? pendingIncidents
      : activeIncidents.filter((inc) => inc.status === 'PENDING');

  // Grab primary target emergency to show proximity distance relative to units
  const primaryIncident = unassignedIncidents[0];

  return (
    <div className="bg-[#131B2A] border border-[#1E293B] rounded-xl p-5 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] mb-4">
        <div className="flex items-center space-x-2">
          <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h2 className="text-md font-bold tracking-wide text-slate-100 uppercase">
            Active Fleet & Units
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
          {responders.filter((r) => r.status === 'AVAILABLE').length} / {responders.length} Ready
        </span>
      </div>

      <div className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-900/50 p-2 rounded-lg mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Move className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>DRAG & DROP unit onto card or use Quick Dispatch</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {responders.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">No responder units online.</div>
        ) : (
          responders.map((responder) => {
            const isAvailable = responder.status === 'AVAILABLE';

            // Calculate distance to top pending emergency
            const distance = primaryIncident
              ? getHaversineDistance(
                  responder.lat,
                  responder.lng,
                  primaryIncident.lat,
                  primaryIncident.lng
                )
              : null;

            return (
              <div
                key={responder.id}
                draggable={isAvailable}
                onDragStart={(e) => handleDragStart(e, responder)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isAvailable
                    ? 'bg-[#0B0F17] border-[#1E293B] hover:border-cyan-500/60 cursor-grab active:cursor-grabbing hover:bg-slate-900/80 shadow-md'
                    : 'bg-[#0B0F17]/40 border-slate-800/60 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800">
                      {getIcon(responder.type)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{responder.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {responder.type}
                        </span>
                        {/* Dynamic proximity badge */}
                        {isAvailable && distance && (
                          <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {distance} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(responder.status)}
                </div>

                {isAvailable && unassignedIncidents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Quick Dispatch:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onManualAssign(e.target.value, responder.id);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[170px] truncate"
                    >
                      <option value="" disabled>
                        Select Target Incident...
                      </option>
                      {unassignedIncidents.map((inc) => {
                        const incDist = getHaversineDistance(
                          responder.lat,
                          responder.lng,
                          inc.lat,
                          inc.lng
                        );
                        return (
                          <option key={inc.id} value={inc.id}>
                            L{inc.priorityScore} ({incDist ? `${incDist}km` : ''}) - {inc.description.substring(0, 16)}...
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}