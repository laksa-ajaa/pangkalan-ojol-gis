"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Star, Navigation, LocateFixed, Route } from "lucide-react";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getMarkerColor } from "@/utils/getMarkerColor";

// Fix Leaflet icon issues
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom user location icon
const userIcon = L.divIcon({
  className: "user-location-icon",
  html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></svg>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

L.Marker.prototype.options.icon = defaultIcon;

// Calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Update the MapResizer component to handle mobile better
// Replace the MapResizer component with this improved version:

function MapResizer({ sidebarOpen }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate map size when sidebar visibility changes
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => clearTimeout(timer);
  }, [sidebarOpen, map]);

  // Also handle window resize events
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return null;
}

// Component to set the map view
function SetMapView({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      map.setView(coordinates, 12);
    }
  }, [coordinates, map]);

  return null;
}

// Component for user location and routing
function LocationAndRouting({ userLocation, markers, setSelectedMarker }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  // Clear existing routing control when component unmounts
  useEffect(() => {
    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map]);

  // Update routing when user location or selected marker changes
  useEffect(() => {
    if (userLocation && markers.length > 0) {
      // Calculate distances to all markers
      const markersWithDistance = markers.map((marker) => {
        const latLng = [marker.geometry.coordinates[1], marker.geometry.coordinates[0]];
        const distance = calculateDistance(userLocation[0], userLocation[1], latLng[0], latLng[1]);
        return { ...marker, distance };
      });

      // Sort by distance
      markersWithDistance.sort((a, b) => a.distance - b.distance);

      // Set the closest marker as selected
      if (markersWithDistance.length > 0) {
        setSelectedMarker(markersWithDistance[0]);
      }
    }
  }, [userLocation, markers, setSelectedMarker]);

  return null;
}

// Update the MapControls component to position the "My Location" button on the left side
function MapControls({ onLocateMe }) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="icon" className="h-10 w-10 rounded-full shadow-md bg-white text-black hover:bg-gray-100" onClick={onLocateMe}>
              <LocateFixed className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Temukan Lokasi Saya</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Add a new LayerControl component for map layers
