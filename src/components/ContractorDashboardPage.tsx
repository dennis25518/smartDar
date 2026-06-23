import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Truck,
  MessageSquare,
  CheckCircle2,
  Clock,
  LogOut,
  Activity,
  ZoomIn,
  ZoomOut,
  Menu,
  Users,
} from "lucide-react";

interface ContractorDashboardPageProps {
  onLogout: () => void;
}

interface EmptyingOrder {
  id: string;
  customer_id: string;
  location_name: string;
  fill_level: number;
  sensor_type: string;
  contractor_name: string;
  status: "pending" | "active" | "completed";
  dispatch_reason: string;
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isFromDriver: boolean;
}

const getMarkerColor = (fillLevel: number) => {
  if (fillLevel >= 85) return "#dc2626";
  if (fillLevel >= 60) return "#ca8a04";
  return "#16a34a";
};

export default function ContractorDashboardPage({ onLogout }: ContractorDashboardPageProps) {
  const contractorName = localStorage.getItem("contractorLoggedIn") || "Kajenjere";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "messages" | "team" | "profile">("overview");
  const [orders, setOrders] = useState<EmptyingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<EmptyingOrder | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Mapbox states
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const [zoomLevel, setZoomLevel] = useState(16.5);

  // Support Messages state
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Team Members state with localStorage caching
  const [teamMembers, setTeamMembers] = useState<any[]>(() => {
    const saved = localStorage.getItem(`team_members_${contractorName}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing team members", e);
      }
    }
    return [
      { name: "Isdory Denis", role: "Operations Supervisor", category: "Supervisor", image: "/Assets/user1.jpg" },
      { name: "Juma Hamisi", role: "Sanitation Engineer (Technician)", category: "Technician", image: "/Assets/boy10.jpg" },
      { name: "David Mtambo", role: "System Technician", category: "Technician", image: "/Assets/boy11.jpg" },
      { name: "Hamza Ally", role: "Lead Vacuum Truck Driver", category: "Driver", image: "/Assets/boy1.webp" },
      { name: "Peter Moses", role: "Emptying Driver (Truck B)", category: "Driver", image: "/Assets/boy12.jpg" },
      { name: "Said Salum", role: "Emptying Driver (Truck C)", category: "Driver", image: "/Assets/boy13.jpg" },
      { name: "John Mwangi", role: "Driver Assistant (Truck A)", category: "Driver", image: "/Assets/user2.jpg" },
      { name: "Ali Kibwana", role: "Logistics Driver", category: "Driver", image: "/Assets/user3.jpg" }
    ];
  });

  useEffect(() => {
    localStorage.setItem(`team_members_${contractorName}`, JSON.stringify(teamMembers));
  }, [teamMembers, contractorName]);

  // Modal / Add team member states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberCategory, setNewMemberCategory] = useState<"Supervisor" | "Technician" | "Driver">("Driver");
  const [newMemberImage, setNewMemberImage] = useState("/Assets/user2.jpg");

  // Seed default orders if none exist
  useEffect(() => {
    const existing = localStorage.getItem("emptying_orders");
    if (!existing) {
      const defaultOrders: EmptyingOrder[] = [
        {
          id: "ord-1",
          customer_id: "cust-1",
          location_name: "Chuo cha Maji Dispensary",
          fill_level: 94,
          sensor_type: "Wastebin",
          contractor_name: contractorName,
          status: "pending",
          dispatch_reason: "High fill level - Urgent emptying requested",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "ord-2",
          customer_id: "cust-2",
          location_name: "Chuo cha maji ubungo",
          fill_level: 97,
          sensor_type: "Septic Tank",
          contractor_name: contractorName,
          status: "completed",
          dispatch_reason: "Scheduled maintenance cycle",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 82000000).toISOString(),
        }
      ];
      localStorage.setItem("emptying_orders", JSON.stringify(defaultOrders));
    }
  }, [contractorName]);

  // Load orders
  const loadOrders = async (showSpinner = false) => {
    if (showSpinner) {
      setLoadingOrders(true);
    }
    let dbOrders: EmptyingOrder[] = [];
    try {
      const { data, error } = await supabase
        .from("emptying_orders")
        .select("*")
        .eq("contractor_name", contractorName)
        .order("created_at", { ascending: false });
      if (!error && data) {
        dbOrders = data as EmptyingOrder[];
      }
    } catch (err) {
      console.warn("DB load error for emptying orders:", err);
    }

    const localOrders = JSON.parse(localStorage.getItem("emptying_orders") || "[]")
      .filter((o: any) => o.contractor_name === contractorName);

    // Combine and deduplicate
    const combined = [...dbOrders, ...localOrders];
    const unique = combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
    
    const typedOrders = unique.map(o => ({
      ...o,
      status: o.status as "pending" | "active" | "completed"
    }));

    setOrders(typedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    if (showSpinner) {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders(true);
    const interval = setInterval(() => loadOrders(false), 8000);
    return () => clearInterval(interval);
  }, [contractorName]);

  // Seed default chat messages
  useEffect(() => {
    const defaultMessages: SupportMessage[] = [
      { id: "msg-1", sender: "Ilala Municipal Council", message: "Hello Kajenjere Team, please make sure to update your order logs as soon as they are completed.", timestamp: new Date(Date.now() - 7200000).toLocaleTimeString(), isFromDriver: false },
      { id: "msg-2", sender: `${contractorName} Team`, message: "Copy that, municipal office. We will keep our order status updated.", timestamp: new Date(Date.now() - 7000000).toLocaleTimeString(), isFromDriver: true },
      { id: "msg-3", sender: "Customer (Kariakoo Residency)", message: "Our wastebin is full and needs collection. We just dispatched an order.", timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), isFromDriver: false }
    ];
    setSupportMessages(defaultMessages);
  }, [contractorName]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: "active" | "completed") => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
    }

    const local = JSON.parse(localStorage.getItem("emptying_orders") || "[]");
    const updatedLocal = local.map((o: any) => o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o);
    localStorage.setItem("emptying_orders", JSON.stringify(updatedLocal));

    try {
      await supabase
        .from("emptying_orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);
    } catch (err) {
      console.warn("DB update failed for emptying order:", err);
    }
  };

  // Mapbox initialization
  useEffect(() => {
    if (activeTab !== "orders" || !mapContainer.current) return;
    if (mapRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [39.2055, -6.7868],
      zoom: zoomLevel,
    });

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
  }, [activeTab]);

  // Update map markers and route line based on selected order and active jobs
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markerRefs.current.forEach(m => m.remove());
    markerRefs.current = [];

    // Helper to generate stable coordinates based on location name and order ID hash
    // Keeps dots distinct even for overlapping locations by applying stable hash offset
    const getCoordinates = (locName: string, id: string) => {
      const name = locName.toLowerCase();
      
      // Generate a stable offset based on hash of the ID
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // Calculate small lat/lng offset so that multiple markers at the same address are spread out
      const latOffset = ((Math.abs(hash) % 50) - 25) * 0.000045;
      const lngOffset = (((Math.abs(hash) >> 6) % 50) - 25) * 0.000045;
      
      let baseLat = -6.78680;
      let baseLng = 39.20550;
      
      if (name.includes("dispensary")) {
        baseLat = -6.78615;
        baseLng = 39.20465;
      } else if (name.includes("ubungo")) {
        baseLat = -6.78772;
        baseLng = 39.20605;
      }
      
      return {
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset
      };
    };

    // Filter to show all active jobs plus the currently selected order
    const activeJobs = orders.filter(o => o.status === "active");
    const ordersToShow = [...activeJobs];
    if (selectedOrder && !ordersToShow.find(o => o.id === selectedOrder.id)) {
      ordersToShow.push(selectedOrder);
    }

    // Add markers on map
    ordersToShow.forEach((o) => {
      const coords = getCoordinates(o.location_name, o.id);
      
      const markerEl = document.createElement("div");
      markerEl.className = "blinking-marker";
      markerEl.style.backgroundColor = getMarkerColor(o.fill_level || 90);
      markerEl.style.width = selectedOrder?.id === o.id ? "24px" : "18px";
      markerEl.style.height = selectedOrder?.id === o.id ? "24px" : "18px";
      markerEl.style.borderRadius = "50%";
      markerEl.style.boxShadow = selectedOrder?.id === o.id 
        ? "0 0 0 6px rgba(16, 185, 129, 0.4)" 
        : "0 0 0 4px rgba(255, 255, 255, 0.75)";
      markerEl.style.cursor = "pointer";
      markerEl.title = `${o.location_name} (${o.status})`;

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);

      markerRefs.current.push(marker);
    });

    // Helper to generate a winding/zig-zag route pattern winding around streets
    const generateMockRoute = (start: { lat: number; lng: number }, end: { lat: number; lng: number }, seed: string) => {
      // Calculate a stable seed hash
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const r1 = ((Math.abs(hash) % 100) - 50) / 100; // -0.5 to 0.5
      const r2 = (((Math.abs(hash) >> 4) % 100) - 50) / 100; // -0.5 to 0.5
      
      const dLng = end.lng - start.lng;
      const dLat = end.lat - start.lat;
      
      const p1_lng = start.lng + dLng * 0.35 + (dLat * 0.2 * r1);
      const p1_lat = start.lat + dLat * 0.25 - (dLng * 0.2 * r1);
      
      const p2_lng = start.lng + dLng * 0.7 + (dLat * 0.15 * r2);
      const p2_lat = start.lat + dLat * 0.75 - (dLng * 0.15 * r2);
      
      return [
        [start.lng, start.lat],
        [p1_lng, p1_lat],
        [p2_lng, p2_lat],
        [end.lng, end.lat]
      ];
    };

    // Construct sequential route connecting the depot to active jobs
    const depotCoords = { lat: -6.78772, lng: 39.20605 }; // Depot at Chuo cha Maji Ubungo
    const routeCoords: number[][] = [[depotCoords.lng, depotCoords.lat]];
    
    let currentPoint = depotCoords;
    
    // Connect each job sequentially
    ordersToShow.forEach((o) => {
      const coords = getCoordinates(o.location_name, o.id);
      const segment = generateMockRoute(currentPoint, coords, o.id);
      segment.slice(1).forEach(pt => routeCoords.push(pt));
      currentPoint = coords;
    });

    // Draw the route on Mapbox
    if (map.getSource("route")) {
      (map.getSource("route") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeCoords
        }
      });
    } else {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeCoords
          }
        }
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#10b981",
          "line-width": 5,
          "line-opacity": 0.85,
        }
      });
    }

    // Automatically fit all markers within map view
    if (routeCoords.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      routeCoords.forEach((pt) => {
        bounds.extend(pt as [number, number]);
      });
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 16.5,
        duration: 1200
      });
    } else if (selectedOrder) {
      const coords = getCoordinates(selectedOrder.location_name, selectedOrder.id);
      map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 17,
        duration: 1200
      });
    }
  }, [selectedOrder, orders, mapLoaded]);

  const applyZoom = (val: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomTo(map.getZoom() + val, { duration: 300 });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const newMsg: SupportMessage = {
      id: Math.random().toString(),
      sender: `${contractorName} Team`,
      message: newMessage,
      timestamp: new Date().toLocaleTimeString(),
      isFromDriver: true,
    };
    setSupportMessages(prev => [...prev, newMsg]);
    setNewMessage("");

    setTimeout(() => {
      const responseMsg: SupportMessage = {
        id: Math.random().toString(),
        sender: "Ilala Municipal Council",
        message: "Message received. We are routing this to the operations desk.",
        timestamp: new Date().toLocaleTimeString(),
        isFromDriver: false,
      };
      setSupportMessages(prev => [...prev, responseMsg]);
    }, 3000);
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const activeOrders = orders.filter(o => o.status === "active");
  const completedOrders = orders.filter(o => o.status === "completed");

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-800 font-sans">
      <style>{`
        @keyframes blink {
          0%, 49%, 100% { opacity: 1; }
          50%, 99% { opacity: 0.3; }
        }
        .blinking-marker {
          animation: blink 1.2s infinite;
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .wave-bar {
          display: inline-block;
          width: 4px;
          height: 30px;
          background-color: #10b981;
          margin: 0 2px;
          animation: wave 1.2s ease-in-out infinite;
        }
        .wave-bar:nth-child(2) { animation-delay: 0.2s; }
        .wave-bar:nth-child(3) { animation-delay: 0.4s; }
        .wave-bar:nth-child(4) { animation-delay: 0.6s; }
        .sidebar-btn-active {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
        }
        .sidebar-btn-inactive {
          color: #d1fae5 !important;
        }
        .sidebar-btn-inactive:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-b from-green-700 to-emerald-700 text-white flex flex-col justify-between z-30 shadow-lg transition-all duration-300`}>
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-green-600 flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Truck className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold tracking-tight text-white">Contractor</span>
            )}
          </div>

          {/* Navigation */}
          <nav className="mt-8 space-y-4 px-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center ${sidebarOpen ? "gap-3.5 px-4" : "justify-center px-0"} py-3 rounded-xl font-medium transition ${
                activeTab === "overview" ? "sidebar-btn-active" : "sidebar-btn-inactive"
              }`}
            >
              <Activity className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Overview</span>}
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                if (orders.length > 0 && !selectedOrder) {
                  setSelectedOrder(orders[0]);
                }
              }}
              className={`w-full flex items-center ${sidebarOpen ? "gap-3.5 px-4" : "justify-center px-0"} py-3 rounded-xl font-medium relative transition ${
                activeTab === "orders" ? "sidebar-btn-active" : "sidebar-btn-inactive"
              }`}
            >
              <div className="relative shrink-0">
                <Truck className="h-5 w-5" />
                {!sidebarOpen && pendingOrders.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                    {pendingOrders.length}
                  </span>
                )}
              </div>
              {sidebarOpen && (
                <div className="flex-1 flex justify-between items-center">
                  <span>Emptying Orders</span>
                  {pendingOrders.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 animate-bounce">
                      {pendingOrders.length}
                    </span>
                  )}
                </div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center ${sidebarOpen ? "gap-3.5 px-4" : "justify-center px-0"} py-3 rounded-xl font-medium transition ${
                activeTab === "messages" ? "sidebar-btn-active" : "sidebar-btn-inactive"
              }`}
            >
              <MessageSquare className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Support</span>}
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`w-full flex items-center ${sidebarOpen ? "gap-3.5 px-4" : "justify-center px-0"} py-3 rounded-xl font-medium transition ${
                activeTab === "team" ? "sidebar-btn-active" : "sidebar-btn-inactive"
              }`}
            >
              <Users className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Team</span>}
            </button>
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-3 border-t border-green-600">
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${sidebarOpen ? "gap-3.5 px-4" : "justify-center px-0"} py-3 rounded-xl font-medium transition sidebar-btn-inactive`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 capitalize">
                {activeTab === "orders" 
                  ? "Field Emptying Orders" 
                  : activeTab === "messages" 
                  ? "Dispatch Support" 
                  : activeTab === "team" 
                  ? `${contractorName} Company Team` 
                  : activeTab === "profile"
                  ? "Contractor Dispatch Profile"
                  : "Operations Overview"}
              </h1>
              <p className="text-gray-550 text-xs mt-0.5">Welcome back, dispatch team for {contractorName}.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-gray-100 rounded-2xl transition" onClick={() => setActiveTab("profile")}>
            <img
              src={contractorName === "Kajenjere" ? "/Assets/Kajenjere.png" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"}
              alt={contractorName}
              className="w-10 h-10 rounded-full object-cover border border-gray-250 shadow-sm"
            />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900 leading-tight">{contractorName} Dispatch</p>
              <p className="text-[11px] text-gray-500 font-semibold mt-0.5">info@{contractorName.toLowerCase()}.co.tz</p>
            </div>
          </div>
        </header>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 text-sm font-medium">Pending Dispatches</span>
                    <h3 className="text-4xl font-extrabold text-gray-900 mt-1.5">{pendingOrders.length}</h3>
                    <p className="text-xs text-gray-500 mt-2">Awaiting driver confirmation</p>
                  </div>
                  <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center border border-red-100">
                    <Clock className="h-7 w-7" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 text-sm font-medium">Active collections</span>
                    <h3 className="text-4xl font-extrabold text-green-600 mt-1.5">{activeOrders.length}</h3>
                    <p className="text-xs text-gray-500 mt-2">Drivers currently in field</p>
                  </div>
                  <div className="w-14 h-14 bg-green-55 text-green-600 rounded-2xl flex items-center justify-center border border-green-100">
                    <Truck className="h-7 w-7" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 text-sm font-medium">Completed orders</span>
                    <h3 className="text-4xl font-extrabold text-blue-600 mt-1.5">{completedOrders.length}</h3>
                    <p className="text-xs text-gray-500 mt-2">Sanitation cycles completed</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                </div>
              </div>

              {/* Active Jobs List */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm text-gray-800">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Current Active Tasks</h3>
                <div className="space-y-4">
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Truck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No active emptying jobs currently.</p>
                      <button
                        onClick={() => {
                          setActiveTab("orders");
                          if (orders.length > 0) setSelectedOrder(orders[0]);
                        }}
                        className="mt-3 text-sm text-green-600 hover:text-green-700 font-semibold"
                      >
                        Accept new dispatches &rarr;
                      </button>
                    </div>
                  ) : (
                    activeOrders.map(o => (
                      <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-5 rounded-2xl border border-gray-200 gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-bold uppercase">{o.sensor_type}</span>
                            <h4 className="font-bold text-gray-900 text-base">{o.location_name}</h4>
                          </div>
                          <p className="text-gray-600 text-xs mt-1">Reason: {o.dispatch_reason}</p>
                          <p className="text-gray-550 text-[10px] mt-1">Dispatched at: {new Date(o.created_at).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => updateOrderStatus(o.id, "completed")}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-center"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Mark Completed</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB WITH MAP */}
          {activeTab === "orders" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[500px]">
              {/* Order List (Left pane) */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Order Queues</h3>
                  
                  {loadingOrders ? (
                    <div className="text-center py-12 text-gray-550">Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-550">No orders found.</div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {orders.map(o => (
                        <button
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition ${
                            selectedOrder?.id === o.id
                              ? "border-green-600 bg-green-50/30"
                              : "border-gray-250 bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              o.status === "pending" ? "bg-red-100 text-red-700" : o.status === "active" ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-200 text-gray-600"
                            }`}>
                              {o.status}
                            </span>
                            <span className="text-[10px] text-gray-550 font-semibold">{o.sensor_type}</span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm mt-2">{o.location_name}</h4>
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-200">
                            <span className="text-[10px] text-gray-550">Fill Level: <strong className="text-gray-700">{o.fill_level}%</strong></span>
                            <span className="text-[10px] text-green-600 font-bold hover:underline">View details &rarr;</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Map & Action Details (Right pane) */}
              <div className="lg:col-span-2 flex flex-col h-full">
                {selectedOrder ? (
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between h-full min-h-[500px]">
                    {/* Top Header Card Info */}
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedOrder.location_name}</h3>
                          <p className="text-xs text-gray-500 mt-1">Category: {selectedOrder.sensor_type} • Dispatch Reason: {selectedOrder.dispatch_reason}</p>
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            selectedOrder.status === "pending" ? "bg-red-100 text-red-700" : selectedOrder.status === "active" ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-200 text-gray-600"
                          }`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mapbox container */}
                    <div className="relative flex-1 min-h-[320px] mb-4">
                      <div ref={mapContainer} className="w-full h-full min-h-[320px] rounded-2xl border border-gray-200 overflow-hidden shadow-inner" />
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                        <button onClick={() => applyZoom(1)} className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition shadow-md border border-gray-300">
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button onClick={() => applyZoom(-1)} className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition shadow-md border border-gray-300">
                          <ZoomOut className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action buttons placed at the bottom */}
                    <div className="pt-4 border-t border-gray-200 flex justify-end gap-3 pb-2">
                      {selectedOrder.status === "pending" && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, "active")}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-sm active:scale-95 transform"
                        >
                          Accept Emptying Job
                        </button>
                      )}
                      {selectedOrder.status === "active" && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, "completed")}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-sm active:scale-95 transform"
                        >
                          Complete Emptying Job
                        </button>
                      )}
                      {selectedOrder.status === "completed" && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5">
                          ✓ Job Completed Successfully
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center text-gray-500">
                    <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">No order selected</p>
                    <p className="text-sm mt-1">Select an order from the list to view route path and accept jobs.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MESSAGES / CHAT TAB */}
          {activeTab === "messages" && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col h-[550px] justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Direct Dispatch Support
                </h3>
                
                {/* Message logs */}
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
                  {supportMessages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.isFromDriver ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                        m.isFromDriver ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"
                      }`}>
                        <p className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${
                          m.isFromDriver ? "text-green-200" : "text-gray-500"
                        }`}>{m.sender}</p>
                        <p className="leading-relaxed">{m.message}</p>
                      </div>
                      <span className="text-[9px] text-gray-500 mt-1">{m.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type dispatch support update here..."
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === "team" && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Company Directory</h3>
                  <p className="text-sm text-gray-500 hidden md:block">Meet the dedicated sanitation professionals, drivers, and technicians at {contractorName}.</p>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-3.5 rounded-2xl transition shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transform duration-150 shrink-0"
                >
                  + Add Team Member
                </button>
              </div>

              {/* Team Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center transition hover:shadow-md animate-fadeIn">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-inner mb-4"
                    />
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 ${
                      member.category === "Supervisor" ? "bg-red-50 text-red-700 border border-red-100" : member.category === "Technician" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-green-50 text-green-700 border border-green-100"
                    }`}>
                      {member.category}
                    </span>
                    <h4 className="font-bold text-gray-900 text-base">{member.name}</h4>
                    <p className="text-gray-500 text-xs mt-1 leading-normal">{member.role}</p>
                  </div>
                ))}
              </div>

              {/* Add Team Member Modal */}
              {showAddMemberModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-gray-150 shadow-2xl space-y-6 transform transition-all duration-300 scale-100 text-left">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-150">
                      <h3 className="text-xl font-bold text-gray-900">Add New Team Member</h3>
                      <button 
                        onClick={() => setShowAddMemberModal(false)}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Name field */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Athumani Juma"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-800"
                        />
                      </div>

                      {/* Category / Occupation dropdown */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Occupation</label>
                        <select
                          value={newMemberCategory}
                          onChange={(e) => setNewMemberCategory(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-800"
                        >
                          <option value="Driver">Driver</option>
                          <option value="Technician">Technician</option>
                          <option value="Supervisor">Supervisor</option>
                        </select>
                      </div>

                      {/* Role / Job field */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Job / Specific Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Lead Vacuum Driver"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-800"
                        />
                      </div>

                      {/* File Upload Picker Field */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Upload Profile Photo</label>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-250 border-2 border-white shadow-md flex items-center justify-center shrink-0">
                            {newMemberImage ? (
                              <img src={newMemberImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-gray-400">No Image</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium mb-1.5">Choose a JPG/PNG from your device.</p>
                            <label className="cursor-pointer inline-block bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition border border-gray-300 shadow-sm">
                              Upload Image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setNewMemberImage(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer buttons */}
                    <div className="pt-4 border-t border-gray-150 flex justify-end gap-3">
                      <button
                        onClick={() => setShowAddMemberModal(false)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-5 py-3 rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!newMemberName.trim() || !newMemberRole.trim()) {
                            alert("Please fill in all fields.");
                            return;
                          }
                          const newMember = {
                            name: newMemberName,
                            role: newMemberRole,
                            category: newMemberCategory,
                            image: newMemberImage,
                          };
                          setTeamMembers(prev => [...prev, newMember]);
                          // Reset fields
                          setNewMemberName("");
                          setNewMemberRole("");
                          setNewMemberCategory("Driver");
                          setNewMemberImage("");
                          setShowAddMemberModal(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md hover:shadow-lg"
                      >
                        Add Member
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-gray-200">
                <div className="relative">
                  <img
                    src={contractorName === "Kajenjere" ? "/Assets/Kajenjere.png" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"}
                    alt={contractorName}
                    className="w-28 h-28 rounded-full border-4 border-green-100 shadow-md object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Authorized Sanitation Partner
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 mt-2">{contractorName} Company Limited</h3>
                  <p className="text-gray-500 text-sm mt-1">Specialized liquid waste management & emptying services</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-semibold">
                      ID: SmartDar-{contractorName.substring(0, 3).toUpperCase()}-2026
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-semibold">
                      Rating: ★ 4.9/5.0
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Office & Contact Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block">Physical Address</label>
                      <p className="text-sm font-bold text-gray-800">
                        {contractorName === "Kajenjere" 
                          ? "Plot 42, Morogoro Road, Kariakoo, Dar es Salaam"
                          : "Ubungo Industrial Area, Block D, Dar es Salaam"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block">Office Lines</label>
                      <p className="text-sm font-bold text-gray-800">+255 22 284 3902 / +255 784 908 112</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block">Primary Operations Email</label>
                      <p className="text-sm font-bold text-gray-800">dispatch@{contractorName.toLowerCase()}.co.tz</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block">Emergency Hotline</label>
                      <p className="text-sm font-bold text-gray-800">+255 22 212 9088</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Operations & Fleet</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block">Fleet Count</label>
                      <p className="text-sm font-bold text-gray-800">
                        {contractorName === "Kajenjere" 
                          ? "4 Honey Sucker Trucks (12,000L, 10,000L & 2x 8,000L)"
                          : "3 Vacuum Exhaust Trucks (12,000L & 2x 10,000L)"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block">Assigned Service Zones</label>
                      <p className="text-sm font-bold text-gray-800">
                        {contractorName === "Kajenjere" 
                          ? "Kariakoo, Gerezani, Ilala, Temeke" 
                          : contractorName === "Sateki" 
                          ? "Ubungo, Chuo cha Maji, Kimara, Kibamba"
                          : "Upanga, Kisutu, Kivukoni"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-550 block">Primary Supervisor</label>
                      <p className="text-sm font-bold text-gray-800">Isdory Denis (Operations Director)</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block">Operating License Number</label>
                      <p className="text-sm font-bold text-gray-800">NEMC/WMA/2026/0942</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
