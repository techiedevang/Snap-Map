import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { loadNeedsFrom311 } from '../services/dataService';
import type { NeedReport } from '../services/dataService';
import StoryCard from '../components/StoryCard';
import InputFab from '../components/InputFab';
import './MapHome.css';

// Custom Map Marker using HTML/CSS for the urgency pulse
const createPulseIcon = (urgency: number) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="pulse-marker" style="background-color: ${urgency >= 8 ? 'var(--accent-critical)' : 'var(--accent-primary)'}; width: ${urgency * 2 + 10}px; height: ${urgency * 2 + 10}px; animation-duration: ${11 - urgency}s;"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapHome: React.FC = () => {
  const [needs, setNeeds] = useState<NeedReport[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<NeedReport | null>(null);
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default NYC

  useEffect(() => {
    const loadData = async () => {
      const data = await loadNeedsFrom311();
      setNeeds(data);
      if (data.length > 0) {
        setCenter([data[0].lat, data[0].lng]);
      }
    };
    loadData();
  }, []);

  const handleCommit = (id: string) => {
    const report = needs.find(n => n.id === id);
    if (!report) return;

    // Save to localStorage for Profile page
    const existing = JSON.parse(localStorage.getItem('committed_tasks') || '[]');
    const newTask = {
      id: report.id,
      title: report.title,
      location: report.category,
      peopleHelped: report.peopleAffected ?? 0,
      timeSpent: report.timeNeeded ?? '1 hr',
      committedAt: Date.now(),
    };
    localStorage.setItem('committed_tasks', JSON.stringify([...existing, newTask]));

    setNeeds(needs.map(n => n.id === id ? { ...n, status: 'claimed' } : n));
    setSelectedNeed(null);
    alert('Thank you! You have committed to this task. The community has been notified.');
  };

  const handleNewReport = (report: NeedReport) => {
    setNeeds(prev => [report, ...prev]);
    setCenter([report.lat, report.lng]);
  };

  return (
    <div className="map-home-container">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapUpdater center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {needs.filter(n => n.status === 'open').map(need => (
          <Marker
            key={need.id}
            position={[need.lat, need.lng]}
            icon={createPulseIcon(need.urgency)}
            eventHandlers={{
              click: () => setSelectedNeed(need)
            }}
          >
            <Popup>
              <strong>{need.title}</strong>
              <br />
              Urgency: {need.urgency}/10
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedNeed && (
        <div className="story-card-overlay">
          <StoryCard
            need={selectedNeed}
            onCommit={handleCommit}
            onClose={() => setSelectedNeed(null)}
          />
        </div>
      )}

      {/* Input FAB for Snap & Map / Voice */}
      <InputFab onReportAdded={handleNewReport} />

      {/* Top 5 Fires Dashboard Overlay */}
      <div className="top-fires glass">
        <h3>🔥 Top Fires This Week</h3>
        <ul>
          {needs
            .filter(n => n.status === 'open')
            .sort((a, b) => b.urgency - a.urgency)
            .slice(0, 3)
            .map(n => (
              <li key={n.id} onClick={() => { setCenter([n.lat, n.lng]); setSelectedNeed(n); }}>
                <span className="fire-urgency">{n.urgency}</span>
                <span className="fire-title">{n.title}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default MapHome;
