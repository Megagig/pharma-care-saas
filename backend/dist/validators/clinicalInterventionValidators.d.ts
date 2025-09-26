import { ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
interface BusinessRuleValidation {
    field: string;
    rule: (value: any, req: Request) => Promise<boolean> | boolean;
    message: string;
    code?: string;
}
export declare const sanitizeInput: {
    text: (input: string) => string;
    html: (input: string) => string;
    mongoId: (input: string) => string;
    number: (input: any) => number | null;
    boolean: (input: any) => boolean;
};
export declare const validateRequest: (validations: ValidationChain[], businessRules?: BusinessRuleValidation[], options?: {
    sanitize?: boolean;
    logErrors?: boolean;
    includeStack?: boolean;
}) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const interventionBusinessRules: BusinessRuleValidation[];
export declare const strategyBusinessRules: BusinessRuleValidation[];
export declare const assignmentBusinessRules: BusinessRuleValidation[];
export declare const outcomeBusinessRules: BusinessRuleValidation[];
export declare const createInterventionSchema: ValidationChain[];
export declare const validateCreateIntervention: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateInterventionSchema: ValidationChain[];
export declare const interventionParamsSchema: ValidationChain[];
export declare const addStrategySchema: ValidationChain[];
export declare const updateStrategySchema: ValidationChain[];
export declare const assignTeamMemberSchema: ValidationChain[];
export declare const updateAssignmentSchema: ValidationChain[];
export declare const recordOutcomeSchema: ValidationChain[];
export declare const scheduleFollowUpSchema: ValidationChain[];
export declare const searchInterventionsSchema: ValidationChain[];
export declare const patientParamsSchema: ValidationChain[];
export declare const analyticsQuerySchema: ValidationChain[];
export declare const exportQuerySchema: ValidationChain[];
export declare const linkMTRSchema: ValidationChain[];
export declare const notificationSchema: ValidationChain[];
export {};
//# sourceMappingURL=clinicalInterventionValidators.d.ts.map