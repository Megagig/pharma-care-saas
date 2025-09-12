// AI-Powered Diagnostics & Therapeutics Module Index
export { default as diagnosticController } from './controllers/diagnosticController';
export { default as labController } from './controllers/labController';
export { default as diagnosticRoutes } from './routes/diagnosticRoutes';
export { default as labRoutes } from './routes/labRoutes';
export { default as diagnosticService } from './services/diagnosticService';
export { default as labService } from './services/labService';
export { default as aiOrchestrationService } from './services/aiOrchestrationService';
export { default as clinicalApiService } from './services/clinicalApiService';
export { DiagnosticRequest, DiagnosticResult, LabOrder, LabResult } from './models';