function LayerControl() {
  const map = useMap();
  const [activeLayer, setActiveLayer] = useState("OSM");

  const layers = {
    OSM: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),
    "Google Maps": L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "&copy; Google Maps",
    }),
    "Google Satellite": L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}", {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "&copy; Google Maps",
    }),
    ESRI: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "&copy; ESRI",
    }),
  };

  useEffect(() => {
    // Add the default layer (OSM) on initial load
    layers["OSM"].addTo(map);

    // Cleanup on unmount
    return () => {
      Object.values(layers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map]);

  const changeLayer = (layerName) => {
    // Remove all layers
    Object.values(layers).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Add the selected layer
    layers[layerName].addTo(map);
    setActiveLayer(layerName);
  };

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white p-2 rounded-md shadow-md">
      <div className="text-xs font-semibold mb-1">Map Layers</div>
      <div className="flex flex-col gap-1">
        {Object.keys(layers).map((layerName) => (
          <Button key={layerName} variant={activeLayer === layerName ? "default" : "outline"} size="sm" className="text-xs h-7 justify-start" onClick={() => changeLayer(layerName)}>
            {layerName}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Add a new MapLegend component
function MapLegend({ locationTypes }) {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-md shadow-md max-w-[200px] max-h-[300px] overflow-y-auto">
      <div className="text-xs font-semibold mb-1">Legend</div>
      <div className="flex flex-col gap-1">
        {locationTypes.map((type) => (
          <div key={type} className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 flex items-center justify-center">{getIconForLocationType(type)}</div>
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to get icon for location type
function getIconForLocationType(type) {
  switch (type.toLowerCase()) {
    case "terminal":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      );
    case "minimarket":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
          <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
        </svg>
      );
    case "perumahan":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "mall":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
          <path d="M2 7h20" />
          <path d="M16 2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M6 2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M12 17v5" />
          <path d="M8 17v5" />
          <path d="M16 17v5" />
          <path d="M4 17v5" />
          <path d="M20 17v5" />
          <path d="M4 11h16v6H4z" />
        </svg>
      );
    case "stasiun":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
          <rect x="4" y="3" width="16" height="16" rx="2" />
          <path d="M4 11h16" />
          <path d="M12 3v8" />
          <path d="M8 19l4 3 4-3" />
        </svg>
      );
    case "pinggir jalan":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
          <path d="M4 19h16" />
          <path d="M4 15h16" />
          <path d="M4 11h16" />
          <path d="M4 7h16" />
        </svg>
      );
    // New location types
    case "universitas":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case "mesjid":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
          <path d="M4 22V12a8 8 0 0 1 16 0v10" />
          <path d="M2 22h20" />
          <path d="M16 7V4h1v3" />
          <path d="M8 7V4h1v3" />
          <path d="M12 7V4h1v3" />
          <path d="M10 22v-5.5a2.5 2.5 0 0 1 5 0V22" />
        </svg>
      );
    case "spbu":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
          <path d="M4 20V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
          <path d="M14 20H4" />
          <path d="M14 13h2a2 2 0 0 1 2 2v5" />
          <path d="M14 3h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1" />
        </svg>
      );
    case "sekolah":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-4l-3 3z" />
          <path d="M10 10l2 2l4 -4" />
        </svg>
      );
    case "bank":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
          <path d="M4 10V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
          <path d="M10 16h4" />
          <path d="M10 12h4" />
          <path d="M7 16h.01" />
          <path d="M7 12h.01" />
          <path d="M12 8v8" />
          <path d="M8 6v4" />
          <path d="M16 6v4" />
        </svg>
      );
    case "warkop":
    case "cafe":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" x2="6" y1="2" y2="4" />
          <line x1="10" x2="10" y1="2" y2="4" />
          <line x1="14" x2="14" y1="2" y2="4" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

// Create custom marker icon based on location type
function getCustomMarkerIcon(locationType) {
  const iconColor = getIconColorForLocationType(locationType);

  return L.divIcon({
    className: "custom-marker-icon",
    html: `<div class="w-8 h-8 rounded-full bg-white border-2 border-${iconColor}-500 flex items-center justify-center text-${iconColor}-500">
            ${getIconHtmlForLocationType(locationType)}
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Update the getIconHtmlForLocationType function to include new location types
function getIconHtmlForLocationType(type) {
  switch (type.toLowerCase()) {
    case "terminal":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;
    case "minimarket":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`;
    case "perumahan":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    case "mall":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h20"/><path d="M16 2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M6 2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M12 17v5"/><path d="M8 17v5"/><path d="M16 17v5"/><path d="M4 17v5"/><path d="M20 17v5"/><path d="M4 11h16v6H4z"/></svg>`;
    case "stasiun":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l4 3 4-3"/></svg>`;
    case "pinggir jalan":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19h16"/><path d="M4 15h16"/><path d="M4 11h16"/><path d="M4 7h16"/></svg>`;
    // New location types
    case "universitas":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
    case "mesjid":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V12a8 8 0 0 1 16 0v10"/><path d="M2 22h20"/><path d="M16 7V4h1v3"/><path d="M8 7V4h1v3"/><path d="M12 7V4h1v3"/><path d="M10 22v-5.5a2.5 2.5 0 0 1 5 0V22"/></svg>`;
    case "spbu":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M14 20H4"/><path d="M14 13h2a2 2 0 0 1 2 2v5"/><path d="M14 3h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1"/></svg>`;
    case "sekolah":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-4l-3 3z"/><path d="M10 10l2 2l4 -4"/></svg>`;
    case "bank":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/><path d="M10 16h4"/><path d="M10 12h4"/><path d="M7 16h.01"/><path d="M7 12h.01"/><path d="M12 8v8"/><path d="M8 6v4"/><path d="M16 6v4"/></svg>`;
    case "warkop":
    case "cafe":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  }
}

// Update the getIconColorForLocationType function to include new location types
function getIconColorForLocationType(type) {
  switch (type.toLowerCase()) {
    case "terminal":
      return "red";
    case "minimarket":
      return "blue";
    case "perumahan":
      return "green";
    case "mall":
      return "purple";
    case "stasiun":
      return "yellow";
    case "pinggir jalan":
      return "orange";
    // New location types
    case "universitas":
      return "indigo";
    case "mesjid":
      return "emerald";
    case "spbu":
      return "rose";
    case "sekolah":
      return "cyan";
    case "bank":
      return "amber";
    case "warkop":
    case "cafe":
      return "brown";
    default:
      return "gray";
  }
}

// Update the CustomMarker component to use custom icons and calculate route distance
function CustomMarker({ feature, isSelected, userLocation, onSelectMarker }) {
  const { properties, geometry } = feature;
  const coordinates = [geometry.coordinates[1], geometry.coordinates[0]];
  const map = useMap();
  const routingControlRef = useRef(null);
  const [routeDistance, setRouteDistance] = useState(null);

  // Calculate direct distance if user location is available
  const directDistance = userLocation ? calculateDistance(userLocation[0], userLocation[1], coordinates[0], coordinates[1]).toFixed(2) : null;

  // Update routing when selected
  useEffect(() => {
    if (isSelected && userLocation) {
      // Clear existing routing control
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }

      // Create new routing control
      routingControlRef.current = L.Routing.control({
        waypoints: [L.latLng(userLocation[0], userLocation[1]), L.latLng(coordinates[0], coordinates[1])],
        routeWhileDragging: false,
        showAlternatives: false,
        show: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ color: "#6366F1", weight: 4 }],
        },
        createMarker: () => null, // Don't create default markers
      }).addTo(map);

      // Get route distance from routing control
      routingControlRef.current.on("routesfound", (e) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          // Get distance in kilometers and round to 2 decimal places
          const distanceInKm = (routes[0].summary.totalDistance / 1000).toFixed(2);
          setRouteDistance(distanceInKm);
        }
      });
    }

    return () => {
      if (isSelected && routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
        setRouteDistance(null);
      }
    };
  }, [isSelected, userLocation, map]);

  return (
    <Marker
      position={coordinates}
      eventHandlers={{
        click: () => onSelectMarker(feature),
      }}
      icon={
        isSelected
          ? L.divIcon({
              className: "selected-marker",
              html: `<div class="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white pulse-animation">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                 </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            })
          : getCustomMarkerIcon(properties.jenis_lokasi)
      }
    >
      <Popup>
        <Card className="w-[300px] border-none shadow-none">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-base">{properties.nama_lokasi}</CardTitle>
            <Badge variant="outline" className="w-fit">
              {properties.jenis_lokasi}
            </Badge>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-2 text-sm">
            {userLocation && (
              <div className="bg-blue-50 p-2 rounded-md mb-2">
                <p className="font-semibold flex items-center gap-1">
                  <Navigation className="h-4 w-4" />
                  Jarak dari lokasi Anda: {routeDistance ? `${routeDistance} km (rute)` : `${directDistance} km (langsung)`}
                </p>
              </div>
            )}
            <div>
              <p className="font-semibold">Jam Ramai:</p>
              <p>{properties.jam_ramainya}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-semibold">Kepadatan:</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < properties.tingkat_kepadatan ? getMarkerColor(properties.tingkat_kepadatan) : "text-gray-300"}`} fill={i < properties.tingkat_kepadatan ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold">Keamanan:</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < properties.tingkat_keamanan ? "text-green-500" : "text-gray-300"}`} fill={i < properties.tingkat_keamanan ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-semibold">Kenyamanan:</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < properties.kenyamanan ? "text-blue-500" : "text-gray-300"}`} fill={i < properties.kenyamanan ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold">Internet:</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < properties.akses_internet ? "text-purple-500" : "text-gray-300"}`} fill={i < properties.akses_internet ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="font-semibold">Fasilitas:</p>
              <p>{properties.fasilitas}</p>
            </div>
            <div>
              <p className="font-semibold">Alamat:</p>
              <p>{properties.alamat}</p>
            </div>
            {userLocation && (
              <Button variant="default" className="w-full mt-2" onClick={() => onSelectMarker(feature)}>
                <Route className="mr-2 h-4 w-4" />
                Tampilkan Rute
              </Button>
            )}
          </CardContent>
        </Card>
      </Popup>
    </Marker>
  );
}

