# AI Diagnostics & Therapeutics Technical Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Requirements](#system-requirements)
3. [Installation and Setup](#installation-and-setup)
4. [Configuration](#configuration)
5. [Database Schema](#database-schema)
6. [API Integration](#api-integration)
7. [Security Implementation](#security-implementation)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Deployment Guide](#deployment-guide)
11. [Development Guidelines](#development-guidelines)
12. [Testing Framework](#testing-framework)

## Architecture Overview

### System Architecture

The AI Diagnostics & Therapeutics module follows a modular MERN stack architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)            │
├─────────────────────────────────────────────────────────────┤
│  Components  │  Pages  │  Hooks  │  Store  │  API Client   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)              │
├─────────────────────────────────────────────────────────────┤
│  Routes  │  Controllers  │  Services  │  Models  │  Utils   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
├─────────────────────────────────────────────────────────────┤
│  OpenRouter  │  RxNorm  │  OpenFDA  │  FHIR  │  MongoDB    │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
backend/src/modules/diagnostics/
├── controllers/           # Request handlers
├── routes/               # API route definitions
├── services/             # Business logic
├── models/               # Database models
├── utils/                # Utility functions
└── index.ts              # Module exports

frontend/src/modules/diagnostics/
├── components/           # React components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── store/               # State management
├── api/                 # API client functions
└── types/               # TypeScript definitions
```

## System Requirements

### Minimum Requirements

**Server Environment:**

- Node.js 18.x or higher
- MongoDB 6.0 or higher
- Redis 6.2 or higher (for caching)
- 4GB RAM minimum
- 2 CPU cores minimum
- 50GB storage minimum

**Client Environment:**

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- JavaScript enabled
- Stable internet connection (minimum 1 Mbps)

### Recommended Requirements

**Production Server:**

- Node.js 20.x LTS
- MongoDB 7.0 with replica set
- Redis 7.0 with clustering
- 16GB RAM
- 8 CPU cores
- 500GB SSD storage
- Load balancer (nginx/HAProxy)

**Development Environment:**

- Docker Desktop
- VS Code with TypeScript extensions
- Postman for API testing
- MongoDB Compass for database management

## Installation and Setup

### Backend Setup

1. **Install Dependencies**

```bash
cd backend
npm install
```

2. **Environment Configuration**

```bash
cp .env.example .env.diagnostics
# Edit .env.diagnostics with your configuration
```

3. **Database Setup**

```bash
# Start MongoDB
mongod --dbpath /data/db

# Run database migrations
npm run migrate:diagnostics
```

4. **Start Development Server**

```bash
npm run dev:diagnostics
```

### Frontend Setup

1. **Install Dependencies**

```bash
cd frontend
npm install
```

2. **Environment Configuration**

```bash
# Create .env file
VITE_API_BASE_URL=http://localhost:5000/api
VITE_OPENROUTER_ENABLED=true
VITE_FHIR_ENABLED=true
```

3. **Start Development Server**

```bash
npm run dev
```

### Docker Setup

1. **Build Images**

```bash
docker-compose -f docker-compose.diagnostics.yml build
```

2. **Start Services**

```bash
docker-compose -f docker-compose.diagnostics.yml up -d
```

## Configuration

### Environment Variables

#### Backend Configuration (.env.diagnostics)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/PharmacyCopilot
REDIS_URL=redis://localhost:6379

# AI Services
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEEPSEEK_MODEL_ID=deepseek/deepseek-v3.1

# External APIs
RXNORM_API_BASE=https://rxnav.nlm.nih.gov/REST
OPENFDA_API_BASE=https://api.fda.gov
OPENFDA_API_KEY=your_openfda_api_key

# FHIR Configuration
FHIR_SERVER_URL=https://your-fhir-server.com/fhir
FHIR_CLIENT_ID=your_fhir_client_id
FHIR_CLIENT_SECRET=your_fhir_client_secret

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Performance
AI_TIMEOUT_MS=30000
API_RATE_LIMIT=100
CACHE_TTL_SECONDS=3600

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/diagnostics.log
```

#### Frontend Configuration (.env)

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000

# Feature Flags
VITE_AI_DIAGNOSTICS_ENABLED=true
VITE_FHIR_INTEGRATION_ENABLED=true
VITE_DRUG_INTERACTION_ENABLED=true

# UI Configuration
VITE_DEFAULT_TIMEOUT=30000
VITE_POLLING_INTERVAL=2000
VITE_MAX_FILE_SIZE=10485760

# Analytics
VITE_ANALYTICS_ENABLED=false
VITE_SENTRY_DSN=your_sentry_dsn
```

### Service Configuration

#### OpenRouter Configuration

```typescript
// backend/src/config/openrouter.ts
export const openRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
  model: process.env.DEEPSEEK_MODEL_ID || 'deepseek/deepseek-v3.1',
  maxTokens: 4096,
  temperature: 0.1,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};
```

#### Database Configuration

```typescript
// backend/src/config/database.ts
export const databaseConfig = {
  uri: process.env.MONGODB_URI,
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
```

## Database Schema

### Collections Overview

```javascript
// DiagnosticRequests Collection
{
  _id: ObjectId,
  patientId: ObjectId,
  pharmacistId: ObjectId,
  workplaceId: ObjectId,
  inputSnapshot: {
    symptoms: Object,
    vitals: Object,
    medications: Array,
    allergies: Array,
    labResults: Array
  },
  consentObtained: Boolean,
  status: String,
  createdAt: Date,
  updatedAt: Date
}

// DiagnosticResults Collection
{
  _id: ObjectId,
  requestId: ObjectId,
  diagnoses: Array,
  suggestedTests: Array,
  medicationSuggestions: Array,
  redFlags: Array,
  referralRecommendation: Object,
  aiMetadata: Object,
  pharmacistReview: Object,
  createdAt: Date
}

// LabOrders Collection
{
  _id: ObjectId,
  patientId: ObjectId,
  orderedBy: ObjectId,
  workplaceId: ObjectId,
  tests: Array,
  status: String,
  orderDate: Date,
  externalOrderId: String,
  createdAt: Date,
  updatedAt: Date
}

// LabResults Collection
{
  _id: ObjectId,
  orderId: ObjectId,
  patientId: ObjectId,
  workplaceId: ObjectId,
  testCode: String,
  testName: String,
  value: String,
  referenceRange: Object,
  interpretation: String,
  source: String,
  performedAt: Date,
  createdAt: Date
}
```

### Indexes

```javascript
// DiagnosticRequests indexes
db.diagnosticRequests.createIndex({
  workplaceId: 1,
  patientId: 1,
  createdAt: -1,
});
db.diagnosticRequests.createIndex({
  workplaceId: 1,
  pharmacistId: 1,
  status: 1,
});
db.diagnosticRequests.createIndex({ workplaceId: 1, status: 1, createdAt: -1 });

// DiagnosticResults indexes
db.diagnosticResults.createIndex({ requestId: 1 }, { unique: true });
db.diagnosticResults.createIndex({ workplaceId: 1, createdAt: -1 });

// LabOrders indexes
db.labOrders.createIndex({ workplaceId: 1, patientId: 1, orderDate: -1 });
db.labOrders.createIndex({ workplaceId: 1, status: 1, orderDate: -1 });

// LabResults indexes
db.labResults.createIndex({ workplaceId: 1, patientId: 1, performedAt: -1 });
db.labResults.createIndex({ workplaceId: 1, testCode: 1, performedAt: -1 });
```

## API Integration

### OpenRouter Integration

```typescript
// backend/src/services/aiOrchestrationService.ts
class AIOrchestrationService {
  private async callOpenRouterAPI(prompt: string): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://PharmacyCopilot.com',
        'X-Title': 'PharmacyCopilot AI Diagnostics',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### External API Services

```typescript
// backend/src/services/clinicalApiService.ts
class ClinicalAPIService {
  // RxNorm Integration
  async lookupDrugInfo(drugName: string): Promise<DrugInfo> {
    const url = `${this.rxnormBaseUrl}/drugs.json?name=${encodeURIComponent(
      drugName
    )}`;
    const response = await fetch(url);
    return response.json();
  }

  // OpenFDA Integration
  async checkDrugInteractions(
    medications: string[]
  ): Promise<InteractionResult[]> {
    const interactions = [];
    for (const med of medications) {
      const url = `${this.openFdaBaseUrl}/drug/event.json?search=patient.drug.medicinalproduct:"${med}"`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.openFdaApiKey}` },
      });
      interactions.push(await response.json());
    }
    return this.processInteractions(interactions);
  }
}
```

## Security Implementation

### Authentication & Authorization

```typescript
// backend/src/middleware/auth.ts
export const requireDiagnosticPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check user permissions
      const user = await User.findById(decoded.userId);
      if (!user.hasPermission(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Check subscription requirements
      if (!user.workplace.hasFeature('ai_diagnostics')) {
        return res.status(403).json({ error: 'Subscription required' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication required' });
    }
  };
};
```

### Data Encryption

```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('diagnostics', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('diagnostics', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Input Validation

```typescript
// backend/src/utils/validators.ts
import Joi from 'joi';

export const diagnosticRequestSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  symptoms: Joi.object({
    subjective: Joi.array().items(Joi.string().max(500)).min(1).required(),
    objective: Joi.array().items(Joi.string().max(500)),
    duration: Joi.string().max(100).required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
    onset: Joi.string().valid('acute', 'chronic', 'subacute').required(),
  }).required(),
  vitals: Joi.object({
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/),
    heartRate: Joi.number().min(30).max(250),
    temperature: Joi.number().min(90).max(110),
    respiratoryRate: Joi.number().min(8).max(40),
  }),
  consent: Joi.boolean().valid(true).required(),
});
```

## Performance Optimization

### Caching Strategy

```typescript
// backend/src/services/cacheService.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // Cache drug interaction data
  async cacheDrugInteractions(
    medications: string[],
    interactions: any
  ): Promise<void> {
    const key = `interactions:${medications.sort().join(':')}`;
    await this.redis.setex(key, 3600, JSON.stringify(interactions)); // 1 hour TTL
  }

  // Cache AI responses for similar cases
  async cacheAIResponse(inputHash: string, response: any): Promise<void> {
    const key = `ai:${inputHash}`;
    await this.redis.setex(key, 1800, JSON.stringify(response)); // 30 minutes TTL
  }

  // Cache lab reference ranges
  async cacheLabReferenceRanges(testCode: string, ranges: any): Promise<void> {
    const key = `lab:ranges:${testCode}`;
    await this.redis.setex(key, 86400, JSON.stringify(ranges)); // 24 hours TTL
  }
}
```

### Database Optimization

```typescript
// backend/src/models/diagnosticRequest.ts
import mongoose from 'mongoose';

const diagnosticRequestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    workplaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workplace',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Optimize for read performance
    read: 'secondaryPreferred',
    // Enable automatic indexing
    autoIndex: true,
  }
);

// Compound indexes for common queries
diagnosticRequestSchema.index({ workplaceId: 1, patientId: 1, createdAt: -1 });
diagnosticRequestSchema.index({ workplaceId: 1, status: 1, createdAt: -1 });
```

### API Rate Limiting

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const diagnosticRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per user
  message: 'Too many diagnostic requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `diagnostic:${req.user.id}:${req.ip}`,
});

export const labRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000,
  max: 50, // 50 lab operations per minute
  keyGenerator: (req) => `lab:${req.user.id}:${req.ip}`,
});
```

### Background Job Processing

```typescript
// backend/src/services/jobQueue.ts
import Bull from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const diagnosticQueue = new Bull('diagnostic processing', {
  redis: {
    port: 6379,
    host: 'localhost',
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Process diagnostic requests in background
diagnosticQueue.process('ai-analysis', 5, async (job) => {
  const { requestId, inputData } = job.data;

  try {
    const aiService = new AIOrchestrationService();
    const result = await aiService.processPatientCase(inputData);

    // Update request status
    await DiagnosticRequest.findByIdAndUpdate(requestId, {
      status: 'completed',
      processedAt: new Date(),
    });

    // Save results
    await DiagnosticResult.create({
      requestId,
      ...result,
    });

    return { success: true, resultId: result._id };
  } catch (error) {
    // Update request status to failed
    await DiagnosticRequest.findByIdAndUpdate(requestId, {
      status: 'failed',
      error: error.message,
    });

    throw error;
  }
});
```

## Monitoring and Logging

### Application Monitoring

```typescript
// backend/src/utils/monitoring.ts
import { createPrometheusMetrics } from 'prometheus-api-metrics';
import client from 'prom-client';

// Custom metrics
export const diagnosticMetrics = {
  requestsTotal: new client.Counter({
    name: 'diagnostic_requests_total',
    help: 'Total number of diagnostic requests',
    labelNames: ['status', 'workplace'],
  }),

  processingDuration: new client.Histogram({
    name: 'diagnostic_processing_duration_seconds',
    help: 'Time spent processing diagnostic requests',
    buckets: [1, 5, 10, 20, 30, 60],
  }),

  aiAccuracy: new client.Gauge({
    name: 'diagnostic_ai_accuracy_rate',
    help: 'AI diagnostic accuracy rate',
    labelNames: ['model', 'condition_type'],
  }),

  externalApiErrors: new client.Counter({
    name: 'external_api_errors_total',
    help: 'Total external API errors',
    labelNames: ['service', 'error_type'],
  }),
};

// Middleware to track metrics
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    if (req.path.includes('/diagnostics')) {
      diagnosticMetrics.requestsTotal.inc({
        status: res.statusCode.toString(),
        workplace: req.user?.workplaceId || 'unknown',
      });

      diagnosticMetrics.processingDuration.observe(duration);
    }
  });

  next();
};
```

### Structured Logging

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-diagnostics' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Diagnostic-specific logging
export const diagnosticLogger = logger.child({ module: 'diagnostics' });

// Usage example
diagnosticLogger.info('Diagnostic request created', {
  requestId: request._id,
  patientId: request.patientId,
  pharmacistId: request.pharmacistId,
  symptoms: request.inputSnapshot.symptoms.subjective.length,
});
```

