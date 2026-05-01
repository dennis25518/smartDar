-# smartDar 💧

**Intelligent IoT-Powered Sanitation Management Platform**

Transform waste and sanitation management in Ilala District Council with real-time monitoring, instant alerts, and data-driven insights aligned with UN Sustainable Development Goal 6: Clean Water & Sanitation.

![smartDar](https://img.shields.io/badge/UN%20SDG-Goal%206-brightgreen) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.5-06B6D4)

## 🌍 About smartDar

smartDar is an innovative IoT-based platform designed to revolutionize waste collection and septic tank management in Ilala District Council. By leveraging ultrasonic sensors, Wi-Fi connectivity, and cloud-based monitoring, smartDar enables efficient, real-time tracking of sanitation infrastructure.

### 🎯 Mission

To provide Ilala District Council with cutting-edge IoT technology that enables real-time monitoring of waste and sanitation infrastructure, reducing environmental pollution, improving public health outcomes, and achieving sustainable urban development.

### 📊 Key Metrics

- **1000+** Households Served
- **50K** Tons Waste Managed
- **99%** Satisfaction Rate

## ✨ Features

### 🏠 Landing Page

- Professional hero section with call-to-action
- Comprehensive features showcase
- About section detailing mission and challenges
- Services overview with real use-cases
- Impact section aligned with UN SDG 6
- Trust indicators and partner logos
- Mobile-responsive design with hamburger navigation
- Visible hero images on all screen sizes

### 🔐 Authentication System

- **Login Page**: Secure email/password authentication
- **Register Page**: New user account creation with validation
- **Forgot Password**: Password recovery flow with email verification
- Green-themed UI with professional design
- Form validation and error handling
- Responsive layout for mobile and desktop

### 📊 User Dashboard

- **5-Tab Interface**:
  - **Overview**: Real-time waste level statistics and alerts
  - **Notifications**: Color-coded alerts and system updates
  - **Device Status**: Live sensor monitoring with fill levels
  - **Profile**: User account information and verification status
  - **Support**: Help center with contact information and ticket submission

- **Desktop Sidebar**:
  - Collapsible navigation with expandable/compact modes
  - Tab icons with unread notification badges
  - Smooth animations and transitions

- **Mobile Navigation**:
  - Hamburger menu with slide-in drawer
  - Semi-transparent overlay for mobile drawer
  - Auto-closing drawer on tab selection
  - Touch-friendly navigation

- **Real-Time Features**:
  - Live waste fill levels for multiple sensors
  - Status indicators (Optimal, Warning, Critical)
  - Dispatch request system
  - Timestamped updates

### 📱 Mobile Responsiveness

- Mobile-first design approach
- Hamburger menu navigation (< 1024px)
- Responsive typography and spacing
- Touch-optimized interface
- Full functionality on all devices
- Visible content on small screens

### 🎨 Design System

- **Color Scheme**: Green gradient theme (green-500/600/700, emerald-600/700, teal-600)
- **Typography**: Professional and readable across all devices
- **Spacing**: Consistent padding and margins following Tailwind conventions
- **Icons**: Clean SVG icons for navigation and status indicators
- **Animations**: Smooth transitions and hover effects

## 🛠 Tech Stack

### Frontend

- **React 18.2.0**: Component-based UI framework
- **TypeScript 5.3.3**: Type-safe development
- **Tailwind CSS 3.3.5**: Utility-first CSS styling
- **Vite 5.0.8**: Lightning-fast build tool and dev server

### Development Tools

- **PostCSS 8.4.31**: CSS processing with autoprefixer
- **npm**: Package manager

### Architecture

- Component-based structure
- React Hooks for state management
- Manual page routing with callback-based navigation
- Mock data for demonstration

## 📁 Project Structure

```
smartDar/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx        # Public landing page with hero, features, services
│   │   ├── LoginPage.tsx           # User authentication
│   │   ├── RegisterPage.tsx        # New user registration
│   │   ├── ForgotPasswordPage.tsx  # Password recovery
│   │   └── DashboardPage.tsx       # Main dashboard with 5-tab interface
│   ├── App.tsx                     # Root routing component
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Tailwind CSS imports & global styles
├── public/
│   └── Assets/
│       ├── favicon.png             # App favicon
│       ├── hero.jpg                # Landing page hero image
│       ├── smart-city-auth.jpg     # Authentication pages image
│       ├── user*.jpg               # User profile images
│       ├── Real-Time Monitoring.jpg
│       ├── smart alert system.png
│       ├── Web Dashboard.png
│       ├── Scalable Architecture.webp
│       ├── Proposed-IoT-Infrastructure.jpg
│       ├── sanitation-worker.jpg
│       └── Partner logos (maji.png, ngao.png)
├── index.html                      # HTML template with smartDar favicon
├── vite.config.ts                  # Vite configuration (localhost:3001)
├── tailwind.config.js              # Tailwind CSS configuration with green theme
├── postcss.config.js               # PostCSS configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Project dependencies
└── README.md                        # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dennis25518/smartDar.git
   cd smartDar
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

### Build for Production

```bash
npm run build
```

Production-ready files will be generated in the `dist` folder.

## 📋 Pages Overview

### 1. Landing Page

- **Route**: `/` (default)
- **Features**: Hero section, features showcase, services, impact metrics, CTA
- **Responsive**: Hamburger menu on mobile, full nav on desktop
- **Call-to-Action**: "Get Started" button redirects to login

### 2. Login Page

- **Route**: Triggered from landing page or after logout
- **Fields**: Email, Password
- **Features**: Password show/hide toggle, forgot password link, sign-up link
- **Validation**: Email format, password requirements

### 3. Register Page

- **Route**: "Create Account" link from login
- **Fields**: First Name, Last Name, Email, Password, Confirm Password, Terms checkbox
- **Features**: Form validation, error messages, password show/hide
- **Submission**: Account creation with validation

### 4. Forgot Password Page

- **Route**: "Forgot password?" link from login
- **Flow**: Two-state interface (request email → success confirmation)
- **Features**: Email input, send reset link button, resend option

### 5. Dashboard Page

- **Route**: After successful login
- **Tabs**:
  - **Overview**: 3 stat cards (Active Devices: 2, Avg Fill Level: 80%, Critical Alerts: 1), Real-Time Waste Levels section
  - **Notifications**: Color-coded cards with timestamps, "New" badges, unread counter
  - **Device Status**: Sensor cards with fill percentages, status indicators, gradient backgrounds
  - **Profile**: Centered user info, verification status, account details, edit options
  - **Support**: Help center with contact form, support hours, direct contact info

## 🎨 Color Theme

### Primary Green Gradient

```css
from-green-600 via-emerald-600 to-teal-600
```

### Status Colors

- **Optimal**: Green (`bg-green-100`, `text-green-600`)
- **Warning**: Yellow (`bg-yellow-100`, `text-yellow-600`)
- **Critical**: Red (`bg-red-100`, `text-red-600`)

### UI Elements

- Background: `bg-gray-50`
- Cards: `bg-white` with `shadow-md`
- Text: `text-gray-900` (dark) to `text-gray-600` (light)

## 📱 Responsive Breakpoints

Using Tailwind CSS breakpoints:

- **Mobile (< 640px)**: `sm` prefix not applied
- **Small (640px - 767px)**: `sm:` prefix
- **Medium (768px - 1023px)**: `md:` prefix
- **Large (1024px+)**: `lg:` prefix
- **Extra Large (1280px+)**: `xl:` prefix

## 🔄 Navigation Flow

```
Landing Page
    ↓
[Get Started/Request Demo]
    ↓
Login Page → Register Page
    ↓         (Create Account)
[Sign In]
    ↓
Dashboard
├── Overview Tab
├── Notifications Tab
├── Device Status Tab
├── Profile Tab
└── Support Tab
    ↓
[Logout] → Back to Landing Page
```

## 🎯 State Management

Currently using React Hooks (`useState`) for:

- Current page state
- Active dashboard tab
- Sidebar toggle state
- Mobile menu state
- Form submission states
- Support form data

## 📝 Mock Data

The dashboard includes sample data:

- **2 Active Sensors**: Bin Station A (75%, Warning) & Septic Tank - Hospital (85%, Critical)
- **4 Notifications**: Mixed types (info, warning, success) with read/unread status
- **Current User**: Ahmed Hassan (Sanitation Manager, Ilala District Council)

## 🔐 Security Considerations

- Form validation on all inputs
- Password visibility toggle for security
- Mock authentication (ready for backend integration)
- CSRF protection ready
- Error handling for failed operations

## 🚀 Future Enhancements

- [ ] Backend API integration
- [ ] Real-time WebSocket updates for sensor data
- [ ] User authentication with JWT tokens
- [ ] Database integration for persistent data
- [ ] Predictive analytics for waste collection
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Export reports functionality
- [ ] Map view for sensor locations
- [ ] Push notifications
- [ ] Mobile app version (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Author

**Isdory Walter Denis**

- GitHub: [@dennis25518](https://github.com/dennis25518)
- Email: musicsmart255@gmail.com

## 🌍 Partnership

In collaboration with:

- **Ngao**: Dar es Salaam City Council
- **Maji**: Tanzania Water Institute

## 📞 Support

For support, email: support@ilaladcc.tz

## 🙏 Acknowledgments

- UN Sustainable Development Goal 6 - Clean Water & Sanitation
- Ilala District Council for partnership
- Community stakeholders for valuable feedback
- All contributors and supporters

---

**Made with ❤️ for a cleaner, healthier Ilala District Council**

💧 smartDar - Transform Your Sanitation Management Today

- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
