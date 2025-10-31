# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

PharmaCare (PharmacyCopilot) is a full-stack MERN SaaS platform for pharmaceutical care management. It provides clinical decision support, medication therapy reviews, AI diagnostics, patient engagement, and comprehensive pharmacy management features.

**Tech Stack:**
- **Frontend**: React 18 + TypeScript + Vite + MUI + TanStack Query
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Real-time**: Socket.IO for live updates
- **Infrastructure**: Docker Compose, Redis, PostgreSQL references, Nginx, Prometheus, Grafana
- **Testing**: Jest (backend), Vitest + Playwright (frontend)

## Directory Structure

```
├── backend/                 # Express/Node.js API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas (User, Patient, Medication, etc.)
│   │   ├── services/       # Business logic layer
│   │   ├── routes/         # API route definitions
│   │   ├── middlewares/    # Auth, RBAC, validation
│   │   ├── modules/        # Feature modules (diagnostics, drug-info, lab)
│   │   ├── jobs/           # Background jobs and workers
│   │   ├── utils/          # Helper functions
│   │   ├── validators/     # Input validation schemas
│   │   ├── config/         # Configuration files
│   │   ├── scripts/        # Utility and migration scripts
│   │   ├── app.ts          # Express app configuration
│   │   └── server.ts       # Server initialization
│   └── package.json
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── services/       # API client services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── stores/         # Zustand state management
│   │   ├── context/        # React context providers
│   │   ├── queries/        # TanStack Query hooks
│   │   ├── utils/          # Helper utilities
│   │   ├── theme/          # MUI theme configuration
│   │   ├── modules/        # Feature modules
│   │   └── App.tsx         # Main app component
│   └── package.json
├── docker-compose.yml      # Multi-service Docker setup
├── nginx/                  # Nginx reverse proxy config
├── monitoring/             # Prometheus & Grafana configs
├── scripts/                # Shell scripts for deployment
└── Implementation/         # Documentation and AGENTS.md (Byterover MCP rules)
```

## Common Development Commands

### Backend (from `/backend` directory)

**Development:**
```bash
npm run dev                              # Start dev server with hot reload (ts-node)
npm run build                            # Compile TypeScript to dist/
npm start                                # Run production build
```

**Testing:**
```bash
npm test                                 # Run all Jest tests
npm run test:watch                       # Watch mode
npm run test:coverage                    # Generate coverage report
npm run test:e2e                         # End-to-end tests
npm run test:rbac                        # Run RBAC test suite
npm run test:smoke                       # Quick smoke tests
```

**Database & Migrations:**
```bash
npm run seed                             # Seed subscription plans
npm run seed:plans                       # Seed plans from config
npm run seed:pricing                     # Seed pricing data
npm run seed:help                        # Seed help system data
npm run clean-db                         # Clean database
npm run migrate:workspace-subscriptions  # Run workspace subscription migrations
npm run migrate:theme-preference         # Run theme preference migration
npm run migration:status                 # Check migration status
npm run migration:up                     # Run migrations
npm run migration:down                   # Rollback migrations
```

**Feature Management:**
```bash
npm run feature-flags:status             # Check feature flag status
npm run feature-flags:set                # Set feature flags
npm run feature-flags:validate           # Validate feature flags
npm run setup:feature-flags              # Initialize feature flag system
```

**Performance & Optimization:**
```bash
npm run db:health-check                  # Check database health
npm run db:optimize-indexes              # Optimize database indexes
npm run db:performance:check             # Check DB performance
npm run performance:check                # Run performance checks
npm run cache:init                       # Initialize Redis cache
```

**Load Testing:**
```bash
npm run load-test                        # Run all load tests (Artillery)
npm run load-test:appointments           # Test appointments endpoint
npm run load-test:followups              # Test follow-ups endpoint
npm run load-test:websockets             # Test WebSocket connections
npm run load-test:database               # Test database performance
npm run load-test:report                 # Generate load test report
```

**Deployment:**
```bash
npm run validate-deployment              # Validate deployment readiness
npm run deploy                           # Deploy (production)
npm run deploy:staging                   # Deploy to staging
npm run deploy:production                # Deploy to production
```

