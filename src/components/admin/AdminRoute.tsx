 import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { SensorLocation } from "../../hooks/useAdminSensors";

interface AdminRouteProps {
  sensors: SensorLocation[];
}

const sensorBaseCenter = {
  lng: 39.2083,
  lat: -6.7924,
};

const getMarkerColor = (fillLevel: number) => {
  if (fillLevel >= 85) return "#dc2626";
  if (fillLevel >= 60) return "#ca8a04";
  return "#16a34a";
};

export default function AdminRoute({ sensors }: AdminRouteProps) {
  const [selectedSensor, setSelectedSensor] = useState<SensorLocation | null>(
    null,
  );
  const [sortBy, setSortBy] = useState("name");
  const [zoomLevel, setZoomLevel] = useState(10);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);

  const sensorsWithCoords = useMemo(() => {
    return sensors.map((sensor, index) => {
      // Check if it's the specific test devices to assign Chuo cha Maji coordinates
      if (sensor.device_id === "esp32_household_3") {
        return {
          ...sensor,
          location_name: "Chuo cha Maji Dispensary",
          lat: -6.78615,
          lng: 39.20465,
        };
      }
      if (sensor.device_id === "esp32_household_1") {
        return {
          ...sensor,
          location_name: "Chuo cha maji ubungo",
          lat: -6.78772,
          lng: 39.20605,
        };
      }

      const angle = (index / Math.max(sensors.length, 1)) * Math.PI * 2;
      const radius = 0.05 + ((sensor.fill_level || 0) / 100) * 0.03;
      return {
        ...sensor,
        lat: sensor.lat ?? sensorBaseCenter.lat + Math.cos(angle) * radius,
        lng: sensor.lng ?? sensorBaseCenter.lng + Math.sin(angle) * radius,
      };
    });
  }, [sensors]);

  const sortedSensors = [...sensorsWithCoords].sort((a, b) => {
    if (sortBy === "name")
      return a.location_name.localeCompare(b.location_name);
    if (sortBy === "fillLevel")
      return (b.fill_level || 0) - (a.fill_level || 0);
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return 0;
  });

  const criticalSensors = sensorsWithCoords.filter(
    (s) => (s.fill_level || 0) >= 85,
  );
  const warningSensors = sensorsWithCoords.filter(
    (s) => (s.fill_level || 0) >= 60 && (s.fill_level || 0) < 85,
  );
  const normalSensors = sensorsWithCoords.filter(
    (s) => (s.fill_level || 0) < 60,
  );

  const routeLine = useMemo(() => {
    const validSensors = sensorsWithCoords.filter(
      (s) => s.lng !== undefined && s.lat !== undefined
    );
    // If we have our simulated route sensors, draw a road-following route
    const hasDispensary = validSensors.some(s => s.device_id === "esp32_household_3");
    const hasCampus = validSensors.some(s => s.device_id === "esp32_household_1");

    if (hasDispensary && hasCampus) {
      const sDispensary = validSensors.find(s => s.device_id === "esp32_household_3")!;
      const sCampus = validSensors.find(s => s.device_id === "esp32_household_1")!;

      // Return a road-following coordinate set between Dispensary and Ubungo Campus
      return [
        [sDispensary.lng!, sDispensary.lat!],
        [39.20590, -6.78570],
        [39.20680, -6.78540],
        [39.20710, -6.78740],
        [sCampus.lng!, sCampus.lat!]
      ];
    }

    const ordered = [...sensorsWithCoords].sort(
      (a, b) => (a.sensor_number ?? 0) - (b.sensor_number ?? 0),
    );
    return ordered
      .filter((sensor) => sensor.lng !== undefined && sensor.lat !== undefined)
      .map((sensor) => [sensor.lng as number, sensor.lat as number]);
  }, [sensorsWithCoords]);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setMapError(
        "Mapbox token not configured. Set VITE_MAPBOX_ACCESS_TOKEN in .env to enable the route map.",
      );
      return;
    }

    if (mapRef.current || !mapContainer.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: sensorsWithCoords.length
        ? [
            sensorsWithCoords[0].lng as number,
            sensorsWithCoords[0].lat as number,
          ]
        : [sensorBaseCenter.lng, sensorBaseCenter.lat],
      zoom: zoomLevel,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
    });

    map.on("move", () => {
      setZoomLevel(Number(map.getZoom().toFixed(1)));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    // Add markers for all sensors
    sensorsWithCoords.forEach((sensor) => {
      if (sensor.lng === undefined || sensor.lat === undefined) return;

      const markerEl = document.createElement("div");
      markerEl.className = "blinking-marker";
      markerEl.style.backgroundColor = getMarkerColor(sensor.fill_level || 0);
      markerEl.style.width = "18px";
      markerEl.style.height = "18px";
      markerEl.style.borderRadius = "50%";
      markerEl.style.boxShadow = "0 0 0 4px rgba(255,255,255,0.75)";
      markerEl.style.cursor = "pointer";
      markerEl.style.zIndex = "1000";
      markerEl.title = sensor.location_name;
      markerEl.addEventListener("click", () => setSelectedSensor(sensor));

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([sensor.lng, sensor.lat])
        .addTo(map);

      markerRefs.current.push(marker);
    });

    // Add route line if we have multiple sensors
    if (routeLine.length > 1) {
      if (map.getSource("optimized-route")) {
        (map.getSource("optimized-route") as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeLine,
          },
        });
      } else {
        map.addSource("optimized-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeLine,
            },
          },
        });

        map.addLayer({
          id: "optimized-route-line",
          type: "line",
          source: "optimized-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10b981",
            "line-width": 4,
            "line-opacity": 0.85,
          },
        });
      }
    } else {
      if (map.getLayer("optimized-route-line")) {
        map.removeLayer("optimized-route-line");
      }
      if (map.getSource("optimized-route")) {
        map.removeSource("optimized-route");
      }
    }

    // Fit map bounds around sensors
    if (sensorsWithCoords.length > 0) {
      const validSensors = sensorsWithCoords.filter(
        (s) => s.lng !== undefined && s.lat !== undefined,
      );

      if (validSensors.length === 1) {
        // Center map on single sensor
        map.flyTo({
          center: [validSensors[0].lng!, validSensors[0].lat!],
          zoom: 13,
          duration: 1000,
        });
      } else if (validSensors.length > 1) {
        // Fit bounds around multiple sensors
        const bounds = new mapboxgl.LngLatBounds();
        validSensors.forEach((sensor) => {
          bounds.extend([sensor.lng!, sensor.lat!]);
        });
        map.fitBounds(bounds, { padding: 80, maxZoom: 18, duration: 1000 });
      }
    }
  }, [mapLoaded, sensorsWithCoords, routeLine]);

  const applyZoom = (value: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomTo(map.getZoom() + value, { duration: 400 });
  };

  const getStatusIcon = (fillLevel: number) => {
    if (fillLevel >= 85)
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (fillLevel >= 60)
      return <ShieldCheck className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes blink {
          0%, 49%, 100% {
            opacity: 1;
          }
          50%, 99% {
            opacity: 0.4;
          }
        }
        .blinking-marker {
          animation: blink 1s infinite;
        }
      `}</style>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Critical</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                {criticalSensors.length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Warning</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">
                {warningSensors.length}
              </p>
            </div>
            <ShieldCheck className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Normal</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {normalSensors.length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Map Visualization & Sensor List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapbox Map */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Route Optimization Map
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => applyZoom(1)}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-1"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => applyZoom(-1)}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-1"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                Zoom: {zoomLevel}x
              </span>
            </div>
          </div>

          {mapError ? (
            <div className="w-full h-96 bg-red-50 rounded-lg border border-red-300 flex items-center justify-center">
              <p className="text-red-700 font-medium text-center px-4">
                {mapError}
              </p>
            </div>
          ) : (
            <div
              ref={mapContainer}
              className="w-full h-96 rounded-lg border border-gray-300 overflow-hidden"
            />
          )}

          {selectedSensor && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900">
                    {selectedSensor.location_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Device: {selectedSensor.device_id}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Fill Level:{" "}
                    <span className="font-bold text-lg">
                      {selectedSensor.fill_level}%
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Last Update:{" "}
                    {selectedSensor.lastUpdate
                      ? new Date(selectedSensor.lastUpdate).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSensor(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sensor List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Sensors</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="name">By Name</option>
              <option value="fillLevel">By Fill Level</option>
              <option value="status">By Status</option>
            </select>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedSensors.length > 0 ? (
              sortedSensors.map((sensor) => (
                <button
                  key={sensor.id}
                  onClick={() => setSelectedSensor(sensor)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition hover:shadow-md ${
                    selectedSensor?.id === sensor.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {sensor.location_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {sensor.device_id}
                      </p>
                    </div>
                    <span className="text-lg">
                      {getStatusIcon(sensor.fill_level || 0)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        Fill Level
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {sensor.fill_level || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition ${
                          (sensor.fill_level || 0) >= 85
                            ? "bg-red-500"
                            : (sensor.fill_level || 0) >= 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${sensor.fill_level || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No sensors found</p>
            )}
          </div>
        </div>
      </div>

      {/* Route Optimization Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          🗺️ Route Optimization Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
          <li>Prioritize critical sensors (🚨) for immediate collection</li>
          <li>Plan routes by proximity to minimize travel time</li>
          <li className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Monitor warning sensors during the next collection cycle
          </li>
          <li>Use this map to identify optimal collection order</li>
        </ul>
      </div>
    </div>
  );
}
