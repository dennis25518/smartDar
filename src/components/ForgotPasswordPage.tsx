import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordPage({
  onBackToLogin,
}: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Successfully sent reset email
      setIsSubmitted(true);
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail("");
    setIsSubmitted(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="flex w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left Side - Image */}
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

        {/* Right Side - Reset Password Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 py-8">
          <div className="w-full space-y-8">
            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    Reset Password
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2"
                    >
                      EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      We'll send a password reset link to this email address.
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Send Reset Link Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 active:scale-95 text-base sm:text-lg"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                {/* Back to Login Link */}
                <div className="text-center">
                  <button
                    onClick={onBackToLogin}
                    className="text-green-600 hover:text-green-700 font-bold transition text-sm sm:text-base"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center space-y-6">
                  {/* Success Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                      Check Your Email
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                      We've sent a password reset link to{" "}
                      <span className="font-semibold text-gray-900">
                        {email}
                      </span>
                    </p>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Next steps:</span>
                    </p>
                    <ul className="text-sm text-gray-700 mt-2 space-y-2 ml-4 list-decimal">
                      <li>Click the link in the email we sent you</li>
                      <li>Create a new password</li>
                      <li>Return here to sign in with your new password</li>
                    </ul>
                  </div>

                  {/* Resend Button */}
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Didn't receive the email?{" "}
                      <button
                        onClick={handleReset}
                        className="text-orange-600 hover:text-orange-700 font-bold transition"
                      >
                        Try again
                      </button>
                    </p>
                  </div>

                  {/* Back to Login Button */}
                  <button
                    onClick={onBackToLogin}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 active:scale-95 text-base sm:text-lg"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}

            {/* Footer Text */}
            <div className="text-center">
              <p className="text-gray-500 text-xs">
                © 2024 smartDar. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
