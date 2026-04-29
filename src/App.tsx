import { useState } from "react";
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
  | "dashboard";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");

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
      {currentPage === "dashboard" && (
        <DashboardPage onLogout={() => setCurrentPage("landing")} />
      )}
    </>
  );
}
