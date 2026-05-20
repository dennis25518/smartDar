import { useState } from "react";
import { AdminStats } from "../../hooks/useAdminData";
import {
  Users,
  Satellite,
  AlertTriangle,
  Bell,
  Ticket,
  CheckCircle2,
  Activity,
} from "lucide-react";

interface AdminOverviewProps {
  stats: AdminStats;
}

type ActionKey =
  | "addUser"
  | "manageSensors"
  | "viewReports"
  | "settings"
  | null;

const actionDetails: Record<
  Exclude<ActionKey, null>,
  { title: string; description: string; bullets: string[] }
> = {
  addUser: {
    title: "Add User",
    description:
      "Create new system accounts for operators and field staff with clear provisioning guidelines.",
    bullets: [
      "Verify email and profile details before onboarding.",
      "Assign the correct access role for monitoring or maintenance.",
      "Notify new users of alert handling procedures.",
    ],
  },
  manageSensors: {
    title: "Manage Sensors",
    description:
      "Keep sensor inventory healthy by checking active status, recent updates, and service needs.",
    bullets: [
      "Review last data timestamps and fill level trends.",
      "Flag sensors with critical fill levels first.",
      "Confirm device status before dispatching contractors.",
    ],
  },
  viewReports: {
    title: "View Reports",
    description:
      "Access essential system reports to track overall health, alerts, and field performance.",
    bullets: [
      "Monitor daily and weekly fill level averages.",
      "Compare active versus resolved alerts.",
      "Export summaries for stakeholder reviews.",
    ],
  },
  settings: {
    title: "Settings",
    description:
      "Adjust system thresholds, notification channels, and admin roles to maintain reliable monitoring.",
    bullets: [
      "Update alert thresholds for critical and warning conditions.",
      "Confirm notification routes for field crews.",
      "Review admin access and system permissions regularly.",
    ],
  },
};

export default function AdminOverview({ stats }: AdminOverviewProps) {
  const [activeAction, setActiveAction] = useState<ActionKey>("addUser");
  const avgFillLevelFormatted = stats.avgFillLevel.toFixed(1);

  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="h-7 w-7 text-blue-600" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Sensors",
      value: stats.activeSensors,
      icon: <Satellite className="h-7 w-7 text-green-600" />,
      bgColor: "bg-green-50",
    },
    {
      title: "Critical Alerts",
      value: stats.criticalAlerts,
      icon: <AlertTriangle className="h-7 w-7 text-red-600" />,
      bgColor: "bg-red-50",
    },
    {
      title: "Warning Alerts",
      value: stats.warningAlerts,
      icon: <Bell className="h-7 w-7 text-yellow-600" />,
      bgColor: "bg-yellow-50",
    },
    {
      title: "Open Support Tickets",
      value: stats.openTickets,
      icon: <Ticket className="h-7 w-7 text-purple-600" />,
      bgColor: "bg-purple-50",
    },
    {
      title: "Resolved Tickets",
      value: stats.resolvedTickets,
      icon: <CheckCircle2 className="h-7 w-7 text-emerald-600" />,
      bgColor: "bg-emerald-50",
    },
    {
      title: "Avg Fill Level",
      value: `${avgFillLevelFormatted}%`,
      icon: <Activity className="h-7 w-7 text-indigo-600" />,
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.slice(0, 4).map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} rounded-lg p-6 border border-gray-200 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {card.value}
                </p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.slice(4).map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} rounded-lg p-6 border border-gray-200 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {card.value}
                </p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                System Uptime
              </span>
              <span className="text-sm font-bold text-green-600">99.8%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: "99.8%" }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Sensor Response Rate
              </span>
              <span className="text-sm font-bold text-green-600">97.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: "97.2%" }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Average Alert Response Time
              </span>
              <span className="text-sm font-bold text-blue-600">
                {stats.criticalAlerts > 0 ? "2.3 min" : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm relative">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(
            [
              {
                key: "addUser",
                label: "Add User",
                color: "bg-green-600",
                hover: "hover:bg-green-700",
              },
              {
                key: "manageSensors",
                label: "Manage Sensors",
                color: "bg-blue-600",
                hover: "hover:bg-blue-700",
              },
              {
                key: "viewReports",
                label: "View Reports",
                color: "bg-purple-600",
                hover: "hover:bg-purple-700",
              },
              {
                key: "settings",
                label: "Settings",
                color: "bg-gray-600",
                hover: "hover:bg-gray-700",
              },
            ] as const
          ).map((action) => (
            <button
              key={action.key}
              onClick={() => setActiveAction(action.key)}
              className={`${action.color} ${action.hover} text-white rounded-lg transition text-sm font-medium px-4 py-2 ${
                activeAction === action.key ? "ring-2 ring-green-500" : ""
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {activeAction && (
          <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase font-semibold text-green-700 tracking-wide">
                  {actionDetails[activeAction].title}
                </p>
                <p className="mt-2 text-gray-700">
                  {actionDetails[activeAction].description}
                </p>
              </div>
              <button
                onClick={() => setActiveAction(null)}
                className="self-start rounded-full border border-green-300 bg-white px-3 py-1 text-sm font-semibold text-green-700 hover:bg-green-100 transition"
              >
                Close
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-gray-700">
              {actionDetails[activeAction].bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-green-700"></span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
