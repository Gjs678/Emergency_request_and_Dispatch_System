import React, { useState, useEffect } from 'react';
import { emergencyApi } from './services/api';
import socket from './services/socket';
import CommandMap from './components/CommandMap';
import ResponderPanel from './components/ResponderPanel';
import IncidentQueue from './components/IncidentQueue';
import AISandbox from './components/AISandbox';
import LiveTicker from './components/LiveTicker';
import CreateIncidentModal from './components/CreateIncidentModal';
import FleetManagement from './components/FleetManagement';
import { ShieldAlert, Radio, Database, PlusCircle, RefreshCw, Layers, LayoutDashboard, Truck } from 'lucide-react';

export default function App() {
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [streamEvents, setStreamEvents] = useState([]);
  const [latestLevel5Event, setLatestLevel5Event] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'fleet'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingRes, activeRes, respRes] = await Promise.all([
        emergencyApi.getPending(),
        emergencyApi.getActive(),
        emergencyApi.getResponders(),
      ]);

      if (pendingRes.success) setPendingIncidents(pendingRes.data);
      if (activeRes.success) setActiveIncidents(activeRes.data);
      if (respRes.success) setResponders(respRes.data);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Socket.io event listeners
    socket.on('connect', () => {
      setConnected(true);
      addStreamEvent('WebSocket connected to Command Center server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      addStreamEvent('WebSocket disconnected from server');
    });

    socket.on('NEW_INCIDENT', (incident) => {
      addStreamEvent(`NEW INCIDENT: [Level ${incident.priorityScore}] ${incident.description}`);
      if (incident.priorityScore === 5) {
        setLatestLevel5Event(incident);
      }
      loadData();
    });

    socket.on('DISPATCH_ASSIGNED', (data) => {
      addStreamEvent(`DISPATCH ASSIGNED: Unit ${data.responder?.name} -> Request #${data.requestId.substring(0, 8)}`);
      loadData();
    });

    socket.on('STATUS_UPDATED', (data) => {
      addStreamEvent(`STATUS CHANGE: Incident #${data.requestId.substring(0, 8)} -> ${data.status}`);
      loadData();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('NEW_INCIDENT');
      socket.off('DISPATCH_ASSIGNED');
      socket.off('STATUS_UPDATED');
    };
  }, []);

  const addStreamEvent = (message) => {
    const time = new Date().toLocaleTimeString();
    setStreamEvents((prev) => [{ time, message }, ...prev.slice(0, 15)]);
  };

  // API Handlers
  const handleCreateIncident = async (payload) => {
    const res = await emergencyApi.createIncident(payload);
    if (res.success) {
      addStreamEvent(`Incident #${res.data.id.substring(0, 8)} created & queued in Redis`);
      await loadData();
    }
  };

  const handleAssignResponder = async (requestId, responderId) => {
    try {
      const res = await emergencyApi.assignResponder({ request_id: requestId, responder_id: responderId });
      if (res.success) {
        addStreamEvent(`Unit assigned to incident successfully`);
        await loadData();
      }
    } catch (err) {
      console.error('Assign error:', err);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      const res = await emergencyApi.updateStatus({ request_id: requestId, status });
      if (res.success) {
        addStreamEvent(`Status updated to ${status}`);
        await loadData();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleNotifyPubSub = async (requestId) => {
    try {
      const res = await emergencyApi.notifyExternalDispatch({ request_id: requestId });
      if (res.success) {
        addStreamEvent(`⚡ Redis Pub/Sub notification published for #${requestId.substring(0, 8)}`);
      }
    } catch (err) {
      console.error('PubSub notify error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col font-sans select-none text-slate-100">
      {/* Tactical Top Navigation Bar */}
      <header className="bg-[#131B2A] border-b border-[#1E293B] px-6 py-3 flex items-center justify-between shadow-2xl z-20">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-red-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
                EMERGENCY COMMAND CENTER
              </h1>
              <p className="text-[11px] font-mono text-slate-400">
                AI Priority Queue & Real-time Redis Dispatch Platform
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <nav className="hidden lg:flex items-center bg-[#0B0F17] p-1 rounded-xl border border-[#1E293B] font-mono text-xs">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-cyan-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>COMMAND DASHBOARD</span>
            </button>
            <button
              onClick={() => setCurrentView('fleet')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                currentView === 'fleet'
                  ? 'bg-cyan-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>FLEET MANAGEMENT</span>
            </button>
          </nav>
        </div>

        {/* System Status Indicators */}
        <div className="hidden xl:flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#0B0F17] border border-[#1E293B] text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">POSTGRES + PRISMA:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#0B0F17] border border-[#1E293B] text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-slate-400">REDIS ZADD QUEUE:</span>
            <span className="text-yellow-400 font-bold">{pendingIncidents.length} QUEUED</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#0B0F17] border border-[#1E293B] text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
            <span className="text-slate-400">WEBSOCKETS:</span>
            <span className={connected ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#0B0F17] border border-[#1E293B] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-pointer"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/60 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>NEW EMERGENCY (API #1)</span>
          </button>
        </div>
      </header>

      {/* Live Stream Ticker Bar */}
      <LiveTicker streamEvents={streamEvents} latestLevel5Event={latestLevel5Event} />

      {/* Main Command Center Workspace */}
      <main className="flex-1 p-4 max-w-[1920px] mx-auto w-full">
        {currentView === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-140px)]">
            {/* Left Column: Incident Priority Queue (4 cols) */}
            <div className="lg:col-span-4 h-full">
              <IncidentQueue
                pendingIncidents={pendingIncidents}
                activeIncidents={activeIncidents}
                onUpdateStatus={handleUpdateStatus}
                onNotifyPubSub={handleNotifyPubSub}
                onAssignResponder={handleAssignResponder}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>

            {/* Center Column: Interactive Command Map (5 cols) */}
            <div className="lg:col-span-5 h-full">
              <CommandMap
                incidents={activeIncidents}
                responders={responders}
                onAssignResponder={handleAssignResponder}
              />
            </div>

            {/* Right Column: AI Sandbox & Responder Fleet (3 cols) */}
            <div className="lg:col-span-3 flex flex-col space-y-4 h-full">
              <div className="flex-1">
                <AISandbox onCreateIncident={handleCreateIncident} />
              </div>
              <div className="flex-1">
                <ResponderPanel
                  responders={responders}
                  onManualAssign={handleAssignResponder}
                  activeIncidents={activeIncidents}
                />
              </div>
            </div>
          </div>
        ) : (
          <FleetManagement />
        )}
      </main>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateIncident}
      />
    </div>
  );
}