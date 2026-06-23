import { useState } from "react";

interface ContractorLoginPageProps {
  onBackToLanding: () => void;
  onLoginSuccess: () => void;
}

export default function ContractorLoginPage({
  onBackToLanding,
  onLoginSuccess,
}: ContractorLoginPageProps) {
  const [selectedContractor, setSelectedContractor] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const contractorsList = [
    { name: "Kajenjere", zone: "Kariakoo, Gerezani, Mchikichini", specialty: "Waste management & maintenance" },
    { name: "Wejisa", zone: "Kisutu, Mchafukoge, Kivukoni", specialty: "Emergency response & repair" },
    { name: "Tirima", zone: "Upanga Mashariki na Upanga Magharibi", specialty: "Sensor calibration & support" },
    { name: "Sateki", zone: "Jangwani, Ilala", specialty: "Field response & maintenance" }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedContractor) {
      setError("Please select a contractor profile.");
      return;
    }

    if (!passcode) {
      setError("Please enter your passcode.");
      return;
    }

    setLoading(true);

    // Mock validation: any 4-digit passcode works for demo/simulation purposes
    setTimeout(() => {
      if (passcode.length >= 4) {
        localStorage.setItem("contractorLoggedIn", selectedContractor);
        onLoginSuccess();
      } else {
        setError("Invalid passcode. Passcode must be at least 4 digits.");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-50 to-emerald-50 items-center justify-center">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: 'url("/Assets/smart-city-auth.jpg")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        </div>

        {/* Right Side - Contractor Selection Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 py-8 relative">
          {/* Close Button */}
          <button
            onClick={onBackToLanding}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-full space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Contractor Portal</h1>
              <p className="text-gray-600 text-sm sm:text-base">Select your contractor profile to start shift.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-55 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Contractor Select Dropdown */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                  Select Contractor Profile
                </label>
                <div className="relative">
                  <select
                    value={selectedContractor}
                    onChange={(e) => setSelectedContractor(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition appearance-none"
                    required
                  >
                    <option value="">-- Choose Profile --</option>
                    {contractorsList.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.zone.split(",")[0]})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Passcode Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                  4-Digit Security Passcode
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter passcode (e.g. 1234)"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 active:scale-95 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Sign In to Portal"}
              </button>
            </form>

            {/* Back Link */}
            <div className="text-center">
              <button
                onClick={onBackToLanding}
                className="text-gray-600 hover:text-gray-900 text-sm transition font-medium underline"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
