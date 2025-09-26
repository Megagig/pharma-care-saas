# PharmaCare SaaS - Pharmaceutical Care Management Platform

## Overview
PharmaCare SaaS is a comprehensive pharmaceutical care management platform designed specifically for pharmacists. It provides tools for patient management, clinical documentation, medication tracking, and practice analytics.

## 🚀 Recent Updates - MUI to shadcn/ui Migration

**We've successfully migrated from Material-UI to shadcn/ui + Tailwind CSS!**

### What Changed
- **UI Framework**: Migrated from Material-UI to shadcn/ui with Radix UI primitives
- **Styling**: Now using Tailwind CSS for all styling
- **Icons**: Switched from MUI Icons to Lucide React
- **Performance**: Significantly improved theme switching performance (sub-16ms)
- **Bundle Size**: Reduced bundle size by removing MUI dependencies
- **Accessibility**: Enhanced accessibility with Radix UI primitives

### New Component System
- **shadcn/ui Components**: Modern, accessible, and customizable
- **Tailwind CSS**: Utility-first CSS framework for rapid development
- **Lucide Icons**: Beautiful, consistent icon library
- **Radix UI**: Unstyled, accessible components as foundation

## Features

### 🩺 Patient Management
- Comprehensive patient profiles with medical history
- Medication lists and interaction checking
- Contact information and insurance details
- Chronic condition tracking

### 📝 Clinical Documentation
- SOAP note format for clinical documentation
- Medication therapy management notes
- Follow-up tracking and reminders
- Searchable note history

### 💊 Medication Management
- Complete medication profiles
- Drug interaction alerts
- Adherence monitoring and reporting
- Prescription tracking with refill management

### 📊 Analytics & Reporting
- Patient demographics and analytics
- Medication adherence reporting
- Clinical outcomes tracking
- Practice performance metrics

### 💳 Subscription Management
- Flexible pricing tiers
- Usage tracking and limits
- Automated billing and renewals
- Plan upgrade/downgrade options

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for file storage
- **Nodemailer** for email notifications
- **Twilio** for SMS notifications

### Frontend
- **React 18** with hooks and TypeScript
- **React Router** for navigation
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **Radix UI** for accessible primitives
- **Lucide React** for icons
- **TanStack Query** for data fetching
- **TanStack Table** for data grids
- **Zustand** for state management
- **Vite** for build tooling

### Infrastructure
- **Docker** for containerization
- **MongoDB Atlas** for database hosting
- **Vercel/Netlify** for frontend deployment
- **Heroku/Railway** for backend deployment

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pharma-care-saas
JWT_SECRET=your-super-secret-jwt-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## New UI Component System

### shadcn/ui Components
We now use shadcn/ui components built on Radix UI primitives:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ExampleForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <Button className="w-full">Sign In</Button>
      </CardContent>
    </Card>
  );
}
```

### Available Components
- **Button**: Primary, secondary, outline, ghost variants
- **Card**: Container with header, content, footer sections
- **Input**: Text inputs with validation states
- **Label**: Accessible form labels
- **Badge**: Status indicators and tags
- **Dialog**: Modal dialogs and overlays
- **Select**: Dropdown selection components
- **Table**: Data tables with sorting and filtering
- **Tooltip**: Contextual help and information
- **Toast**: Notification system
- **Tabs**: Tabbed interfaces
- **Alert**: Status messages and notifications

### Theme System
The new theme system provides:
- **Fast Theme Toggle**: Sub-16ms theme switching
- **System Preference**: Automatic light/dark mode detection
- **CSS Variables**: Consistent theming across components
- **Tailwind Integration**: Seamless integration with utility classes

```tsx
import { useThemeToggle } from '@/hooks/useThemeToggle';

function ThemeToggle() {
  const { theme, toggle } = useThemeToggle();
  
  return (
    <Button onClick={toggle} variant="ghost" size="sm">
      {theme === 'dark' ? '🌙' : '☀️'}
    </Button>
  );
}
```

### Icons
We use Lucide React for consistent, beautiful icons:

```tsx
import { User, Settings, LogOut } from 'lucide-react';

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Project Structure

```
pharma-care-saas/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Database and service configurations
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Custom middleware
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── styles/         # Global styles and themes
└── docs/                   # Project documentation
```

## Development Scripts

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Performance validation
npm run perf:validate

# Accessibility audit
npm run test:a11y:full

# Visual regression testing
npm run test:migration:visual
```

### Backend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Database migrations
npm run migrate
```

## Migration Guide

If you're updating from the previous MUI version, see our [Migration Guide](docs/MUI_TO_SHADCN_MIGRATION_GUIDE.md) for detailed instructions.

### Key Changes
1. **Component Imports**: Update from `@mui/material` to `@/components/ui/*`
2. **Styling**: Replace `sx` props with Tailwind classes
3. **Icons**: Update from `@mui/icons-material` to `lucide-react`
4. **Theme**: Use new theme system with CSS variables

## API Documentation
Comprehensive API documentation is available in [docs/API.md](docs/API.md).

## Deployment

### Docker Deployment
1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

### Manual Deployment
1. Set up MongoDB database
2. Deploy backend to your preferred hosting service
3. Build frontend and deploy to static hosting
4. Configure environment variables

## Performance & Accessibility

### Performance Features
- **Fast Theme Switching**: Sub-16ms theme toggle performance
- **Optimized Bundle**: Reduced bundle size after MUI removal
- **Tree Shaking**: Efficient code splitting and loading
- **Lazy Loading**: Components loaded on demand

### Accessibility
- **WCAG 2.1 AA Compliant**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA attributes
- **Focus Management**: Logical focus flow
- **Color Contrast**: Meets contrast requirements

## Testing

### Test Coverage
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API and workflow testing
- **E2E Tests**: Full user journey testing
- **Visual Regression**: UI consistency testing
- **Accessibility Tests**: Automated a11y validation
- **Performance Tests**: Bundle size and speed monitoring

### Running Tests
```bash
# All tests
npm run test

# E2E tests
npm run test:e2e

# Visual regression
npm run test:migration:visual

# Accessibility audit
npm run test:a11y:full

# Performance validation
npm run perf:validate
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Follow the component patterns established in the migration
4. Ensure tests pass and accessibility standards are met
5. Commit your changes
6. Push to the branch
7. Create a Pull Request

## Security & Compliance
- HIPAA compliant data handling
- End-to-end encryption for sensitive data
- Regular security audits and updates
- Role-based access control
- Secure authentication with JWT

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support and questions, please contact:
- Email: support@pharmacare.com
- Documentation: [docs/API.md](docs/API.md)
- Issues: GitHub Issues page

## Roadmap
See [docs/ROADMAP.md](docs/ROADMAP.md) for planned features and improvements.

---

**Built with ❤️ using React, shadcn/ui, and Tailwind CSS**