import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare class PermissionController {
    private roleHierarchyService;
    private dynamicPermissionService;
    constructor();
    getPermissions(req: AuthRequest, res: Response): Promise<any>;
    getPermissionMatrix(req: AuthRequest, res: Response): Promise<any>;
    createPermission(req: AuthRequest, res: Response): Promise<any>;
    updatePermission(req: AuthRequest, res: Response): Promise<any>;
    getPermissionCategories(req: AuthRequest, res: Response): Promise<any>;
    getPermissionDependencies(req: AuthRequest, res: Response): Promise<any>;
    getPermissionUsage(req: AuthRequest, res: Response): Promise<any>;
    validatePermissions(req: AuthRequest, res: Response): Promise<any>;
    private invalidatePermissionCaches;
}
export declare const permissionController: PermissionController;
//# sourceMappingURL=permissionController.d.ts.map