**Utilities:**
```bash
npm run activate-subscription            # Activate a subscription
npm run change-password                  # Change user password
npm run list-users                       # List all users
```

### Frontend (from `/frontend` directory)

**Development:**
```bash
npm run dev                              # Start Vite dev server (port 5173)
npm run build                            # Build for production
npm run build:production                 # Production build with optimizations
npm run preview                          # Preview production build
npm run lint                             # Run ESLint
```

**Testing:**
```bash
npm run test                             # Run Vitest tests
npm run test:run                         # Run tests once
npm run test:ui                          # Open Vitest UI
npm run test:e2e                         # Run Playwright E2E tests
npm run test:e2e:ui                      # Playwright UI mode
npm run test:e2e:headed                  # Run E2E with browser visible
npm run test:e2e:debug                   # Debug E2E tests
npm run test:e2e:report                  # Show Playwright report
npm run test:e2e:communication           # Test communication hub
npm run test:e2e:feature-management      # Test feature management
```

**Performance & Analysis:**
```bash
npm run analyze                          # Analyze bundle size
npm run bundle:size                      # Check bundle size
npm run lighthouse                       # Run Lighthouse audit
npm run test:performance                 # Run performance tests
npm run test:theme:performance           # Test theme performance
```

**Load & Visual Testing:**
```bash
npm run test:load                        # Run load tests
npm run test:visual                      # Run visual regression tests
npm run test:visual:update               # Update visual snapshots
```

### Docker Commands (from project root)

```bash
docker-compose up                        # Start all services
docker-compose up -d                     # Start in detached mode
docker-compose down                      # Stop all services
docker-compose logs -f app               # Follow app logs
docker-compose restart app               # Restart app service
docker-compose exec app sh               # Shell into app container
docker-compose ps                        # List running containers
```

### Full Stack Development