### Health Checks

```typescript
// backend/src/routes/health.ts
import express from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';

const router = express.Router();
const redis = new Redis(process.env.REDIS_URL);

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      openrouter: 'unknown',
    },
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      health.services.database = 'healthy';
    } else {
      health.services.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Check Redis
    const pong = await redis.ping();
    health.services.redis = pong === 'PONG' ? 'healthy' : 'unhealthy';

    // Check OpenRouter API
    try {
      const response = await fetch(
        `${process.env.OPENROUTER_BASE_URL}/models`,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        }
      );
      health.services.openrouter = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      health.services.openrouter = 'unhealthy';
    }

    // Overall status
    const unhealthyServices = Object.values(health.services).filter(
      (s) => s === 'unhealthy'
    );
    if (unhealthyServices.length > 0) {
      health.status =
        unhealthyServices.length === Object.keys(health.services).length
          ? 'unhealthy'
          : 'degraded';
    }

    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
        ? 200
        : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
```

## Deployment Guide

### Production Environment Setup

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  diagnostics-api:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-cluster:27017/PharmacyCopilot
      - REDIS_URL=redis://redis-cluster:6379
    depends_on:
      - mongodb
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:5000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  diagnostics-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - VITE_API_BASE_URL=https://api.PharmacyCopilot.com
    ports:
      - '80:80'
      - '443:443'

  mongodb:
    image: mongo:7.0
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    deploy:
      replicas: 3

  redis:
    image: redis:7.0-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    deploy:
      replicas: 3

