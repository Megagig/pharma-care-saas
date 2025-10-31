import * as winston from 'winston';
declare const logger: winston.Logger;
export declare const patientEngagementLogger: {
    appointment: (operation: string, data: Record<string, any>) => void;
    followUp: (operation: string, data: Record<string, any>) => void;
    reminder: (operation: string, data: Record<string, any>) => void;
    schedule: (operation: string, data: Record<string, any>) => void;
    integration: (operation: string, data: Record<string, any>) => void;
    performance: (operation: string, duration: number, data?: Record<string, any>) => void;
    error: (operation: string, error: Error, data?: Record<string, any>) => void;
    business: (event: string, data: Record<string, any>) => void;
    security: (event: string, data: Record<string, any>) => void;
};
export declare const addCorrelationId: (req: any, res: any, next: any) => void;
export declare const createChildLogger: (correlationId: string, context?: Record<string, any>) => winston.Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map