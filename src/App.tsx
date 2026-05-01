import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import DashboardPage from "./components/DashboardPage";

type PageType =
  | "landing"
  | "login"
  | "register"
  | "forgot-password"
  | "dashboard"
  | "loading";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("loading");

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // User is logged in
        setCurrentPage("dashboard");
      } else {
        // User is not logged in
        setCurrentPage("landing");
      }
    };

    checkAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentPage("dashboard");
      } else if (event === "SIGNED_OUT") {
        setCurrentPage("landing");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage("landing");
  };

  if (currentPage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentPage === "landing" && (
        <LandingPage onGetStarted={() => setCurrentPage("login")} />
      )}
      {currentPage === "login" && (
        <LoginPage
          onNavigateToRegister={() => setCurrentPage("register")}
          onNavigateToForgotPassword={() => setCurrentPage("forgot-password")}
          onBackToLanding={() => setCurrentPage("landing")}
          onLoginSuccess={() => setCurrentPage("dashboard")}
        />
      )}
      {currentPage === "register" && (
        <RegisterPage
          onBackToLogin={() => setCurrentPage("login")}
          onBackToLanding={() => setCurrentPage("landing")}
        />
      )}
      {currentPage === "forgot-password" && (
        <ForgotPasswordPage onBackToLogin={() => setCurrentPage("login")} />
      )}
      {currentPage === "dashboard" && <DashboardPage onLogout={handleLogout} />}
    </>
  );
}
