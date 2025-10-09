import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare const getAllFeatureFlags: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFeatureFlagById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createFeatureFlag: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFeatureFlag: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFeatureFlag: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleFeatureFlagStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFeatureFlagsByCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFeatureFlagsByTier: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTierFeatures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getAllFeatureFlags: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getFeatureFlagById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    createFeatureFlag: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateFeatureFlag: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteFeatureFlag: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    toggleFeatureFlagStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getFeatureFlagsByCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getFeatureFlagsByTier: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateTierFeatures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
//# sourceMappingURL=featureFlagController.d.ts.map