import { Response } from 'express';
export declare const checkDrugInteractions: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const checkDrugPairInteraction: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const checkTherapeuticDuplications: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const checkContraindications: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const generateClinicalReview: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getSeverityLevels: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const drugInteractionValidation: import("express-validator").ValidationChain[];
export declare const drugPairValidation: import("express-validator").ValidationChain[];
export declare const clinicalReviewValidation: import("express-validator").ValidationChain[];
//# sourceMappingURL=drugInteractionController.d.ts.map