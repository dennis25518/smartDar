# Simba Express Login - React + TypeScript + Tailwind CSS

A professional, responsive login page built with React, TypeScript, and Tailwind CSS.

## Features

- ✨ **Modern Design**: Professional, clean UI with a white background
- 📱 **Fully Responsive**: Works seamlessly on mobile, tablet, and desktop
- 🎨 **Tailwind CSS**: Utility-first CSS styling for quick and maintainable design
- 💪 **TypeScript**: Type-safe React development
- ⚡ **Vite**: Lightning-fast development and build process
- 🔒 **Secure Form**: Email and password authentication form
- 👁️ **Password Toggle**: Show/hide password functionality
- 🎯 **Professional UX**: Smooth transitions, hover effects, and icons

## Installation

1. Navigate to the project directory:

   ```bash
   cd "c:\Users\USER\Music\SmartDar\User"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Start the development server:

```bash
npm run dev
```

The application will open automatically at `http://localhost:3000`

## Build

Build for production:

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## Project Structure

```
.
├── src/
│   ├── components/
│   │   └── LoginPage.tsx          # Main login page component
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Tailwind imports & global styles
├── index.html                      # HTML template
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project dependencies
```

## Features Included

- **Email Input**: With envelope icon and validation
- **Password Input**: With lock icon and show/hide toggle
- **Forgot Password Link**: Styled in brand orange color
- **Sign In Button**: Large, prominent CTA button with hover effects
- **Sign Up Link**: For account creation
- **Professional Layout**: Split design with image on left (hidden on mobile) and form on right
- **Responsive Design**: Adapts beautifully to all screen sizes

## Customization

### Colors

Edit `tailwind.config.js` to customize the brand colors:

- Primary color: `#FF3D00` (Orange)
- Dark color: `#1F1F1F`

### Images

Replace the background image URL in `LoginPage.tsx`:

```tsx
backgroundImage: 'url("YOUR_IMAGE_URL_HERE")';
```

### Typography

All text is responsive and scales appropriately on different screen sizes using Tailwind's responsive prefixes.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
