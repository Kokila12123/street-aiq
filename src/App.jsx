import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Activity, 
  Truck, 
  MapPin, 
  AlertTriangle, 
  Settings as SettingsIcon, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  Navigation, 
  X, 
  Bell, 
  User, 
  Clock, 
  RotateCcw,
  Sliders,
  Layers,
  Cpu,
  RefreshCw,
  TrendingUp,
  Map as MapIcon,
  Search,
  Eye,
  Info
} from 'lucide-react';

import { 
  MAP_CENTER, 
  MAP_ZOOM, 
  ROUTES, 
  INITIAL_VEHICLES, 
  CLEANLINESS_SEGMENTS, 
  ROAD_HEALTH_ANOMALIES, 
  CAMERA_CLASSES,
  drawAIDetectionOverlay
} from './mockData';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Simulation States
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [alerts, setAlerts] = useState([
    {
      id: 'init-1',
      type: 'Severe Pothole',
      severity: 'High',
      coordinates: [42.3621, -71.0589],
      street: 'Congress St & State St',
      confidence: 0.96,
      status: 'Pending',
      detectedBy: 'V-101',
      time: '14:32:10',
      category: 'health'
    },
    {
      id: 'init-2',
      type: 'Plastic Waste Accumulation',
      severity: 'Medium',
      coordinates: [42.3650, -71.0550],
      street: 'Commercial St Sweep',
      confidence: 0.88,
      status: 'Pending',
      detectedBy: 'V-102',
      time: '14:30:15',
      category: 'cleanliness'
    }
  ]);
  
  const [cleanlinessSegments, setCleanlinessSegments] = useState(CLEANLINESS_SEGMENTS);
  const [roadAnomalies, setRoadAnomalies] = useState(ROAD_HEALTH_ANOMALIES);
  const [toasts, setToasts] = useState([]);
  
  // Fleet Manager Form States
  const [newVehicle, setNewVehicle] = useState({
    id: '',
    name: '',
    type: 'Sweeper',
    driver: '',
    route: 'Downtown Loop',
    color: '#3b82f6'
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState('V-101');
  const [fleetSearchQuery, setFleetSearchQuery] = useState('');

  // Settings States
  const [settings, setSettings] = useState({
    speedMultiplier: 1,
    detectionThreshold: 80,
    enableSound: false,
    notificationsEnabled: true,
    mapTheme: 'dark',
    activeModel: 'SmartCity Unified-CV v4.2'
  });

  // Reference for GPS Sim Timer
  const simTimerRef = useRef(null);

  // Trigger Toast Notification helper
  const addToast = (title, message, type = 'info') => {
    if (!settings.notificationsEnabled) return;
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Close Toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // GPS Simulation Loop
  useEffect(() => {
    // Clear any existing interval
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    const intervalTime = 1200 / settings.speedMultiplier;
    simTimerRef.current = setInterval(() => {
      setVehicles(prevVehicles => {
        return prevVehicles.map(vehicle => {
          if (vehicle.status !== 'Active') return vehicle;
          
          const routeCoords = ROUTES[vehicle.route];
          if (!routeCoords) return vehicle;

          // Progress to next index
          const nextIndex = (vehicle.routeIndex + 1) % routeCoords.length;
          
          // Random telemetry updates
          const speedFluctuation = Math.floor(Math.random() * 5) - 2;
          const newSpeed = Math.max(10, Math.min(45, vehicle.speed + speedFluctuation));

          return {
            ...vehicle,
            routeIndex: nextIndex,
            speed: newSpeed
          };
        });
      });
    }, intervalTime);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [settings.speedMultiplier]);

  // Handle addition of a new vehicle
  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (!newVehicle.id || !newVehicle.name || !newVehicle.driver) {
      addToast('Validation Error', 'Please fill in all vehicle details.', 'warning');
      return;
    }

    if (vehicles.find(v => v.id.toLowerCase() === newVehicle.id.toLowerCase())) {
      addToast('ID Conflict', 'A vehicle with this ID already exists.', 'danger');
      return;
    }

    const created = {
      ...newVehicle,
      status: 'Active',
      speed: 20,
      cleanliness: 95,
      potholesFound: 0,
      routeIndex: 0,
      activeModel: settings.activeModel
    };

    setVehicles(prev => [...prev, created]);
    addToast('Vehicle Added', `${created.name} (${created.id}) has been registered and is tracking.`, 'success');
    
    // Reset Form
    setNewVehicle({
      id: '',
      name: '',
      type: 'Sweeper',
      driver: '',
      route: 'Downtown Loop',
      color: '#10b981'
    });
  };

  // Toggle vehicle active status
  const toggleVehicleStatus = (id) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === id) {
        const nextStatus = v.status === 'Active' ? 'Inactive' : 'Active';
        addToast(
          'Vehicle Status Changed', 
          `${v.name} is now ${nextStatus.toLowerCase()}`, 
          nextStatus === 'Active' ? 'success' : 'warning'
        );
        return { ...v, status: nextStatus };
      }
      return v;
    }));
  };

  // Remove vehicle
  const removeVehicle = (id) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    addToast('Vehicle Removed', `Vehicle ${id} has been decommissioned.`, 'danger');
  };

  // Handle detection events triggered from AI Video Simulator component
  const handleAIDetection = (type, label, confidence) => {
    // Select a vehicle currently running the feed (defaulting to the selected vehicle or a random one on that route)
    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
    const currentCoords = ROUTES[activeVehicle.route][activeVehicle.routeIndex];
    
    // Add offset slightly so they don't exactly stack
    const reportCoords = [
      currentCoords[0] + (Math.random() - 0.5) * 0.0005,
      currentCoords[1] + (Math.random() - 0.5) * 0.0005
    ];

    const timeString = new Date().toLocaleTimeString();
    const newAlert = {
      id: `ai-alert-${Date.now()}`,
      type: label,
      severity: confidence > 0.9 ? 'High' : 'Medium',
      coordinates: reportCoords,
      street: `${activeVehicle.route} (Sector ${activeVehicle.routeIndex + 1})`,
      confidence: confidence,
      status: 'Pending',
      detectedBy: activeVehicle.id,
      time: timeString,
      category: type
    };

    // Prepend alert
    setAlerts(prev => [newAlert, ...prev]);

    // Apply to Map layers
    if (type === 'cleanliness') {
      // Degrade nearest cleanliness segment score
      setCleanlinessSegments(prev => prev.map((seg, idx) => {
        if (idx === 2 || idx === 4) { // Mock degradation on target loops
          return { ...seg, level: 'Dirty', score: Math.max(20, seg.score - 15), lastScanned: 'Just now' };
        }
        return seg;
      }));
      addToast('AI Cleanliness Alert', `Trash detected: ${label} (${(confidence * 100).toFixed(0)}% confidence) by ${activeVehicle.name}`, 'warning');
    } else {
      // Add pothole anomaly
      const newAnomaly = {
        id: `anomaly-${Date.now()}`,
        type: label,
        severity: confidence > 0.9 ? 'High' : 'Medium',
        coordinates: reportCoords,
        street: `${activeVehicle.route} near Checkpoint ${activeVehicle.routeIndex}`,
        confidence: Math.round(confidence * 100),
        status: 'Pending',
        detectedBy: activeVehicle.id,
        time: 'Just now'
      };
      setRoadAnomalies(prev => [newAnomaly, ...prev]);
      
      // Update vehicle statistics
      setVehicles(prev => prev.map(v => {
        if (v.id === activeVehicle.id) {
          return { ...v, potholesFound: v.potholesFound + 1 };
        }
        return v;
      }));

      addToast('AI Road Damage Alert', `${label} detected! Status flagged at coordinates.`, 'danger');
    }
  };

  // Map Component Wrapper using leaflet direct refs
  const MapContainer = ({ mode, selectedVehicle }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markers = useRef({});
    const routesPolylines = useRef({});
    const cleanlinessLines = useRef([]);
    const anomalyMarkers = useRef([]);

    // Initialize Map
    useEffect(() => {
      if (!mapRef.current) return;

      // Create Map
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(MAP_CENTER, MAP_ZOOM);

      // Add Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapInstance.current);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

      // Clean up map when component unmounts
      return () => {
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    }, []);

    // Draw Static Routes and Cleanliness Overlays
    useEffect(() => {
      if (!mapInstance.current) return;

      // Clear any existing cleanliness lines or routing lines
      cleanlinessLines.current.forEach(l => l.remove());
      cleanlinessLines.current = [];
      
      Object.keys(routesPolylines.current).forEach(k => routesPolylines.current[k].remove());
      routesPolylines.current = {};

      if (mode === 'cleanliness') {
        // Draw Cleanliness color-coded lines
        cleanlinessSegments.forEach(seg => {
          let color = '#10b981'; // Green
          if (seg.level === 'Moderate') color = '#f59e0b'; // Orange
          if (seg.level === 'Dirty') color = '#ef4444'; // Red

          const line = L.polyline(seg.coordinates, {
            color: color,
            weight: 6,
            opacity: 0.85
          }).addTo(mapInstance.current)
            .bindPopup(`<strong>${seg.name}</strong><br/>Cleanliness Score: ${seg.score}% (${seg.level})<br/>Last Scan: ${seg.lastScanned}`);
          
          cleanlinessLines.current.push(line);
        });
      } else {
        // Draw subtle grey paths for standard tracking
        Object.entries(ROUTES).forEach(([routeName, coords]) => {
          const isSelected = selectedVehicle && selectedVehicle.route === routeName;
          const routeLine = L.polyline(coords, {
            color: isSelected ? selectedVehicle.color : 'rgba(255,255,255,0.15)',
            weight: isSelected ? 4 : 2,
            opacity: isSelected ? 0.9 : 0.4,
            dashArray: isSelected ? null : '5, 5'
          }).addTo(mapInstance.current);
          
          routesPolylines.current[routeName] = routeLine;
        });
      }
    }, [mode, selectedVehicle, cleanlinessSegments]);

    // Handle Road Health Anomalies (Potholes, Cracks) Markers
    useEffect(() => {
      if (!mapInstance.current) return;

      // Clear previous anomaly markers
      anomalyMarkers.current.forEach(m => m.remove());
      anomalyMarkers.current = [];

      if (mode === 'health') {
        roadAnomalies.forEach(anom => {
          let markerColor = '#ef4444'; // High severity
          if (anom.severity === 'Medium') markerColor = '#f59e0b';
          if (anom.severity === 'Low') markerColor = '#a855f7';

          const icon = L.divIcon({
            className: 'custom-hazard-marker',
            html: `<div style="width: 14px; height: 14px; background: ${markerColor}; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px ${markerColor}; animation: pulse-ring 2s infinite;"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          const marker = L.marker(anom.coordinates, { icon: icon })
            .addTo(mapInstance.current)
            .bindPopup(`<strong>${anom.type}</strong><br/>Street: ${anom.street}<br/>Severity: ${anom.severity}<br/>Confidence: ${anom.confidence}%<br/>Status: ${anom.status}`);
          
          anomalyMarkers.current.push(marker);
        });
      }
    }, [mode, roadAnomalies]);

    // Animate Vehicles Marker position
    useEffect(() => {
      if (!mapInstance.current) return;

      vehicles.forEach(vehicle => {
        const routeCoords = ROUTES[vehicle.route];
        if (!routeCoords) return;
        const coords = routeCoords[vehicle.routeIndex];

        if (!markers.current[vehicle.id]) {
          // Create marker
          const html = `<div style="width:16px; height:16px; border-radius:50%; background:${vehicle.color}; border:2px solid #ffffff; box-shadow:0 0 8px ${vehicle.color}"></div>`;
          const icon = L.divIcon({
            className: 'leaflet-vehicle-icon',
            html: html,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          const marker = L.marker(coords, { icon: icon })
            .addTo(mapInstance.current)
            .bindPopup(`<strong>${vehicle.name} (${vehicle.id})</strong><br/>Type: ${vehicle.type}<br/>Driver: ${vehicle.driver}<br/>Speed: ${vehicle.speed} mph<br/>Route: ${vehicle.route}`);
          
          markers.current[vehicle.id] = marker;
        } else {
          // Move Marker position smoothly
          markers.current[vehicle.id].setLatLng(coords);
          markers.current[vehicle.id].setPopupContent(`<strong>${vehicle.name} (${vehicle.id})</strong><br/>Type: ${vehicle.type}<br/>Driver: ${vehicle.driver}<br/>Speed: ${vehicle.speed} mph<br/>Route: ${vehicle.route}`);
        }
      });

      // Remove decommissioned vehicles
      Object.keys(markers.current).forEach(id => {
        if (!vehicles.find(v => v.id === id)) {
          markers.current[id].remove();
          delete markers.current[id];
        }
      });

      // Auto Pan to selected vehicle if requested
      if (selectedVehicle) {
        const routeCoords = ROUTES[selectedVehicle.route];
        if (routeCoords && routeCoords[selectedVehicle.routeIndex]) {
          mapInstance.current.panTo(routeCoords[selectedVehicle.routeIndex]);
        }
      }
    }, [vehicles, selectedVehicle]);

    return (
      <div className="map-outer-container">
        <div ref={mapRef} className="map-element" />
        
        {/* Render Map Legend conditionally */}
        {mode === 'cleanliness' && (
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#10b981' }}></div>
              <span>Clean Road (90-100%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#f59e0b' }}></div>
              <span>Moderate Litter (60-89%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }}></div>
              <span>Dirty / Heavy Litter (&lt;60%)</span>
            </div>
          </div>
        )}

        {mode === 'health' && (
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color legend-circle" style={{ background: '#ef4444' }}></div>
              <span>Severe Pothole (High)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-circle" style={{ background: '#f59e0b' }}></div>
              <span>Asphalt Crack (Medium)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-circle" style={{ background: '#a855f7' }}></div>
              <span>Sunken Manhole (Low)</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // AI Dashcam Canvas Component
  const AICameraFeed = ({ type, onDetectionTriggered }) => {
    const canvasRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(true);
    const frameCountRef = useRef(0);
    const activeDetectionsRef = useRef([]);

    useEffect(() => {
      if (!isStreaming) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Adjust high resolution backing store
      canvas.width = 640;
      canvas.height = 360;

      let animationFrameId;

      const render = () => {
        frameCountRef.current += 1;

        // Manage active objects in frame
        let detections = activeDetectionsRef.current;

        // Spawn a new detection occasionally
        if (detections.length === 0 && frameCountRef.current % 180 === 0) {
          const classes = CAMERA_CLASSES[type];
          const randomClass = classes[Math.floor(Math.random() * classes.length)];
          
          detections.push({
            id: `det-${Date.now()}`,
            label: randomClass.label,
            color: randomClass.color,
            x: 0.45 + Math.random() * 0.1, // Center lane
            y: 0.4,
            w: 0.08,
            h: 0.06,
            confidence: 0.78 + Math.random() * 0.2,
            speed: 0.007 + Math.random() * 0.004,
            triggeredAlert: false
          });
        }

        // Update positions
        detections.forEach(det => {
          det.y += det.speed;
          // Scale size larger as it moves forward
          det.w += det.speed * 0.35;
          det.h += det.speed * 0.28;

          // Trigger Alert when item crosses 85% depth
          if (det.y >= 0.85 && !det.triggeredAlert) {
            det.triggeredAlert = true;
            onDetectionTriggered(type, det.label, det.confidence);
          }
        });

        // Clean out offscreen detections
        activeDetectionsRef.current = detections.filter(det => det.y < 1.0);

        // Draw Frame
        drawAIDetectionOverlay(canvas, type, frameCountRef.current, activeDetectionsRef.current);

        animationFrameId = requestAnimationFrame(render);
      };

      render();

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, [isStreaming, type, onDetectionTriggered]);

    return (
      <div className="camera-feed-container">
        <canvas ref={canvasRef} className="camera-canvas" />
        <div className={`camera-badge ${type === 'cleanliness' ? 'green' : ''}`}>
          <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', animation: 'pulse-ring 1s infinite' }} />
          Live Cam - AI {type === 'cleanliness' ? 'Cleanliness' : 'Health'} Monitoring
        </div>
        <div className="camera-hud">
          <div className="hud-left">
            <h4>CV MODEL: {settings.activeModel}</h4>
            <p>Active Vehicle: {vehicles.find(v => v.id === selectedVehicleId)?.name || 'EcoSweeper Pro'}</p>
          </div>
          <div className="hud-right">
            <div>CAM-V-FRONT</div>
            <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: 4 }}>DETECTION LATENCY: 24ms</div>
          </div>
        </div>
      </div>
    );
  };

  // Find Active Vehicle object by ID
  const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div className="app-container">
      
      {/* Toast Notifications Panel */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-msg">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <Activity size={20} />
          </div>
          <div>
            <div className="logo-text">AegisCity AI</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>METROPOLIS DASHBOARD</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} />
            <span>Master Dashboard</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveTab('fleet')}
          >
            <Truck size={18} />
            <span>Fleet & Routes</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'cleanliness' ? 'active' : ''}`}
            onClick={() => setActiveTab('cleanliness')}
          >
            <Sparkles size={18} />
            <span>Street Cleanliness</span>
            <span className="nav-badge">AI</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            <AlertTriangle size={18} />
            <span>Road Health</span>
            <span className="nav-badge">AI</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={18} />
            <span>System Settings</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div>System: <span style={{ color: 'var(--color-primary)' }}>Online</span></div>
          <div>CV Engine: <span style={{ color: 'var(--color-success)' }}>Active</span></div>
          <div style={{ marginTop: 8, fontSize: '0.7rem' }}>© 2026 AegisCity Technologies</div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        
        {/* Render Dashboard Page */}
        {activeTab === 'dashboard' && (
          <>
            <header className="content-header">
              <div className="content-title">
                <h1>Metropolis Control Center</h1>
                <p>Live Fleet Telemetry & Road Structural Analytics</p>
              </div>
              <div className="header-actions">
                <div style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} className="text-secondary" />
                  <span style={{ color: 'var(--text-secondary)' }}>GPS Refreshes: <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 'bold' }}>1.2s</span></span>
                </div>
              </div>
            </header>

            {/* KPI Cards Grid */}
            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-card-icon primary">
                  <Truck size={24} />
                </div>
                <div className="kpi-card-info">
                  <h3>Active Fleet</h3>
                  <p>{vehicles.filter(v => v.status === 'Active').length} / {vehicles.length}</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-card-icon success">
                  <Sparkles size={24} />
                </div>
                <div className="kpi-card-info">
                  <h3>Avg Cleanliness</h3>
                  <p>82.5%</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-card-icon warning">
                  <AlertTriangle size={24} />
                </div>
                <div className="kpi-card-info">
                  <h3>Active Anomalies</h3>
                  <p>{roadAnomalies.filter(a => a.status === 'Pending').length} Alerted</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-card-icon purple">
                  <Cpu size={24} />
                </div>
                <div className="kpi-card-info">
                  <h3>Model Accuracy</h3>
                  <p>94.2%</p>
                </div>
              </div>
            </section>

            {/* Main Interactive Map & Feed panels */}
            <div className="panel-row">
              <div className="card-panel">
                <div className="panel-header">
                  <MapIcon size={18} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <h3 className="panel-title">Fleet Tracking Live Map</h3>
                    <p className="panel-subtitle">Real-time GPS telemetry showing sweepers and patrol vehicles</p>
                  </div>
                </div>
                <MapContainer mode="dashboard" />
              </div>

              <div className="card-panel">
                <div className="panel-header">
                  <Bell size={18} style={{ color: 'var(--color-danger)' }} />
                  <div>
                    <h3 className="panel-title">Live AI System Alerts</h3>
                    <p className="panel-subtitle">CV detection logs from mobile street cameras</p>
                  </div>
                </div>
                
                <div className="alerts-list">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`alert-item ${alert.category === 'cleanliness' ? 'warning' : 'danger'}`}>
                      <div className={`alert-icon-wrap ${alert.category === 'cleanliness' ? 'warning' : 'danger'}`}>
                        {alert.category === 'cleanliness' ? <Sparkles size={16} /> : <AlertTriangle size={16} />}
                      </div>
                      <div className="alert-details">
                        <div className="alert-title-row">
                          <span className="alert-title">{alert.type}</span>
                          <span className="alert-time">{alert.time}</span>
                        </div>
                        <p className="alert-msg">Detected on {alert.street}. Flagged for review.</p>
                        <div className="alert-meta">
                          <span className="alert-meta-item">
                            <Truck size={12} /> {alert.detectedBy}
                          </span>
                          <span className="alert-meta-item">
                            Confidence: {(alert.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Render Fleet & Routes Page */}
        {activeTab === 'fleet' && (
          <>
            <header className="content-header">
              <div className="content-title">
                <h1>Fleet Control & Route Configuration</h1>
                <p>Register new vehicles and monitor live driver paths</p>
              </div>
            </header>

            <div className="split-layout">
              {/* Add Vehicle Panel */}
              <div className="card-panel">
                <div className="panel-header">
                  <Plus size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 className="panel-title">Add Smart Vehicle</h3>
                </div>

                <form onSubmit={handleAddVehicle}>
                  <div className="form-group">
                    <label>Vehicle ID (e.g. V-105)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. V-105"
                      value={newVehicle.id}
                      onChange={e => setNewVehicle(prev => ({ ...prev, id: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Vehicle / Model Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Urban Patrol Sweep"
                      value={newVehicle.name}
                      onChange={e => setNewVehicle(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Driver Assignment</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Alice G."
                      value={newVehicle.driver}
                      onChange={e => setNewVehicle(prev => ({ ...prev, driver: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Vehicle Category</label>
                    <select 
                      className="form-select"
                      value={newVehicle.type}
                      onChange={e => setNewVehicle(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="Sweeper">Sweeper (Litter Detection)</option>
                      <option value="Inspector">Inspector (Road Surface Damage)</option>
                      <option value="Pothole Repair">Pothole Patrol (Utility)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Assigned Route Path</label>
                    <select 
                      className="form-select"
                      value={newVehicle.route}
                      onChange={e => setNewVehicle(prev => ({ ...prev, route: e.target.value }))}
                    >
                      {Object.keys(ROUTES).map(rName => (
                        <option key={rName} value={rName}>{rName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Telemetry Marker Color</label>
                    <select 
                      className="form-select"
                      value={newVehicle.color}
                      onChange={e => setNewVehicle(prev => ({ ...prev, color: e.target.value }))}
                    >
                      <option value="#3b82f6">Standard Blue</option>
                      <option value="#10b981">Emerald Green</option>
                      <option value="#a855f7">Purple Vibe</option>
                      <option value="#ec4899">Neon Pink</option>
                      <option value="#f59e0b">Amber Gold</option>
                    </select>
                  </div>

                  <button type="submit" className="btn" style={{ width: '100%', marginTop: 8 }}>
                    <Plus size={16} /> Register & Launch
                  </button>
                </form>
              </div>

              {/* Monitor Route Panel */}
              <div className="card-panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Navigation size={18} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <h3 className="panel-title">Fleet Monitoring Hub</h3>
                      <p className="panel-subtitle">Select a vehicle to inspect live route paths and ETA status</p>
                    </div>
                  </div>
                  
                  {/* Search Filter */}
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Search fleet..." 
                      style={{ padding: '6px 12px 6px 32px', fontSize: '0.8rem', width: '180px' }}
                      value={fleetSearchQuery}
                      onChange={e => setFleetSearchQuery(e.target.value)}
                    />
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>ID</th>
                        <th>Vehicle Name</th>
                        <th>Driver</th>
                        <th>Route</th>
                        <th>Speed</th>
                        <th>Model Version</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles
                        .filter(v => v.id.toLowerCase().includes(fleetSearchQuery.toLowerCase()) || v.name.toLowerCase().includes(fleetSearchQuery.toLowerCase()) || v.driver.toLowerCase().includes(fleetSearchQuery.toLowerCase()))
                        .map(vehicle => (
                          <tr 
                            key={vehicle.id} 
                            style={{ cursor: 'pointer', background: selectedVehicleId === vehicle.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}
                            onClick={() => setSelectedVehicleId(vehicle.id)}
                          >
                            <td>
                              <span className={`status-badge ${vehicle.status.toLowerCase()}`}>
                                <span style={{ width: 6, height: 6, background: vehicle.status === 'Active' ? '#10b981' : '#64748b', borderRadius: '50%' }} />
                                {vehicle.status}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{vehicle.id}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, background: vehicle.color, borderRadius: '50%' }} />
                                {vehicle.name}
                              </div>
                            </td>
                            <td>{vehicle.driver}</td>
                            <td style={{ color: 'var(--color-primary)' }}>{vehicle.route}</td>
                            <td style={{ fontFamily: 'monospace' }}>{vehicle.speed} mph</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{vehicle.activeModel}</td>
                            <td onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button 
                                  className="btn secondary" 
                                  style={{ padding: '6px 10px' }}
                                  onClick={() => toggleVehicleStatus(vehicle.id)}
                                >
                                  {vehicle.status === 'Active' ? <Pause size={12} /> : <Play size={12} />}
                                </button>
                                <button 
                                  className="btn secondary" 
                                  style={{ padding: '6px 10px', color: 'var(--color-danger)' }}
                                  onClick={() => removeVehicle(vehicle.id)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={16} style={{ color: 'var(--color-primary)' }} /> Live Track Focus: {selectedVehicleObj?.name}
                  </h4>
                  <MapContainer mode="fleet" selectedVehicle={selectedVehicleObj} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Render Cleanliness Mapping & Detection */}
        {activeTab === 'cleanliness' && (
          <>
            <header className="content-header">
              <div className="content-title">
                <h1>AI Street Cleanliness Monitor</h1>
                <p>Detects waste, litter accumulation, and assesses cleanliness grade in real-time</p>
              </div>
            </header>

            <div className="panel-row">
              <div className="card-panel">
                <div className="panel-header">
                  <Sparkles size={18} style={{ color: 'var(--color-success)' }} />
                  <div>
                    <h3 className="panel-title">Cleanliness Heatmap Index</h3>
                    <p className="panel-subtitle">Highlighting road sweeps green (scanned clean) to red (dirty)</p>
                  </div>
                </div>
                <MapContainer mode="cleanliness" />
              </div>

              <div className="card-panel camera-panel">
                <div className="panel-header">
                  <Cpu size={18} style={{ color: 'var(--color-success)' }} />
                  <div>
                    <h3 className="panel-title">AI Camera Stream Simulator</h3>
                    <p className="panel-subtitle">Live dashcam object classifier on EcoSweeper Pro</p>
                  </div>
                </div>

                {/* AICamera Component */}
                <AICameraFeed type="cleanliness" onDetectionTriggered={handleAIDetection} />

                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>Scanned Segment Index</h4>
                  {cleanlinessSegments.map(seg => (
                    <div key={seg.id} className="stat-list-item">
                      <div className="stat-label-with-color">
                        <div className="color-dot" style={{ background: seg.level === 'Clean' ? '#10b981' : seg.level === 'Moderate' ? '#f59e0b' : '#ef4444' }} />
                        <span>{seg.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span className="score-text" style={{ color: seg.level === 'Clean' ? '#10b981' : seg.level === 'Moderate' ? '#f59e0b' : '#ef4444' }}>{seg.score}%</span>
                        <span style={{ color: 'var(--text-muted)' }}>{seg.lastScanned}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Render Road Health Mapping & Detection */}
        {activeTab === 'health' && (
          <>
            <header className="content-header">
              <div className="content-title">
                <h1>AI Road Health & Anomaly Tracker</h1>
                <p>Identifies structural failures, cracks, potholes, and alerts local city crews</p>
              </div>
            </header>

            <div className="panel-row">
              <div className="card-panel">
                <div className="panel-header">
                  <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
                  <div>
                    <h3 className="panel-title">Structural Anomaly Mapping</h3>
                    <p className="panel-subtitle">Geo-tagged markers showing road defects identified by AI</p>
                  </div>
                </div>
                <MapContainer mode="health" />
              </div>

              <div className="card-panel camera-panel">
                <div className="panel-header">
                  <Cpu size={18} style={{ color: 'var(--color-danger)' }} />
                  <div>
                    <h3 className="panel-title">AI Camera Stream Simulator</h3>
                    <p className="panel-subtitle">Live dashcam anomaly detector on RoadPatrol inspection vehicle</p>
                  </div>
                </div>

                {/* AICamera Component */}
                <AICameraFeed type="roadHealth" onDetectionTriggered={handleAIDetection} />

                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>Potholes Detected (Session)</h4>
                  <div className="alerts-list" style={{ maxHeight: '160px' }}>
                    {roadAnomalies.map(anom => (
                      <div key={anom.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: 6, fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ color: anom.severity === 'High' ? '#ef4444' : '#f59e0b' }}>{anom.type}</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{anom.street}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Conf: {anom.confidence}%</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: 2 }}>{anom.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Render Settings Page */}
        {activeTab === 'settings' && (
          <>
            <header className="content-header">
              <div className="content-title">
                <h1>System Control & AI Settings</h1>
                <p>Configure detection weights, simulation settings, and telemetry frequencies</p>
              </div>
            </header>

            <div className="card-panel">
              <div className="settings-grid">
                
                {/* Simulator Settings */}
                <div className="settings-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sliders size={18} style={{ color: 'var(--color-primary)' }} /> Simulation Parameters
                  </h3>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label>GPS Update speed (Simulation speed multiplier)</label>
                      <span className="slider-val-label">{settings.speedMultiplier}x Speed</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="4.0" 
                      step="0.5"
                      className="range-slider"
                      value={settings.speedMultiplier}
                      onChange={e => setSettings(prev => ({ ...prev, speedMultiplier: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label>AI Object Detection Threshold</label>
                      <span className="slider-val-label">{settings.detectionThreshold}% Confidence</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="95" 
                      step="5"
                      className="range-slider"
                      value={settings.detectionThreshold}
                      onChange={e => setSettings(prev => ({ ...prev, detectionThreshold: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Active Vision Model Core</label>
                    <select 
                      className="form-select"
                      value={settings.activeModel}
                      onChange={e => setSettings(prev => ({ ...prev, activeModel: e.target.value }))}
                    >
                      <option value="SmartCity Unified-CV v4.2">SmartCity Unified-CV v4.2 (Standard)</option>
                      <option value="RoadEye Edge-Pothole v2.1">RoadEye Edge-Pothole v2.1 (Performance-focused)</option>
                      <option value="Aegis Vision Super-Res v6.0">Aegis Vision Super-Res v6.0 (Heavy Accuracy)</option>
                    </select>
                  </div>
                </div>

                {/* System Toggles */}
                <div className="settings-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={18} style={{ color: 'var(--color-primary)' }} /> Notification Settings
                  </h3>

                  <div className="toggle-group">
                    <div className="toggle-info">
                      <h4>Push Alerts & Toast Popups</h4>
                      <p>Show real-time toast alerts for potholes and trash detections</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notificationsEnabled}
                        onChange={e => setSettings(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="toggle-group">
                    <div className="toggle-info">
                      <h4>Sound Alarms</h4>
                      <p>Play warning sounds for critical severity potholes (95%+ confidence)</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.enableSound}
                        onChange={e => setSettings(prev => ({ ...prev, enableSound: e.target.checked }))}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="toggle-group">
                    <div className="toggle-info">
                      <h4>Tile Filter Theme</h4>
                      <p>Invert and adjust contrast of map layer for a night-mode hud</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.mapTheme === 'dark'}
                        onChange={e => setSettings(prev => ({ ...prev, mapTheme: e.target.checked ? 'dark' : 'light' }))}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div className="user-profile-panel">
                      <div className="avatar">KO</div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Kokila O.</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>City Operator Lead (Admin)</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div style={{ marginTop: 32, borderTop: '1px solid var(--border-color)', paddingTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button 
                  className="btn secondary"
                  onClick={() => {
                    setSettings({
                      speedMultiplier: 1,
                      detectionThreshold: 80,
                      enableSound: false,
                      notificationsEnabled: true,
                      mapTheme: 'dark',
                      activeModel: 'SmartCity Unified-CV v4.2'
                    });
                    addToast('Defaults Restored', 'Settings reverted to original parameters.', 'info');
                  }}
                >
                  <RotateCcw size={16} /> Reset defaults
                </button>
                <button 
                  className="btn"
                  onClick={() => {
                    addToast('Settings Saved', 'System configurations applied and synched with fleet.', 'success');
                  }}
                >
                  <CheckCircle size={16} /> Save configurations
                </button>
              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
}
