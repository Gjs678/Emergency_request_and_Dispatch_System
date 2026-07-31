import React, { useState } from 'react';
import { AlertCircle, Zap, Send, CheckCircle2, Clock, Activity, ShieldAlert, ArrowRight } from 'lucide-react';

export default function IncidentQueue({
  pendingIncidents,
  activeIncidents,
  onUpdateStatus,
  onNotifyPubSub,
  onAssignResponder, // Added prop for drop assignment
  activeTab,
  setActiveTab,
}) {
  const [notifyingId, setNotifyingId] = useState(null);

  const displayList = activeTab === 'pending' ? pendingIncidents : activeIncidents;

  const handlePubSubClick = async (requestId) => {
    setNotifyingId(requestId);
    try {
      await onNotifyPubSub(requestId);
    } finally {
      setTimeout(() => setNotifyingId(null), 1000);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropOnIncident = (e, incidentId) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.responderId && onAssignResponder) {
          onAssignResponder(incidentId, data.responderId);
        }
      }
    } catch (err) {
      console.error('Drop assignment error:', err);
    }
  };

  const getPriorityBadge = (score) => {
    switch (score) {
      case 5:
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-black rounded-md bg-red-600/30 text-red-400 border border-red-500/60 animate-pulse flex items-center space-x-1 shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CRITICAL [5]</span>
          </span>
        );
      case 4:
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>HIGH [4]</span>
          </span>
        );
      case 3:
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5" />
            <span>MEDIUM [3]</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>LOW [{score}]</span>
          </span>
        );
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      case 'ASSIGNED': return 'bg-yellow-950/60 text-yellow-400 border-yellow-800/80';
      case 'EN_ROUTE': return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/80';
      case 'ON_SCENE': return 'bg-blue-950/60 text-blue-400 border-blue-800/80';
      case 'RESOLVED': return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="bg-[#131B2A] border border-[#1E293B] rounded-xl p-5 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-yellow-400" />
          <h2 className="text-md font-bold tracking-wide text-slate-100 uppercase">
            Incident Priority Queue
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-[#0B0F17] p-1 rounded-lg border border-[#1E293B]">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1 text-xs font-mono rounded-md font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Redis Pending ({pendingIncidents.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1 text-xs font-mono rounded-md font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Cached ({activeIncidents.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {displayList.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-12 flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mb-2" />
            <span>No emergency incidents in this queue.</span>
          </div>
        ) : (
          displayList.map((inc, index) => (
            <div
              key={inc.id}
              /* Drag and Drop event listeners attached directly to incident cards */
              onDragOver={handleDragOver}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnIncident(e, inc.id)}
              className="bg-[#0B0F17] border border-[#1E293B] hover:border-cyan-500/50 p-4 rounded-xl space-y-3 transition-all relative group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-500 font-bold">#{index + 1}</span>
                  {getPriorityBadge(inc.priorityScore)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${getStatusStyle(inc.status)}`}>
                    {inc.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(inc.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="text-sm font-medium text-slate-200 leading-snug">
                {inc.description}
              </div>

              {inc.riskFactors && inc.riskFactors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {inc.riskFactors.map((rf, i) => (
                    <span key={i} className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {rf}
                    </span>
                  ))}
                </div>
              )}

              {inc.responder ? (
                <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-lg flex items-center justify-between">
                  <span>Assigned Unit: {inc.responder.name}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-300">{inc.responder.type}</span>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-cyan-400/70 border border-dashed border-cyan-800/60 bg-cyan-950/20 px-2 py-1 rounded text-center">
                  🎯 Drop Responder Here to Dispatch
                </div>
              )}

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 flex-wrap">
                {/* Status lifecycle actions */}
                <div className="flex items-center space-x-1.5 flex-wrap">
                  {inc.status === 'ASSIGNED' && (
                    <button
                      onClick={() => onUpdateStatus(inc.id, 'EN_ROUTE')}
                      className="px-2 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border border-cyan-700/50 text-[10px] font-mono font-bold rounded cursor-pointer"
                    >
                      En Route →
                    </button>
                  )}
                  {inc.status === 'EN_ROUTE' && (
                    <button
                      onClick={() => onUpdateStatus(inc.id, 'ON_SCENE')}
                      className="px-2 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-700/50 text-[10px] font-mono font-bold rounded cursor-pointer"
                    >
                      On Scene →
                    </button>
                  )}
                  {(inc.status === 'PENDING' || inc.status === 'ASSIGNED' || inc.status === 'EN_ROUTE' || inc.status === 'ON_SCENE') && (
                    <button
                      onClick={() => onUpdateStatus(inc.id, 'RESOLVED')}
                      className="px-2 py-1 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50 text-[10px] font-mono font-bold rounded cursor-pointer"
                    >
                      ✓ Resolve
                    </button>
                  )}
                </div>

                {/* Redis Pub/Sub Button */}
                <button
                  onClick={() => handlePubSubClick(inc.id)}
                  disabled={notifyingId === inc.id}
                  className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold rounded flex items-center space-x-1 transition-all cursor-pointer"
                  title="Trigger API #6: Redis Pub/Sub event for external dispatch system"
                >
                  <Send className="w-3 h-3 text-purple-400" />
                  <span>{notifyingId === inc.id ? 'PUBLISHING...' : 'REDIS PUB/SUB DISPATCH'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}