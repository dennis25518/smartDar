import { Phone, MapPin, Users } from "lucide-react";

const contractors = [
  {
    name: "Muthoni Repairs",
    zone: "East Nairobi",
    phone: "+254 700 123 456",
    specialty: "Pump service & sensor repair",
  },
  {
    name: "Kijiji Field Team",
    zone: "West Nairobi",
    phone: "+254 711 987 654",
    specialty: "Maintenance & route support",
  },
  {
    name: "Coastline Contractors",
    zone: "Mombasa",
    phone: "+254 722 555 010",
    specialty: "Emergency response",
  },
  {
    name: "Rift Valley Tech",
    zone: "Nakuru",
    phone: "+254 733 444 221",
    specialty: "Sensor calibration",
  },
];

export default function AdminContractors() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-green-600">
              Contractor Directory
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Trusted contacts for on-site support
            </h2>
          </div>
          <div className="rounded-3xl bg-green-50 px-4 py-3 text-green-700 text-sm font-medium">
            Reach out instantly when alerts require field response.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contractors.map((contractor) => (
          <div
            key={contractor.name}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Users className="h-5 w-5" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {contractor.name}
                  </h3>
                </div>
                <p className="text-gray-600">{contractor.specialty}</p>
              </div>
              <div className="rounded-full bg-green-100 px-3 py-2 text-sm font-semibold text-green-700">
                {contractor.zone}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{contractor.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{contractor.zone}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition">
                Call Contractor
              </button>
              <button className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                View Route Area
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