// Update the MapComponent to include the new components and extract unique location types
export default function MapComponent({ geoJsonData, sidebarOpen }) {
  const [center, setCenter] = useState([-6.2088, 106.8456]); // Default: Jakarta
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationTypes, setLocationTypes] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      setMarkers(geoJsonData.features);

      // Extract unique location types
      const types = [...new Set(geoJsonData.features.map((f) => f.properties.jenis_lokasi))];
      setLocationTypes(types);

      // Calculate center from all points
      if (geoJsonData.features.length > 0) {
        const lats = geoJsonData.features.map((f) => f.geometry.coordinates[1]);
        const lngs = geoJsonData.features.map((f) => f.geometry.coordinates[0]);

        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

        setCenter([avgLat, avgLng]);
      }
    }
  }, [geoJsonData]);

  // Get user location
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setCenter([latitude, longitude]);
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Tidak dapat mengakses lokasi Anda. Pastikan Anda telah memberikan izin lokasi.");
        }
      );
    } else {
      setLocationError("Geolocation tidak didukung oleh browser Anda.");
    }
  };

  // Add CSS for pulse animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .pulse-animation {
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Force map to resize when sidebar visibility changes
  useEffect(() => {
    // Give time for the DOM to update
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      whenCreated={(map) => {
        mapRef.current = map;
      }}
    >
      <MapControls onLocateMe={handleLocateMe} />
      <LayerControl />
      <MapLegend locationTypes={locationTypes} />
      <MapResizer sidebarOpen={sidebarOpen} />

      <SetMapView coordinates={center} />

      {userLocation && (
        <>
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold">Lokasi Anda</p>
                <p className="text-xs text-gray-500">
                  Lat: {userLocation[0].toFixed(6)}, Lng: {userLocation[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
          <Circle center={userLocation} radius={100} pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }} />
        </>
      )}

      {markers.map((feature, index) => (
        <CustomMarker key={index} feature={feature} isSelected={selectedMarker === feature} userLocation={userLocation} onSelectMarker={setSelectedMarker} />
      ))}

      {userLocation && markers.length > 0 && <LocationAndRouting userLocation={userLocation} markers={markers} setSelectedMarker={setSelectedMarker} />}

      {locationError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-[1000]">
          <p>{locationError}</p>
        </div>
      )}
    </MapContainer>
  );
}
