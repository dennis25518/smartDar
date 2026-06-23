import { useState, useEffect } from "react";
import { useSensorData, type Alert } from "../hooks/useSensorData";
import { useUserProfile } from "../hooks/useUserProfile";
import { supabase } from "../lib/supabaseClient";
import ProfileSettings from "./ProfileSettings";

interface DashboardPageProps {
  onLogout: () => void;
}

interface WasteLocation {
  id: string;
  name: string;
  fillLevel: number;
  status: "critical" | "warning" | "optimal";
  lastUpdated: string;
  location: string;
  sensorNumber: number;
  activeAlert: Alert | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success";
  read: boolean;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  message: string;
  response_message?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

type TabType = "overview" | "notification" | "status" | "profile" | "support";

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch real-time sensor data
  const { sensors, latestReadings, alerts, loading, error } = useSensorData();

  // Fetch user profile
  const { profile } = useUserProfile();

  // Build current user from profile
  const currentUser = {
    name: profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        profile.email ||
        "SmartDar User"
      : "SmartDar User",
    email: profile?.email || "user@smartdar.tz",
    image:
      profile?.avatar_url ||
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  };

  const [supportForm, setSupportForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    subject: "",
    category: "general",
    message: "",
  });
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportChatMessage, setSupportChatMessage] = useState("");

  // Update support form when profile loads
  useEffect(() => {
    if (profile) {
      setSupportForm((prev) => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email,
      }));
    }
  }, [profile, currentUser.name, currentUser.email]);

  useEffect(() => {
    const loadSupportTickets = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("support_tickets")
          .select(
            "id, ticket_number, subject, category, message, response_message, status, created_at, updated_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading support tickets:", error);
          return;
        }

        setSupportTickets(data ?? []);
      } catch (err) {
        console.error("Support ticket load error:", err);
      }
    };

    loadSupportTickets();
  }, []);

  // Labels for each sensor_number
  const sensorNumberLabels: Record<number, string> = {
    1: "Wastebin",
    2: "Septic Tank",
  };

  // Convert sensor readings to waste locations format — one card per sensor_number
  const wasteLocations: WasteLocation[] = sensors
    .flatMap((sensor) => {
      const sensorReadings = Array.from(latestReadings.values()).filter(
        (r) =>
          String(r.sensor_id) === String(sensor.id) ||
          r.device_id === sensor.device_id,
      );

      if (sensorReadings.length === 0) {
        return [
          {
            id: sensor.id,
            name: sensor.location_name,
            fillLevel: 0,
            status: "optimal" as const,
            lastUpdated: "No data",
            location: sensor.device_id,
            sensorNumber: 0,
            activeAlert: null,
          },
        ];
      }

      return sensorReadings.map((reading) => {
        let status: "optimal" | "warning" | "critical" = "optimal";
        if (reading.fill_level >= 85) {
          status = "critical";
        } else if (reading.fill_level >= 60) {
          status = "warning";
        }

        // Find active alert for this sensor
        const activeAlert =
          alerts.find(
            (a) =>
              a.sensor_number === reading.sensor_number &&
              a.sensor_id === sensor.id &&
              !a.resolved,
          ) ?? null;

        const lastReadingTime = new Date(reading.created_at);
        const now = new Date();
        const diffMs = now.getTime() - lastReadingTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        let lastUpdated = "No data";
        if (diffMins < 1) {
          lastUpdated = "Just now";
        } else if (diffMins < 60) {
          lastUpdated = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
        } else {
          lastUpdated = lastReadingTime.toLocaleTimeString();
        }

        const label =
          sensorNumberLabels[reading.sensor_number] ??
          `Sensor ${reading.sensor_number}`;
        const name =
          sensorReadings.length > 1
            ? `${sensor.location_name} – ${label}`
            : sensor.location_name;

        return {
          id: `${sensor.id}-${reading.sensor_number}`,
          name,
          fillLevel: reading.fill_level,
          status,
          lastUpdated,
          location: sensor.device_id,
          sensorNumber: reading.sensor_number,
          activeAlert,
        };
      });
    })
    .sort((a, b) => a.sensorNumber - b.sensorNumber);

  // Convert alerts to notifications
  const notifications: Notification[] = alerts.map((alert) => ({
    id: alert.id,
    title:
      alert.alert_type === "critical"
        ? "⚠️ Critical Level Alert"
        : "⚡ Warning Level Alert",
    message: alert.message,
    timestamp: formatTimestamp(new Date(alert.created_at)),
    type: alert.alert_type === "critical" ? "warning" : "info",
    read: alert.resolved,
  }));

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [dispatchReason, setDispatchReason] = useState("");
  const [reportLocation, setReportLocation] = useState<WasteLocation | null>(
    null,
  );
  const [showCallPopup, setShowCallPopup] = useState(false);

  function formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const handleDispatchRequest = () => {
    if (selectedLocation && dispatchReason) {
      // close dispatch modal
      setSelectedLocation(null);
      setDispatchReason("");
      
      // Trigger browser dialer to initiate a real phone call to the dispatch center
      window.location.href = "tel:+255624031107";
      
      // show call animation popup
      setShowCallPopup(true);
      // auto-close after 6 seconds (3 loops at ~2s each)
      setTimeout(() => setShowCallPopup(false), 6000);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportForm.subject || !supportForm.message) {
      setSupportError("Please fill in all required fields");
      return;
    }

    setSupportLoading(true);
    setSupportError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("support_tickets").insert([
        {
          user_id: user.id,
          name: supportForm.name,
          email: supportForm.email,
          subject: supportForm.subject,
          category: supportForm.category,
          message: supportForm.message,
          status: "open",
        },
      ]);

      if (error) throw error;

      setSupportForm({
        name: currentUser.name,
        email: currentUser.email,
        subject: "",
        category: "general",
        message: "",
      });
      setSupportTickets((prev) => [
        {
          id: "",
          ticket_number: "",
          subject: supportForm.subject,
          category: supportForm.category,
          message: supportForm.message,
          response_message: null,
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err) {
      setSupportError(
        err instanceof Error ? err.message : "Failed to submit support ticket",
      );
      console.error("Support ticket error:", err);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const sensorIds = sensors.map((s) => s.id);
      if (sensorIds.length === 0) return;

      const { error: markError } = await supabase
        .from("alerts")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("sensor_id", sensorIds)
        .eq("resolved", false);

      if (markError) throw markError;
    } catch (err) {
      console.error("Failed to mark alerts as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 4l4 2m-2-2l-4 2"
          />
        </svg>
      ),
    },
    {
      id: "notification",
      label: "Notifications",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      badge: unreadCount,
    },
    {
      id: "status",
      label: "Device Status",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "support",
      label: "Support",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-green-700 to-emerald-700 text-white transition-all duration-300 fixed left-0 top-0 h-screen shadow-lg hidden lg:flex lg:flex-col z-40`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-green-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            {sidebarOpen && <span className="text-xl font-bold">smartDar</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 space-y-2 px-3 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? "bg-white bg-opacity-20 text-white"
                  : "text-green-100 hover:bg-white hover:bg-opacity-10"
              }`}
            >
              {item.icon}
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </nav>
        {/* Logout Button */}
        <div className="p-3 border-t border-green-600">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-200 hover:bg-white hover:bg-opacity-10 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu */}
          <div className="absolute left-0 top-0 h-screen w-64 bg-gradient-to-b from-green-700 to-emerald-700 text-white shadow-lg flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-green-600 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold">smartDar</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-8 space-y-2 px-3 flex-1 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    activeTab === item.id
                      ? "bg-white bg-opacity-20 text-white"
                      : "text-green-100 hover:bg-white hover:bg-opacity-10"
                  }`}
                >
                  {item.icon}
                  <div className="flex-1 text-left">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="p-3 border-t border-green-600">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-200 hover:bg-white hover:bg-opacity-10 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}
      >
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition lg:hidden"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Desktop Toggle Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition hidden lg:block"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navItems.find((item) => item.id === activeTab)?.label}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <img
                src={currentUser.image}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-green-600"
              />
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {currentUser.name}
                </p>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-4 text-gray-600">Loading sensor data...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">Error loading data: {error}</p>
                </div>
              )}

              {/* Overview Stats */}
              {!loading && !error && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">
                            Active Devices
                          </p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {sensors.length}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">
                            Average Fill Level
                          </p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {wasteLocations.length > 0
                              ? Math.round(
                                  wasteLocations.reduce(
                                    (a, b) => a + b.fillLevel,
                                    0,
                                  ) / wasteLocations.length,
                                )
                              : 0}
                            %
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">
                            Critical Alerts
                          </p>
                          <p className="text-3xl font-bold text-red-600 mt-2">
                            {
                              alerts.filter(
                                (a) =>
                                  a.alert_type === "critical" && !a.resolved,
                              ).length
                            }
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Waste Level Monitoring */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-2xl">
                      <h2 className="text-2xl font-bold text-white">
                        Real-Time Waste Levels
                      </h2>
                      <p className="text-green-100 mt-1">
                        Monitor your {wasteLocations.length} active sensor
                        {wasteLocations.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {wasteLocations.length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl text-center">
                        <p className="text-gray-600">
                          No sensors registered yet.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Please register your ESP32 device in your settings.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {wasteLocations.map((location) => (
                          <div
                            key={location.id}
                            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition"
                          >
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {location.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    📍 {location.location}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                  <div
                                    className={`px-3 py-1 rounded-full font-semibold text-sm ${
                                      location.status === "critical"
                                        ? "bg-red-100 text-red-700"
                                        : location.status === "warning"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-green-100 text-green-700"
                                    }`}
                                  >
                                    {location.status.toUpperCase()}
                                  </div>
                                  {location.activeAlert && (
                                    <div
                                      className={`px-2 py-1 rounded-full font-semibold text-xs flex items-center gap-1 ${
                                        location.activeAlert.alert_type ===
                                        "critical"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      <span>
                                        {location.activeAlert.alert_type ===
                                        "critical"
                                          ? "🚨"
                                          : "⚠️"}
                                      </span>
                                      ALERT
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-baseline space-x-2 mb-4">
                                <p
                                  className={`text-4xl font-bold ${getStatusTextColor(location.status)}`}
                                >
                                  {location.fillLevel}%
                                </p>
                                <p className="text-gray-600 text-sm">
                                  capacity
                                </p>
                              </div>

                              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-3">
                                <div
                                  className={`h-full ${getStatusColor(location.status)} transition-all duration-500 rounded-full`}
                                  style={{ width: `${location.fillLevel}%` }}
                                ></div>
                              </div>

                              <p className="text-xs text-gray-500 mb-4">
                                ⏱ Last updated: {location.lastUpdated}
                              </p>

                              <div className="flex gap-3">
                                <button
                                  onClick={() =>
                                    setSelectedLocation(location.name)
                                  }
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                                >
                                  Request Dispatch
                                </button>
                                <button
                                  onClick={() => setReportLocation(location)}
                                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition text-sm"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notification" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Notifications
                  </h2>
                  <p className="text-gray-600 mt-1 flex items-center gap-4">
                    <span>
                      You have {unreadCount} unread notification
                      {unreadCount !== 1 ? "s" : ""}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-green-600 hover:text-green-700 font-semibold underline transition focus:outline-none"
                      >
                        Mark all as read
                      </button>
                    )}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full text-lg">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <p className="text-gray-600 text-lg font-medium">
                      No notifications yet
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-2xl shadow-md overflow-hidden transition hover:shadow-lg border-l-4 ${
                        notification.type === "warning"
                          ? "bg-yellow-50 border-yellow-500"
                          : notification.type === "success"
                            ? "bg-green-50 border-green-500"
                            : "bg-blue-50 border-blue-500"
                      }`}
                    >
                      <div className="p-6 flex gap-4">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.type === "warning"
                              ? "bg-yellow-200"
                              : notification.type === "success"
                                ? "bg-green-200"
                                : "bg-blue-200"
                          }`}
                        >
                          {notification.type === "warning" && (
                            <svg
                              className="w-7 h-7 text-yellow-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          {notification.type === "success" && (
                            <svg
                              className="w-7 h-7 text-green-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          {notification.type === "info" && (
                            <svg
                              className="w-7 h-7 text-blue-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-lg text-gray-900">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="inline-block mt-2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-xs font-medium">
                              {notification.timestamp}
                            </p>
                          </div>
                          <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Device Status Tab */}
          {activeTab === "status" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Device Status
                </h2>
                <p className="text-gray-600 mt-1">
                  Real-time monitoring of all active sensors
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {wasteLocations.map((location) => (
                  <div
                    key={location.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition transform hover:scale-105"
                  >
                    <div
                      className={`h-2 ${
                        location.status === "critical"
                          ? "bg-red-500"
                          : location.status === "warning"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {location.name}
                          </h3>
                          <p className="text-gray-600 mt-1 flex items-center gap-1">
                            📍 {location.location}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                            location.status === "critical"
                              ? "bg-red-100 text-red-700"
                              : location.status === "warning"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {location.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-5">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                          <div className="flex items-baseline justify-between mb-2">
                            <span className="text-gray-700 font-semibold">
                              Fill Level
                            </span>
                            <span
                              className={`text-3xl font-bold ${getStatusTextColor(location.status)}`}
                            >
                              {location.fillLevel}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full ${getStatusColor(location.status)} rounded-full transition-all duration-500`}
                              style={{ width: `${location.fillLevel}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 mb-1">
                              Sensor ID
                            </p>
                            <p className="font-semibold text-gray-900">
                              SEN-{location.id}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-green-600 mb-1">
                              Status
                            </p>
                            <p className="font-semibold text-green-700">
                              ● Active
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-600">Last Updated</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            ⏱ {location.lastUpdated}
                          </p>
                        </div>

                        <button
                          onClick={() => setReportLocation(location)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 rounded-lg transition"
                        >
                          View Full Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && <ProfileSettings />}

          {/* Support Tab */}
          {activeTab === "support" && (
            <div className="max-w-2xl mx-auto">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Get Support
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Contact the Ilala District Council support team
                  </p>
                </div>

                {supportTickets.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={supportForm.name}
                            onChange={(e) =>
                              setSupportForm({
                                ...supportForm,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={supportForm.email}
                            onChange={(e) =>
                              setSupportForm({
                                ...supportForm,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={supportForm.subject}
                          onChange={(e) =>
                            setSupportForm({
                              ...supportForm,
                              subject: e.target.value,
                            })
                          }
                          placeholder="e.g., Sensor Issue, Dispatch Problem, etc."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={supportForm.category}
                          onChange={(e) =>
                            setSupportForm({
                              ...supportForm,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="technical">Technical Issue</option>
                          <option value="sensor">Sensor Problem</option>
                          <option value="dispatch">Dispatch Issue</option>
                          <option value="account">Account & Billing</option>
                          <option value="feedback">
                            Feature Request / Feedback
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Message
                        </label>
                        <textarea
                          value={supportForm.message}
                          onChange={(e) =>
                            setSupportForm({
                              ...supportForm,
                              message: e.target.value,
                            })
                          }
                          placeholder="Please describe your issue or inquiry in detail..."
                          rows={6}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">
                            Expected Response Time:
                          </span>{" "}
                          24 business hours
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                          <span className="font-semibold">Support Hours:</span>{" "}
                          Monday - Friday, 8:00 AM - 5:00 PM EAT
                        </p>
                      </div>

                      {supportError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-700 font-semibold">Error:</p>
                          <p className="text-red-600 text-sm mt-1">
                            {supportError}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleSupportSubmit}
                        disabled={supportLoading}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 text-white font-bold py-3 rounded-lg transition"
                      >
                        {supportLoading ? "Sending..." : "Send Support Request"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            Support Conversation
                          </h3>
                          <p className="text-gray-600 mt-1">
                            Continue the conversation with our support team.
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                          {supportTickets[0].status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
                        {supportTickets.map((ticket) => (
                          <div
                            key={ticket.id || ticket.created_at}
                            className="space-y-3"
                          >
                            <div className="rounded-2xl bg-green-50 p-4">
                              <p className="text-xs text-gray-500">
                                {new Date(ticket.created_at).toLocaleString()}
                              </p>
                              <p className="font-semibold text-gray-900 mt-2">
                                {ticket.subject}
                              </p>
                              <p className="text-gray-700 mt-2">
                                {ticket.message}
                              </p>
                            </div>

                            {ticket.response_message && (
                              <div className="rounded-2xl bg-gray-100 p-4 border border-gray-200">
                                <p className="text-xs text-gray-500">
                                  Support reply
                                </p>
                                <p className="text-gray-800 mt-2">
                                  {ticket.response_message}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">
                          Send a follow-up message
                        </label>
                        <textarea
                          value={supportChatMessage}
                          onChange={(e) =>
                            setSupportChatMessage(e.target.value)
                          }
                          rows={4}
                          placeholder="Type your follow-up message here..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                        <button
                          onClick={async () => {
                            if (!supportChatMessage.trim()) return;
                            setSupportLoading(true);
                            setSupportError(null);
                            try {
                              const {
                                data: { user },
                              } = await supabase.auth.getUser();
                              if (!user)
                                throw new Error("User not authenticated");

                              const { error } = await supabase
                                .from("support_tickets")
                                .insert([
                                  {
                                    user_id: user.id,
                                    name: currentUser.name,
                                    email: currentUser.email,
                                    subject: `Follow-up: ${supportTickets[0].subject}`,
                                    category: supportTickets[0].category,
                                    message: supportChatMessage.trim(),
                                    status: "open",
                                  },
                                ]);
                              if (error) throw error;
                              setSupportTickets((prev) => [
                                {
                                  id: "",
                                  ticket_number: "",
                                  subject: `Follow-up: ${supportTickets[0].subject}`,
                                  category: supportTickets[0].category,
                                  message: supportChatMessage.trim(),
                                  response_message: null,
                                  status: "open",
                                  created_at: new Date().toISOString(),
                                  updated_at: new Date().toISOString(),
                                },
                                ...prev,
                              ]);
                              setSupportChatMessage("");
                            } catch (err) {
                              setSupportError(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to send follow-up message",
                              );
                            } finally {
                              setSupportLoading(false);
                            }
                          }}
                          disabled={supportLoading}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 text-white font-bold py-3 rounded-lg transition"
                        >
                          {supportLoading ? "Sending..." : "Send Follow-up"}
                        </button>
                        {supportError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-700 font-semibold">Error:</p>
                            <p className="text-red-600 text-sm mt-1">
                              {supportError}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white rounded-xl shadow-md p-6 text-center">
                    <div className="text-3xl mb-2">📞</div>
                    <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
                    <p className="text-gray-600 text-sm">
                      +255 (0) 22 211 0001
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6 text-center">
                    <div className="text-3xl mb-2">📧</div>
                    <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600 text-sm">support@ilaladcc.tz</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6 text-center">
                    <div className="text-3xl mb-2">💬</div>
                    <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
                    <p className="text-gray-600 text-sm">+255 741 234 567</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Dispatch Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Request Dispatch
              </h3>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Location
                </label>
                <div className="bg-gray-100 p-3 rounded-lg text-gray-900 font-medium">
                  {selectedLocation}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for Dispatch
                </label>
                <select
                  value={dispatchReason}
                  onChange={(e) => setDispatchReason(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Select a reason</option>
                  <option value="High fill level">High Fill Level</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Overflow risk">Overflow Risk</option>
                </select>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> A dispatch team will be assigned within
                  30 minutes.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatchRequest}
                  disabled={!dispatchReason}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Device Report
              </h3>
              <button
                onClick={() => setReportLocation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Sensor</p>
                <p className="text-lg font-semibold text-gray-900">
                  {reportLocation.name}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500">Fill Level</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportLocation.fillLevel}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {reportLocation.status.toUpperCase()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500">Device</p>
                  <p className="text-sm font-medium text-gray-900">
                    {reportLocation.location}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {reportLocation.lastUpdated}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setReportLocation(null)}
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Call Animation Popup for Dispatch */}
      {showCallPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col items-center gap-4">
            <lottie-player
              src={encodeURI("/Animation/call Animation.json")}
              background="transparent"
              speed="1"
              loop={3}
              style={{ width: "160px", height: "160px" }}
              autoplay
            ></lottie-player>
            <h3 className="text-lg font-bold text-gray-900">
              Dispatch Requested
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Your dispatch request has been sent. A team will contact you
              shortly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
