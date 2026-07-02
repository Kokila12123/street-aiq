// Mock Data and City Coordinates for Smart City Monitor
// Original coordinates centered around Boston, MA (approx. 42.3601, -71.0589)

export const ORIGINAL_CENTER = [42.3601, -71.0589];
export const MAP_CENTER = ORIGINAL_CENTER;
export const MAP_ZOOM = 15;

// Predefined routes consisting of lat-lng pairs
export const ROUTES = {
  "Downtown Loop": [
    [42.3601, -71.0589],
    [42.3621, -71.0589],
    [42.3635, -71.0610],
    [42.3630, -71.0645],
    [42.3600, -71.0655],
    [42.3585, -71.0640],
    [42.3565, -71.0620],
    [42.3550, -71.0600],
    [42.3555, -71.0575],
    [42.3575, -71.0560],
    [42.3590, -71.0570],
    [42.3601, -71.0589]
  ],
  "Northside Sweep": [
    [42.3650, -71.0550],
    [42.3670, -71.0530],
    [42.3695, -71.0555],
    [42.3720, -71.0580],
    [42.3705, -71.0620],
    [42.3680, -71.0640],
    [42.3655, -71.0620],
    [42.3645, -71.0590],
    [42.3650, -71.0550]
  ],
  "Southside Transit": [
    [42.3520, -71.0650],
    [42.3500, -71.0680],
    [42.3480, -71.0700],
    [42.3450, -71.0730],
    [42.3430, -71.0700],
    [42.3450, -71.0650],
    [42.3485, -71.0615],
    [42.3505, -71.0630],
    [42.3520, -71.0650]
  ],
  "Westside Boulevard": [
    [42.3580, -71.0700],
    [42.3590, -71.0750],
    [42.3605, -71.0800],
    [42.3630, -71.0820],
    [42.3650, -71.0800],
    [42.3635, -71.0740],
    [42.3610, -71.0720],
    [42.3580, -71.0700]
  ]
};

// Initial vehicle setup
export const INITIAL_VEHICLES = [
  {
    id: "V-101",
    name: "EcoSweeper Pro",
    type: "Sweeper",
    driver: "David K.",
    route: "Downtown Loop",
    status: "Active",
    speed: 18, // mph
    cleanliness: 94, // %
    potholesFound: 3,
    routeIndex: 0,
    color: "#10b981", // Emerald green
    activeModel: "CleanVision v2.5"
  },
  {
    id: "V-102",
    name: "CityScout Inspector",
    type: "Inspector",
    driver: "Elena R.",
    route: "Northside Sweep",
    status: "Active",
    speed: 28,
    cleanliness: 82,
    potholesFound: 11,
    routeIndex: 2,
    color: "#3b82f6", // Blue
    activeModel: "RoadScan AI v4.0"
  },
  {
    id: "V-103",
    name: "EcoSweeper Lite",
    type: "Sweeper",
    driver: "Marcus L.",
    route: "Southside Transit",
    status: "Warning",
    speed: 12,
    cleanliness: 68,
    potholesFound: 8,
    routeIndex: 4,
    color: "#f59e0b", // Amber warning
    activeModel: "CleanVision v2.5"
  },
  {
    id: "V-104",
    name: "RoadPatrol Heavy",
    type: "Pothole Repair",
    driver: "Sara M.",
    route: "Westside Boulevard",
    status: "Active",
    speed: 24,
    cleanliness: 79,
    potholesFound: 5,
    routeIndex: 1,
    color: "#a855f7", // Purple
    activeModel: "PotholeDetect v3"
  }
];