**Start everything locally:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Terminal 3 - Docker services (if needed)
docker-compose up redis db
```

## Architecture Patterns

### Backend Architecture

**Layered Structure:**
- **Routes** → Define HTTP endpoints and middleware chain
- **Controllers** → Handle requests, validate input, call services
- **Services** → Business logic, orchestrate models and external services
- **Models** → MongoDB schemas with Mongoose
- **Middlewares** → Auth, RBAC, rate limiting, validation

**Key Services:**
- `AppointmentService` - Appointment scheduling and management
- `FollowUpService` - Patient follow-up task management
- `ClinicalInterventionService` - Clinical intervention tracking
- `CommunicationService` - Internal messaging and notifications
- `QueueService` - Background job processing with Bull/BullMQ
- `AlertService` - Real-time alerts and notifications
- `BillingService` - Subscription and payment management

**Real-time Communication:**
- Socket.IO services handle live updates
- `CommunicationSocketService` - Chat and messaging
- `SocketNotificationService` - Push notifications
- `AppointmentSocketService` - Appointment updates
- `ChatSocketService` - Chat features with Redis presence tracking

**Background Jobs:**
- Bull/BullMQ for job queues
- Cron services for scheduled tasks (invitations, stats, usage alerts, email delivery)
- Workers initialized in `jobs/workers`

### Frontend Architecture

**State Management:**
- **TanStack Query** - Server state, caching, optimistic updates
- **Zustand** - Client state (theme, UI preferences)
- **React Context** - Auth, subscription, feature flags

**Component Structure:**
- **Lazy loading** for route-based code splitting
- **Skeleton screens** for loading states
- **Error boundaries** for graceful error handling
- **Protected routes** with RBAC enforcement

**API Integration:**
- Services in `services/` directory (e.g., `billingService.ts`, `appointmentService.ts`)
- Custom hooks in `hooks/` wrap TanStack Query
- Axios for HTTP client with interceptors

**Performance Optimizations:**
- Module preloading (`utils/modulePreloader.ts`)
- Compression utilities (`utils/compressionUtils.ts`)
- Service worker for offline support
- Route prefetching and cache warming
- Virtual scrolling for long lists (react-window)

### Feature Flag System

**How it works:**
1. Feature flags stored in MongoDB (`FeatureFlag` model)
2. Flags define which subscription tiers and user roles can access features
3. Subscriptions have a `features` array auto-populated based on their tier
4. Admin panel allows managing features without code changes
5. Auto-sync: When flags change, all active subscriptions update immediately

**Check access:**
- Backend: `requireFeature('feature_key')` middleware
- Frontend: `useFeatureFlag('feature_key')` hook

**Available tiers:** `free_trial`, `basic`, `pro`, `pharmily`, `network`, `enterprise`

**Available roles:** `pharmacist`, `pharmacy_team`, `pharmacy_outlet`, `intern_pharmacist`, `super_admin`, `owner`

## Testing Strategy

### Backend Testing
- **Unit tests** with Jest for services and utilities
- **Integration tests** for API endpoints with supertest
- **E2E tests** for critical user flows
- **RBAC tests** comprehensive permission testing
- **Load tests** with Artillery for performance validation

### Frontend Testing
- **Unit tests** with Vitest for components and hooks
- **E2E tests** with Playwright for user flows
- **Performance tests** for theme switching and rendering
- **Visual regression** tests for UI consistency
- **Accessibility** testing built into E2E tests

**Run a single backend test:**
```bash
cd backend
npm test -- --testPathPattern=specificTest
```

**Run a single frontend test:**
```bash
cd frontend
npm run test -- specificTest.test.tsx
```

## Key Configuration Files

- `.env.example` - Template for environment variables (comprehensive)
- `docker-compose.yml` - Multi-service orchestration with health checks
- `backend/tsconfig.json` - TypeScript configuration
- `frontend/vite.config.ts` - Vite build configuration
- `frontend/playwright.config.ts` - E2E test configuration

## Development Workflow

### Adding a New Feature

1. **Backend:**
   - Create model in `models/`
   - Add service in `services/`
   - Create controller in `controllers/`
   - Define routes in `routes/`
   - Add middleware if needed
   - Write tests

2. **Frontend:**
   - Create API service in `services/`
   - Add TanStack Query hooks in `queries/` or `hooks/`
   - Build UI components in `components/`
   - Create page in `pages/`
   - Add route in `App.tsx`
   - Write tests

3. **Feature Flag (if needed):**
   - Add via admin panel at `/admin/feature-management`
   - Or seed via backend script

### Database Migrations

- Migration scripts in `backend/src/scripts/` and `backend/src/migrations/`
- Run with npm scripts (see commands above)
- Always test migrations on staging before production
- Migrations support up/down/status/validate operations

### Deployment Process

1. Run `npm run validate-deployment` in backend
2. Run tests: `npm test` in both backend and frontend
3. Build frontend: `npm run build:production`
4. Use deployment scripts in `scripts/` directory
5. Monitor with Prometheus/Grafana dashboards

## Important Notes

- **Authentication:** JWT-based with refresh tokens, stored in HTTP-only cookies
- **Authorization:** RBAC system with middleware enforcement
- **WebSockets:** Socket.IO for real-time features, check CORS origins in `server.ts`
- **Memory Management:** Backend uses memory optimization (garbage collection triggers)
- **Rate Limiting:** Applied to auth and API endpoints
- **Redis:** Used for caching, presence tracking, and queue management
- **Monitoring:** Prometheus metrics exposed, Grafana dashboards available

## Byterover MCP Integration

This project uses Byterover MCP tools for knowledge management. See `Implementation/AGENTS.md` for:
- Onboarding workflow
- Planning workflow  
- Knowledge retrieval/storage patterns
- Module management

**Important:** Always use `byterover-retrieve-knowledge` before tasks and `byterover-store-knowledge` after implementations.

## Troubleshooting

**Backend won't start:**
- Check MongoDB connection string in `.env`
- Verify Redis is running
- Check port 5000 is available

**Frontend build fails:**
- Clear Vite cache: `rm -rf frontend/.vite`
- Reinstall dependencies: `npm ci`

**Tests failing:**
- Ensure test database is clean
- Check environment variables for tests
- Verify mock data setup

**Socket.IO connection issues:**
- Verify CORS origins in `backend/src/server.ts`
- Check firewall rules
- Ensure WebSocket transport is allowed

## Additional Resources

- Feature management documentation: `FEATURE_MANAGEMENT_GUIDE.md`
- Implementation summaries in root directory and `Implementation/` folder
- Database scripts in `backend/src/scripts/`
- Load test configurations in `backend/tests/load/`
