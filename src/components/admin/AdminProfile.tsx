import { User, Mail, Phone, Briefcase, MapPin, Clock4 } from "lucide-react";

export default function AdminProfile() {
  const profile = {
    name: "Ilala Municipal Council",
    role: "System Administrator",
    email: "admin@smartdar.tz",
    phone: "+255-62599-7791",
    organization: "Ilala Municipal Monitoring",
    location: "Dar es salaam, Tanzania",
    joined: "March 2026",
    bio: "Leads monitoring, contractor coordination, and incident response across the smartDar network.",
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase text-green-600">
              Admin Profile
            </p>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              {profile.name}
            </h1>
            <p className="mt-2 text-gray-600 max-w-2xl">{profile.bio}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 overflow-hidden rounded-3xl bg-gray-100 border border-gray-200">
              <img
                src="/Assets/Manispaa.png"
                alt="Manispaa"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{profile.role}</p>
              <p className="text-sm text-gray-500">{profile.organization}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-gray-200 bg-green-50 p-5">
            <div className="flex items-center gap-3 text-green-700">
              <User className="h-5 w-5" />
              <span className="font-semibold">Contact Details</span>
            </div>
            <div className="mt-4 space-y-3 text-gray-700">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{profile.location}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3 text-gray-900">
              <Briefcase className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Account Info</span>
            </div>
            <div className="mt-4 space-y-3 text-gray-700">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span>Role</span>
                <strong>{profile.role}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span>Organization</span>
                <strong>{profile.organization}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span>Member since</span>
                <strong>{profile.joined}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-green-700">
            <Clock4 className="h-5 w-5" />
            <span className="font-semibold">Shift Focus</span>
          </div>
          <p className="mt-3 text-gray-600">
            Responsible for 24/7 system monitoring and contractor outreach.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-green-700">
            <MapPin className="h-5 w-5" />
            <span className="font-semibold">Primary Zone</span>
          </div>
          <p className="mt-3 text-gray-600">
            Central Dar es salaam operations and national alert coordination.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-green-700">
            <Briefcase className="h-5 w-5" />
            <span className="font-semibold">Priorities</span>
          </div>
          <p className="mt-3 text-gray-600">
            Manage alerts, validate sensor status, and dispatch contractors when
            needed.
          </p>
        </div>
      </div>
    </div>
  );
}