// Mock segments indicating street cleanliness
// 1 = Clean (Green), 2 = Moderate (Yellow), 3 = Dirty (Red)
export const CLEANLINESS_SEGMENTS = [
  {
    id: "c-seg-1",
    name: "Mahatma Gandhi Rd",
    coordinates: ROUTES["Downtown Loop"].slice(0, 5),
    level: "Clean",
    score: 95,
    lastScanned: "5 mins ago"
  },
  {
    id: "c-seg-2",
    name: "Brigade Rd Corridor",
    coordinates: ROUTES["Downtown Loop"].slice(4, 9),
    level: "Moderate",
    score: 72,
    lastScanned: "12 mins ago"
  },
  {
    id: "c-seg-3",
    name: "Outer Ring Rd",
    coordinates: ROUTES["Downtown Loop"].slice(8, 12),
    level: "Dirty",
    score: 38,
    lastScanned: "2 mins ago"
  },
  {
    id: "c-seg-4",
    name: "Residency Road Sweep",
    coordinates: ROUTES["Northside Sweep"].slice(0, 4),
    level: "Clean",
    score: 91,
    lastScanned: "15 mins ago"
  },
  {
    id: "c-seg-5",
    name: "Indiranagar 100ft Rd",
    coordinates: ROUTES["Northside Sweep"].slice(3, 7),
    level: "Dirty",
    score: 42,
    lastScanned: "1 min ago"
  },
  {
    id: "c-seg-6",
    name: "Koramangala Blvd",
    coordinates: ROUTES["Southside Transit"].slice(2, 6),
    level: "Moderate",
    score: 64,
    lastScanned: "8 mins ago"
  }
];

// Mock data representing road damage anomalies
export const ROAD_HEALTH_ANOMALIES = [
  {
    id: "pothole-1",
    type: "Severe Pothole",
    severity: "High",
    coordinates: [42.3621, -71.0589],
    street: "MG Road Junction",
    confidence: 96,
    status: "Pending",
    detectedBy: "V-101",
    time: "2 mins ago"
  },
  {
    id: "crack-1",
    type: "Longitudinal Crack",
    severity: "Medium",
    coordinates: [42.3630, -71.0645],
    street: "Double Road (Near HSR Layout)",
    confidence: 84,
    status: "Pending",
    detectedBy: "V-101",
    time: "8 mins ago"
  },
  {
    id: "manhole-1",
    type: "Sunken Manhole",
    severity: "Low",
    coordinates: [42.3585, -71.0640],
    street: "Richmond Town Rd",
    confidence: 79,
    status: "Monitored",
    detectedBy: "V-103",
    time: "15 mins ago"
  },
  {
    id: "pothole-2",
    type: "Group of Potholes",
    severity: "High",
    coordinates: [42.3695, -71.0555],
    street: "Commercial Street",
    confidence: 92,
    status: "Scheduled",
    detectedBy: "V-102",
    time: "22 mins ago"
  },
  {
    id: "pothole-3",
    type: "Deep Asphalt Depression",
    severity: "High",
    coordinates: [42.3480, -71.0700],
    street: "Hosur Rd & Silk Board",
    confidence: 97,
    status: "Pending",
    detectedBy: "V-103",
    time: "10 mins ago"
  },
  {
    id: "crack-2",
    type: "Alligator Cracking",
    severity: "Medium",
    coordinates: [42.3605, -71.0800],
    street: "Bannerghatta Main Rd",
    confidence: 88,
    status: "Pending",
    detectedBy: "V-104",
    time: "4 mins ago"
  }
];

// Shifts all coordinate arrays based on a new map center
export function getShiftedData(centerLat, centerLng) {
  const latDiff = centerLat - ORIGINAL_CENTER[0];
  const lngDiff = centerLng - ORIGINAL_CENTER[1];

  const shiftPoint = (pt) => [pt[0] + latDiff, pt[1] + lngDiff];
  const shiftPath = (path) => path.map(shiftPoint);

  // Shift ROUTES
  const routes = {};
  Object.entries(ROUTES).forEach(([name, path]) => {
    routes[name] = shiftPath(path);
  });

  // Shift CLEANLINESS_SEGMENTS
  const cleanliness = CLEANLINESS_SEGMENTS.map(seg => ({
    ...seg,
    coordinates: shiftPath(seg.coordinates)
  }));

  // Shift ROAD_HEALTH_ANOMALIES
  const anomalies = ROAD_HEALTH_ANOMALIES.map(anom => ({
    ...anom,
    coordinates: shiftPoint(anom.coordinates)
  }));

  return { routes, cleanliness, anomalies };
}

