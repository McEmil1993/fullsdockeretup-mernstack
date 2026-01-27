# React Dashboard App

A modern, component-based React dashboard application with Tailwind CSS styling.

## Features

- 🔐 **Authentication** - Login system with localStorage
- 🎨 **Customizable Settings** - Change font family, font size, colors, and dark mode
- 📊 **Dashboard** - Widgets and charts for data visualization
- 📋 **Tables** - Interactive tables with edit, delete, and status change buttons
- 🖼️ **Image Gallery** - Image management with modal preview
- 📈 **Charts** - Multiple chart types (Line, Bar, Area, Pie, Radar)
- 🎭 **Modals** - Beautiful modals with fade animations
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 💾 **LocalStorage** - All settings and auth data persisted locally

## Tech Stack

- React 18
- React Router DOM
- Tailwind CSS
- Recharts (for charts)
- Lucide React (for icons)
- Vite (build tool)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Default Login Credentials

- Email: `admin@example.com`
- Password: `admin123`

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Button.jsx
│   ├── Footer.jsx
│   ├── Modal.jsx
│   ├── SideNav.jsx
│   ├── Table.jsx
│   ├── TopNav.jsx
│   └── Widget.jsx
├── contexts/        # React contexts
│   ├── AuthContext.jsx
│   └── SettingsContext.jsx
├── pages/           # Page components
│   ├── Charts.jsx
│   ├── Dashboard.jsx
│   ├── Images.jsx
│   ├── Login.jsx
│   ├── Settings.jsx
│   └── Tables.jsx
├── App.jsx          # Main app component
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## Settings Features

- **Dark Mode**: Toggle between light and dark themes
- **Font Family**: Choose from 8 different fonts
- **Font Size**: Adjustable from 12px to 24px
- **SideNav Color**: Customize sidebar background color
- **TopNav Color**: Customize top navigation background color

All settings are saved to localStorage and persist across sessions.