volumes:
  mongodb_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/diagnostics-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: diagnostics-api
  labels:
    app: diagnostics-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: diagnostics-api
  template:
    metadata:
      labels:
        app: diagnostics-api
    spec:
      containers:
        - name: diagnostics-api
          image: PharmacyCopilot/diagnostics-api:latest
          ports:
            - containerPort: 5000
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: diagnostics-secrets
                  key: mongodb-uri
            - name: OPENROUTER_API_KEY
              valueFrom:
                secretKeyRef:
                  name: diagnostics-secrets
                  key: openrouter-api-key
          resources:
            requests:
              memory: '1Gi'
              cpu: '500m'
            limits:
              memory: '2Gi'
              cpu: '1000m'
          livenessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### CI/CD Pipeline

```yaml
# .github/workflows/diagnostics-deploy.yml
name: Deploy AI Diagnostics Module

on:
  push:
    branches: [main]
    paths:
      - 'backend/src/modules/diagnostics/**'
      - 'frontend/src/modules/diagnostics/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run tests
        run: |
          cd backend && npm run test:diagnostics
          cd ../frontend && npm run test:diagnostics

      - name: Run security audit
        run: |
          cd backend && npm audit --audit-level high
          cd ../frontend && npm audit --audit-level high

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker build -t PharmacyCopilot/diagnostics-api:${{ github.sha }} ./backend
          docker build -t PharmacyCopilot/diagnostics-frontend:${{ github.sha }} ./frontend

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push PharmacyCopilot/diagnostics-api:${{ github.sha }}
          docker push PharmacyCopilot/diagnostics-frontend:${{ github.sha }}

      - name: Deploy to production
        run: |
          kubectl set image deployment/diagnostics-api diagnostics-api=PharmacyCopilot/diagnostics-api:${{ github.sha }}
          kubectl set image deployment/diagnostics-frontend diagnostics-frontend=PharmacyCopilot/diagnostics-frontend:${{ github.sha }}
```

