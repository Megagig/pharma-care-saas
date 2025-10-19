import { Request, Response, NextFunction } from 'express';
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const validateObjectId: (paramName: string) => import("express-validator").ValidationChain;
export declare const createMedicationSchema: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response | void))[];
export declare const updateMedicationSchema: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response | void))[];
export declare const createAdherenceLogSchema: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response | void))[];
export declare const checkInteractionsSchema: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response | void))[];
export declare const getMedicationsByPatientSchema: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response | void))[];
export declare const getAdherenceByPatientSchema: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response | void))[];
export declare const medicationExistsValidator: import("express-validator").ValidationChain;
export declare const updateMedicationSettingsSchema: import("express-validator").ValidationChain[];
export declare const getMedicationSettingsSchema: import("express-validator").ValidationChain[];
//# sourceMappingURL=medicationValidators.d.ts.map