// Sample images/videos simulation labels
export const CAMERA_CLASSES = {
  cleanliness: [
    { label: "Plastic Bottle", color: "#ef4444" },
    { label: "Cardboard Box", color: "#f59e0b" },
    { label: "Aluminum Can", color: "#ef4444" },
    { label: "Leaves Pile", color: "#10b981" },
    { label: "Takeaway Cup", color: "#f59e0b" },
    { label: "Paper Trash", color: "#ef4444" }
  ],
  roadHealth: [
    { label: "Severe Pothole", color: "#ef4444" },
    { label: "Alligator Cracking", color: "#f59e0b" },
    { label: "Sunken Manhole", color: "#3b82f6" },
    { label: "Faded Crosswalk", color: "#a855f7" },
    { label: "Asphalt Rutting", color: "#f59e0b" }
  ]
};

// Generates a mock frame detection overlay on Canvas
export function drawAIDetectionOverlay(canvas, type, frameCount, currentDetections = []) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  // Clear previous frame
  ctx.clearRect(0, 0, width, height);

  // Draw background texture simulating dashcam movement
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, width, height);

  // Draw simulated road lines moving down
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 4;
  
  // Left lane line
  ctx.beginPath();
  ctx.moveTo(width * 0.2, height);
  ctx.lineTo(width * 0.4, height * 0.4);
  ctx.stroke();

  // Right lane line
  ctx.beginPath();
  ctx.moveTo(width * 0.8, height);
  ctx.lineTo(width * 0.6, height * 0.4);
  ctx.stroke();

  // Center dashed line
  ctx.strokeStyle = "rgba(254, 240, 138, 0.4)"; // Yellow dashed
  ctx.setLineDash([15, 15]);
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height);
  ctx.lineTo(width * 0.5, height * 0.4);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Horizon sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.4);
  skyGrad.addColorStop(0, "#0f172a");
  skyGrad.addColorStop(1, "#1e293b");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.4);

  // Draw simple skyline mountains
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.4);
  ctx.lineTo(width * 0.25, height * 0.25);
  ctx.lineTo(width * 0.5, height * 0.4);
  ctx.lineTo(width * 0.7, height * 0.3);
  ctx.lineTo(width, height * 0.4);
  ctx.fill();

  // Draw a simulated overlay UI (dashboard metrics)
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(10, 10, width - 20, 30);

  ctx.fillStyle = "#10b981";
  ctx.font = "bold 10px monospace";
  ctx.fillText("● AI CAMERA FEED - LIVE STREAM", 20, 28);

  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`FPS: 30  |  RES: 1280x720  |  SENSITIVITY: 85%`, width - 250, 28);

  // Draw current detections
  if (currentDetections.length > 0) {
    currentDetections.forEach((det, idx) => {
      // Calculate dynamic positions simulating coming closer
      const scale = 0.5 + (frameCount % 60) / 60; // moves and expands
      const targetX = det.x * width;
      const targetY = height * 0.4 + det.y * height * 0.6;
      const detWidth = det.w * width * scale;
      const detHeight = det.h * height * scale;

      // Draw bounding box
      ctx.strokeStyle = det.color || "#ef4444";
      ctx.lineWidth = 2;
      ctx.strokeRect(targetX - detWidth / 2, targetY - detHeight / 2, detWidth, detHeight);

      // Label background
      ctx.fillStyle = det.color || "#ef4444";
      ctx.fillRect(targetX - detWidth / 2, targetY - detHeight / 2 - 16, detWidth, 16);

      // Label text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px Arial";
      ctx.fillText(`${det.label} ${(det.confidence * 100).toFixed(0)}%`, targetX - detWidth / 2 + 4, targetY - detHeight / 2 - 5);
      
      // Tracking lines/points
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