## Development Guidelines

### Code Standards

```typescript
// ESLint configuration for diagnostics module
// .eslintrc.diagnostics.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // Enforce strict typing for medical data
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',

    // Require error handling
    '@typescript-eslint/no-floating-promises': 'error',

    // Enforce consistent naming
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
    ],
  },
};
```

### Testing Standards

```typescript
// Example test structure
// backend/src/modules/diagnostics/__tests__/diagnosticService.test.ts
import { DiagnosticService } from '../services/diagnosticService';
import { mockPatientData, mockAIResponse } from './fixtures';

describe('DiagnosticService', () => {
  let service: DiagnosticService;

  beforeEach(() => {
    service = new DiagnosticService();
  });

  describe('processPatientCase', () => {
    it('should process valid patient data successfully', async () => {
      // Arrange
      const mockRequest = mockPatientData.validRequest;

      // Act
      const result = await service.processPatientCase(mockRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.diagnoses).toHaveLength(3);
      expect(result.diagnoses[0].probability).toBeGreaterThan(0.5);
    });

    it('should handle AI service timeout gracefully', async () => {
      // Arrange
      jest.spyOn(service, 'callAI').mockRejectedValue(new Error('Timeout'));

      // Act & Assert
      await expect(
        service.processPatientCase(mockPatientData.validRequest)
      ).rejects.toThrow('AI service timeout');
    });
  });
});
```

