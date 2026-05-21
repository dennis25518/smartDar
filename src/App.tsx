import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import DashboardPage from "./components/DashboardPage";
import AdminLoginPage from "./components/AdminLoginPage";
import AdminDashboardPage from "./components/AdminDashboardPage";

type PageType =
  | "landing"
  | "login"
  | "register"
  | "forgot-password"
  | "dashboard"
  | "admin-login"
  | "admin"
  | "loading";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("loading");

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Check if admin is logged in (stored in localStorage)
      const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
      if (adminLoggedIn) {
        setCurrentPage("admin");
        return;
      }

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
        localStorage.removeItem("adminLoggedIn");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    // Clear admin login flag
    localStorage.removeItem("adminLoggedIn");
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
        <LandingPage
          onGetStarted={() => setCurrentPage("login")}
          onAdminLogin={() => setCurrentPage("admin-login")}
        />
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
      {currentPage === "admin-login" && (
        <AdminLoginPage
          onBackToLanding={() => setCurrentPage("landing")}
          onLoginSuccess={() => setCurrentPage("admin")}
        />
      )}
      {currentPage === "admin" && (
        <AdminDashboardPage onLogout={handleLogout} />
      )}
    </>
  );
}
