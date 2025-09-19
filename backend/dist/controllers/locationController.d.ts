import { Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare const getWorkspaceLocations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getLocationById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const setPrimaryLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getLocationStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const bulkUpdateLocations: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=locationController.d.ts.map