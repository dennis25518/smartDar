import { useState } from "react";
import {
  Monitor,
  Users,
  Phone,
  MapPin,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAdminData } from "../hooks/useAdminData";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminQuestions } from "../hooks/useAdminQuestions";
import { useAdminSensors } from "../hooks/useAdminSensors";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminRoute from "./admin/AdminRoute";
import AdminQuestions from "./admin/AdminQuestions";
import AdminProfile from "./admin/AdminProfile";
import AdminContractors from "./admin/AdminContractors";

interface AdminDashboardPageProps {
  onLogout: () => void;
}

type AdminTabType =
  | "overview"
  | "users"
  | "route"
  | "questions"
  | "profile"
  | "contractors";

export default function AdminDashboardPage({
  onLogout,
}: AdminDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { stats, loading: statsLoading } = useAdminData();
  const { users, loading: usersLoading } = useAdminUsers();
  const {
    tickets,
    loading: ticketsLoading,
    updateTicket,
  } = useAdminQuestions();
  const { sensors, loading: sensorsLoading } = useAdminSensors();

  const isLoading =
    statsLoading || usersLoading || ticketsLoading || sensorsLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-900 text-white transition-all duration-300 fixed h-full z-40`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-green-400">SmartDar Admin</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="mt-6 space-y-2 px-2">
          {[
            {
              id: "overview",
              label: "Overview",
              icon: <Monitor className="h-5 w-5" />,
            },
            {
              id: "users",
              label: "Users",
              icon: <Users className="h-5 w-5" />,
            },
            {
              id: "contractors",
              label: "Contractors",
              icon: <Phone className="h-5 w-5" />,
            },
            {
              id: "route",
              label: "Route Map",
              icon: <MapPin className="h-5 w-5" />,
            },
            {
              id: "questions",
              label: "Questions",
              icon: <MessageSquare className="h-5 w-5" />,
              badge: tickets.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTabType)}
              className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                activeTab === tab.id
                  ? "bg-green-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {tab.icon}
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            {sidebarOpen ? "Logout" : <LogOut className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {activeTab.replace("-", " ")}
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("profile")}
                className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 border border-green-100 hover:bg-green-100 transition"
              >
                View Admin Profile
              </button>
              <div className="w-10 h-10 overflow-hidden rounded-full border border-green-200">
                <img
                  src="/Assets/Manispaa.png"
                  alt="Admin profile"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "overview" && stats && (
                <AdminOverview stats={stats} />
              )}
              {activeTab === "profile" && <AdminProfile />}
              {activeTab === "users" && <AdminUsers users={users} />}
              {activeTab === "contractors" && <AdminContractors />}
              {activeTab === "route" && <AdminRoute sensors={sensors} />}
              {activeTab === "questions" && (
                <AdminQuestions tickets={tickets} updateTicket={updateTicket} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