### Documentation Standards

````typescript
/**
 * Processes a patient case through AI analysis
 *
 * @param request - The diagnostic request containing patient data
 * @param options - Processing options including timeout and model selection
 * @returns Promise resolving to diagnostic results with confidence scores
 *
 * @throws {ValidationError} When patient data is invalid
 * @throws {AIServiceError} When AI service is unavailable
 * @throws {TimeoutError} When processing exceeds timeout limit
 *
 * @example
 * ```typescript
 * const request = {
 *   patientId: '507f1f77bcf86cd799439011',
 *   symptoms: { subjective: ['chest pain'], duration: '2 days' },
 *   consent: true
 * };
 *
 * const result = await diagnosticService.processPatientCase(request);
 * console.log(result.diagnoses[0].condition); // 'Acute Coronary Syndrome'
 * ```
 */
async processPatientCase(
  request: IDiagnosticRequest,
  options: ProcessingOptions = {}
): Promise<IDiagnosticResult> {
  // Implementation
}
````

This technical guide provides comprehensive information for developers working with the AI Diagnostics & Therapeutics module. It covers architecture, setup, configuration, security, performance optimization, monitoring, deployment, and development standards.

For additional technical support or questions about implementation details, contact the development team at dev@PharmacyCopilot.com or refer to the API documentation for specific endpoint details.
