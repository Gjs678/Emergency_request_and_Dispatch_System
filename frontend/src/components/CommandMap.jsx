import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css'; // Make sure CSS is imported!

// Custom Leaflet DivIcons for Emergency Incidents
const createIncidentIcon = (score, status) => {
  let colorClass = 'bg-emerald-500 border-emerald-300';
  let pulseClass = '';

  if (score === 5) {
    colorClass = 'bg-red-600 border-red-300 text-white';
    pulseClass = 'animate-ping opacity-75 bg-red-500';
  } else if (score === 4) {
    colorClass = 'bg-orange-500 border-orange-300 text-white';
  } else if (score === 3) {
    colorClass = 'bg-yellow-500 border-yellow-200 text-black';
  } else if (score === 2) {
    colorClass = 'bg-blue-500 border-blue-200 text-white';
  }

  const html = `
    <div class="relative flex items-center justify-center">
      ${score >= 4 ? `<div class="absolute w-8 h-8 rounded-full ${pulseClass}"></div>` : ''}
      <div class="w-7 h-7 rounded-full ${colorClass} border-2 flex items-center justify-center font-mono font-extrabold text-xs shadow-xl">
        ${score}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-incident-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Custom Vehicle Icons
const createResponderIcon = (type, status) => {
  let emoji = '🚨';
  let bgColor = 'bg-blue-600 border-blue-400';

  switch (type) {
    case 'AMBULANCE':
      emoji = '🚑';
      bgColor = 'bg-emerald-600 border-emerald-300';
      break;
    case 'FIRE_ENGINE':
      emoji = '🚒';
      bgColor = 'bg-red-600 border-red-300';
      break;
    case 'POLICE_UNIT':
      emoji = '🚓';
      bgColor = 'bg-blue-600 border-blue-300';
      break;
    case 'SWAT':
      emoji = '🛡️';
      bgColor = 'bg-slate-800 border-slate-400';
      break;
    case 'HAZMAT':
      emoji = '☣️';
      bgColor = 'bg-amber-600 border-amber-300';
      break;
    default:
      emoji = '🚨';
  }

  const isAvailable = status === 'AVAILABLE';
  const statusRing = isAvailable ? 'ring-2 ring-emerald-400' : 'opacity-70 grayscale-[30%]';

  const html = `
    <div class="w-8 h-8 rounded-full ${bgColor} ${statusRing} flex items-center justify-center text-sm shadow-xl transform transition-all duration-200 hover:scale-125">
      ${emoji}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-responder-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function CommandMap({ incidents = [], responders = [], onAssignResponder }) {
  const [mapCenter] = useState([12.8700, 74.8420]); // Centered on central Mangalore
  const [, setDropTargetIncident] = useState(null);

  // Keep handleDragOver function for drop targets only
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
      console.error('Drop parse error:', err);
    }
  };

  return (
    /* FIXED: Removed onDragOver={handleDragOver} from root div so map dragging works! */
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#1E293B] shadow-2xl bg-[#090D14]">
      {/* Map Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#131B2A]/90 backdrop-blur-md border border-[#1E293B] p-3 rounded-xl text-xs space-y-1.5 shadow-xl font-mono">
        <div className="font-bold text-slate-300 uppercase mb-1 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>Incident Map Legend</span>
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
          <span className="text-slate-300">Level 5: Critical</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-slate-300">Level 4: High</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="text-slate-300">Level 3: Medium</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-slate-300">Level 1-2: Low</span>
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        dragging={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {incidents.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.lat, inc.lng]}
            icon={createIncidentIcon(inc.priorityScore, inc.status)}
            eventHandlers={{
              mouseover: () => setDropTargetIncident(inc.id),
              mouseout: () => setDropTargetIncident(null),
            }}
          >
            <Popup>
              {/* Attachment point for onDragOver & onDrop strictly within the popup target */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnIncident(e, inc.id)}
                className="p-1 space-y-2 text-slate-100 font-sans"
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                  <span className="text-xs font-mono font-bold text-red-400">
                    PRIORITY {inc.priorityScore}/5
                  </span>
                  <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                    {inc.status}
                  </span>
                </div>
                <p className="text-xs font-medium leading-tight text-slate-200">
                  {inc.description}
                </p>
                {inc.responder ? (
                  <div className="text-[10px] font-mono text-emerald-400">
                    Assigned: {inc.responder.name}
                  </div>
                ) : (
                  <div className="p-2 rounded bg-cyan-950/60 border border-cyan-800 text-[10px] font-mono text-cyan-300 text-center">
                    🎯 Drop Responder Unit Here to Dispatch
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {responders.map((resp) => (
          <Marker
            key={resp.id}
            position={[resp.lat, resp.lng]}
            icon={createResponderIcon(resp.type, resp.status)}
          >
            <Popup>
              <div className="p-1 text-slate-100 font-sans">
                <div className="text-xs font-bold text-emerald-400">{resp.name}</div>
                <div className="text-[10px] font-mono text-slate-400">
                  Type: {resp.type} • Status: <span className="text-cyan-300">{resp.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}