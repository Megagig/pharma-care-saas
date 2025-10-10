# PharmacyCopilot SaaS - Pharmaceutical Care Management Platform

## Overview
PharmacyCopilot SaaS is a comprehensive pharmaceutical care management platform designed specifically for pharmacists. It provides tools for patient management, clinical documentation, medication tracking, and practice analytics.

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

### 🎛️ Feature Flags Management (Super Admin)
- Complete CRUD operations for feature flags
- Tier-based feature access control
- Role-based feature permissions
- Visual feature matrix for tier management
- Bulk operations for efficient management

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for file storage
- **Nodemailer** for email notifications
- **Twilio** for SMS notifications

### Frontend
- **React 18** with hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

### Infrastructure
- **Docker** for containerization
- **MongoDB Atlas** for database hosting
- **Vercel/Netlify** for frontend deployment
- **Heroku/Railway** for backend deployment

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
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

The application will be available at `http://localhost:3000`.

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
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   └── services/       # API service functions
└── docs/                   # Project documentation
```

## API Documentation

Comprehensive API documentation is available:

- **[Main API Documentation](API.md)** - Overview of all API endpoints
- **[Feature Flags API](FEATURE_FLAGS_API.md)** - Complete Feature Flags management API
- **[Clinical Notes API](CLINICAL_NOTES_API.md)** - Clinical documentation API
- **[Dynamic RBAC API](DYNAMIC_RBAC_API.md)** - Role-based access control API
- **[SaaS Settings API](SAAS_SETTINGS_API.md)** - System administration API

### Postman Collections

Import these collections to test the APIs:
- [Feature Flags API Collection](Feature_Flags_API.postman_collection.json)
- [AI Diagnostics API Collection](AI_Diagnostics_API.postman_collection.json)
- [Manual Lab API Collection](Manual_Lab_API.postman_collection.json)

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

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Security & Compliance
- HIPAA compliant data handling
- End-to-end encryption for sensitive data
- Regular security audits and updates
- Role-based access control

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support and questions, please contact:
- Email: support@PharmacyCopilot.com
- Documentation: [docs/API.md](docs/API.md)
- Issues: GitHub Issues page

## Roadmap
See [docs/ROADMAP.md](docs/ROADMAP.md) for planned features and improvements.