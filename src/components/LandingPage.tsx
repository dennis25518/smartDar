import { useState } from "react";

interface LandingPageProps {
  onGetStarted: () => void;
  onAdminLogin: () => void;
}

export default function LandingPage({
  onGetStarted,
  onAdminLogin,
}: LandingPageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-6 shadow-sm bg-white sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-gray-900">
            smartDar
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-12">
          <a
            href="#about"
            className="text-gray-700 hover:text-green-600 font-medium transition"
          >
            About
          </a>
          <a
            href="#services"
            className="text-gray-700 hover:text-green-600 font-medium transition"
          >
            Services
          </a>
          <a
            href="#impact"
            className="text-gray-700 hover:text-green-600 font-medium transition"
          >
            Impact
          </a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onGetStarted}
            className="hidden sm:inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Get Started
          </button>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg
              className="w-6 h-6 text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <a
              href="#about"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 font-medium transition rounded-lg"
            >
              About
            </a>
            <a
              href="#services"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 font-medium transition rounded-lg"
            >
              Services
            </a>
            <a
              href="#impact"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 font-medium transition rounded-lg"
            >
              Impact
            </a>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onGetStarted();
              }}
              className="w-full sm:hidden bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-0 py-12 sm:py-20">
        <div className="w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-16 max-w-6xl">
          {/* Left Side - Text Content */}
          <div className="w-full lg:flex-1 space-y-4 sm:space-y-6 flex flex-col justify-center">
            {/* Badge */}
            <div className="inline-block">
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm sm:text-base font-semibold">
                💧 SDG 6 - Clean Water & Sanitation
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-2 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                Smart Waste &amp;
                <span className="block text-green-600">
                  Sanitation Management
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-lg font-medium">
                smartDar leverages IoT technology and real-time monitoring to
                revolutionize waste collection and septic tank management.
                Reduce environmental pollution, improve public health, and
                optimize sanitation infrastructure with intelligent, data-driven
                solutions.
              </p>
            </div>

            {/* CTA Button & Trusted Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3">
              <button
                onClick={onGetStarted}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="inline-flex items-center justify-center sm:justify-start gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 sm:py-2 rounded-lg font-bold text-sm sm:text-base transition transform hover:scale-105 active:scale-95 shadow-lg w-full sm:w-fit"
              >
                Get Started
                <svg
                  className={`w-4 h-4 transition-transform hidden sm:block ${
                    isHovering ? "translate-x-1" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

              {/* Trusted By Section */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex -space-x-2">
                  <img
                    src="/Assets/user1.jpg"
                    alt="User 1"
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
                  />
                  <img
                    src="/Assets/user2.jpg"
                    alt="User 2"
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
                  />
                  <img
                    src="/Assets/user3.jpg"
                    alt="User 3"
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">
                    TRUSTED BY 10K+ USERS
                  </p>
                  <p className="text-xs text-gray-600">
                    Join thousands of satisfied customers
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-gray-200">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  1000+
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Households Served
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  50K
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Tons Waste Managed
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  99%
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Satisfaction Rate
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="w-full lg:flex-1 flex justify-center h-64 sm:h-80 lg:h-screen">
            <img
              src="/Assets/smart-city-auth.jpg"
              alt="Environmental Future"
              className="w-full h-full object-cover rounded-2xl shadow-xl hover:shadow-2xl transition duration-500"
            />
          </div>
        </div>
      </section>

      {/* Endless Scrolling Strip */}
      <section className="bg-green-600 py-6 overflow-hidden">
        <style>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          .scroll-container {
            display: flex;
            animation: scroll 20s linear infinite;
            white-space: nowrap;
          }
          .scroll-container:hover {
            animation-play-state: paused;
          }
          .scroll-item {
            padding: 0 2rem;
            flex-shrink: 0;
          }
        `}</style>
        <div className="scroll-container">
          <div className="scroll-item text-white font-bold text-lg">
            • REAL-TIME MONITORING
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • IoT SENSORS
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • WHATSAPP ALERTS
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • WEB DASHBOARD
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • 24/7 MONITORING
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • SMART WASTE MANAGEMENT
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • REAL-TIME MONITORING
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • IoT SENSORS
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • WHATSAPP ALERTS
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • WEB DASHBOARD
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • 24/7 MONITORING
          </div>
          <div className="scroll-item text-white font-bold text-lg">
            • SMART WASTE MANAGEMENT
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose smartDar?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Intelligent IoT-powered sanitation management aligned with UN SDG
              6
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Real-Time Monitoring
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Ultrasonic sensors continuously track waste and liquid fill
                levels across all containers
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Instant Alerts
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                WhatsApp notifications when critical levels are reached,
                enabling prompt waste collection
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Web Dashboard
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Live visualization of sanitation infrastructure data with status
                indicators and device identification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              About smartDar
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
              smartDar is an intelligent IoT-powered platform designed to
              revolutionize waste and sanitation management in Ilala District
              Council, aligned with UN Sustainable Development Goal 6: Clean
              Water and Sanitation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  Our Mission
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  To provide Ilala District Council with cutting-edge IoT
                  technology that enables real-time monitoring of waste and
                  sanitation infrastructure, reducing environmental pollution,
                  improving public health outcomes, and achieving sustainable
                  urban development.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  The Challenge
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Rapid urbanization has created unprecedented demand for
                  efficient waste management. Traditional reactive approaches
                  lead to delayed service delivery, environmental pollution, and
                  public health risks. smartDar transforms this through
                  intelligent, data-driven solutions.
                </p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden h-64 sm:h-96 shadow-lg">
              <img
                src="/Assets/Proposed-IoT-Infrastructure.jpg"
                alt="IoT Infrastructure"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="services"
        className="bg-gradient-to-b from-green-50 to-white py-12 sm:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive IoT-driven solutions for complete sanitation
              management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Real-Time Monitoring
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                Ultrasonic sensors continuously track waste and liquid levels in
                dustbins and septic tanks, transmitting data via Wi-Fi to our
                backend servers.
              </p>
              <div className="rounded-lg overflow-hidden h-40 sm:h-48 shadow-md">
                <img
                  src="/Assets/Real-Time Monitoring.jpg"
                  alt="Real-Time Monitoring"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Smart Alerts
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                Automated WhatsApp notifications when critical fill levels are
                reached, enabling prompt waste collection and septic tank
                emptying with state-based alert logic.
              </p>
              <div className="rounded-lg overflow-hidden h-40 sm:h-48 shadow-md">
                <img
                  src="/Assets/smart alert system.png"
                  alt="Smart Alert System"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Web Dashboard
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                Live visualization of sanitation infrastructure with real-time
                fill levels, system status indicators, device identification,
                and timestamped updates for decision support.
              </p>
              <div className="rounded-lg overflow-hidden h-40 sm:h-48 shadow-md">
                <img
                  src="/Assets/Web Dashboard.png"
                  alt="Web Dashboard"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Scalable Architecture
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                Modular, extensible platform supporting future integration of
                data storage, predictive analytics, and AI-based optimization
                for waste collection scheduling.
              </p>
              <div className="rounded-lg overflow-hidden h-40 sm:h-48 shadow-md">
                <img
                  src="/Assets/Scalable Architecture.webp"
                  alt="Scalable Architecture"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section - UN SDG 6 Focus */}
      <section id="impact" className="bg-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Driving progress towards UN Sustainable Development Goal 6: Ensure
              access to water and sanitation for all
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 sm:p-10 rounded-2xl text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Cost Efficiency
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Reduces operational costs by optimizing waste collection routes
                and preventing unnecessary service dispatch through intelligent
                monitoring.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 sm:p-10 rounded-2xl text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Environmental Protection
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Minimizes environmental pollution through timely waste
                collection, preventing overflow and contamination of water
                sources and soil.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 sm:p-10 rounded-2xl text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Public Health
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Improves public health by ensuring timely sanitation services,
                reducing disease transmission and improving quality of life in
                urban communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Transform Your Sanitation Management Today
          </h2>
          <p className="text-sm sm:text-lg text-green-50 mb-6 sm:mb-8">
            Transform sanitation management in Ilala District Council with
            smartDar's intelligent IoT-powered waste management platform
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white hover:bg-gray-100 text-green-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition transform hover:scale-105"
          >
            Request a Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
          <div className="flex flex-col items-start gap-2">
            <p className="text-gray-600 text-xs sm:text-sm">
              &copy; 2026 smartDar. All rights reserved.
            </p>
            <button
              onClick={onAdminLogin}
              className="text-xs text-gray-500  hover:text-green-600 transition font-medium underline"
            >
              Admin Portal
            </button>
          </div>
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">
              In Collaboration with
            </p>
            <div className="flex gap-6 items-center">
              <a
                href="https://dcc.go.tz/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition"
              >
                <img
                  src="/Assets/ngao.png"
                  alt="Ngao"
                  className="h-10 sm:h-12 object-contain"
                />
              </a>
              <a
                href="https://www.waterinstitute.ac.tz/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition"
              >
                <img
                  src="/Assets/maji.png"
                  alt="Maji"
                  className="h-10 sm:h-12 object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
