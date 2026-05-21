import { useState } from "react";
import { Phone, MapPin, Users } from "lucide-react";

const contractors = [
  {
    id: 1,
    name: "Kajenjere",
    zone: "Kariakoo, Gerezani, Mchikichini",
    phone: "+255 752 456 789",
    specialty: "Waste management & maintenance",
  },
  {
    id: 2,
    name: "Wejisa",
    zone: "Kisutu, Mchafukoge, Kivukoni",
    phone: "+255 789 123 456",
    specialty: "Emergency response & repair",
  },
  {
    id: 3,
    name: "Tirima",
    zone: "Upanga Mashariki na Upanga Magharibi",
    phone: "+255 654 987 321",
    specialty: "Sensor calibration & support",
  },
  {
    id: 4,
    name: "Sateki",
    zone: "Jangwani, Ilala",
    phone: "+255 701 234 567",
    specialty: "Field response & maintenance",
  },
];

export default function AdminContractors() {
  const [showCallAnimation, setShowCallAnimation] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<string | null>(
    null,
  );

  const handleCallContractor = (contractorName: string) => {
    setSelectedContractor(contractorName);
    setShowCallAnimation(true);
  };

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
            key={contractor.id}
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
              <button
                onClick={() => handleCallContractor(contractor.name)}
                className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
              >
                Call Contractor
              </button>
              <button className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                View Route Area
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Call Animation Popup */}
      {showCallAnimation && (
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
              Calling {selectedContractor}
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Connecting you with the contractor. Please wait...
            </p>
            <button
              onClick={() => setShowCallAnimation(false)}
              className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
