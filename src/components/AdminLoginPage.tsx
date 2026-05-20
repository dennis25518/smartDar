import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AdminLoginPageProps {
  onBackToLanding: () => void;
  onLoginSuccess: () => void;
}

export default function AdminLoginPage({
  onBackToLanding,
  onLoginSuccess,
}: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call server-side RPC to verify admin credentials securely
      const { data, error } = await supabase.rpc("auth_admin", {
        p_email: email,
        p_password: password,
      });

      if (error) {
        setError(error.message || "Login failed");
      } else if (
        data &&
        (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)
      ) {
        onLoginSuccess();
      } else {
        setError("Invalid admin credentials");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4">
            <span className="text-2xl font-bold text-white">👨‍💼</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 mt-2">SmartDar Municipal Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartdar.tz"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <p className="text-blue-300 text-xs leading-relaxed">
                <span className="font-semibold">⚠️ Admin Access Only:</span>{" "}
                This portal is restricted to authorized municipal
                administrators. Unauthorized access attempts are logged.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In as Admin"}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={onBackToLanding}
              className="text-gray-400 hover:text-gray-300 text-sm transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            🔒 Secure connection • All access logged • Two-factor authentication
            recommended
          </p>
        </div>
      </div>
    </div>
  );
}
