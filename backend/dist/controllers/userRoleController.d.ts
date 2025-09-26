import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare class UserRoleController {
    private dynamicPermissionService;
    private roleHierarchyService;
    constructor();
    getUserRoles(req: AuthRequest, res: Response): Promise<any>;
    assignUserRoles(req: AuthRequest, res: Response): Promise<any>;
    revokeUserRole(req: AuthRequest, res: Response): Promise<any>;
    updateUserPermissions(req: AuthRequest, res: Response): Promise<any>;
    getUserEffectivePermissions(req: AuthRequest, res: Response): Promise<any>;
    bulkUpdateUsers(req: AuthRequest, res: Response): Promise<any>;
    checkUserPermission(req: AuthRequest, res: Response): Promise<any>;
    previewPermissionChanges(req: AuthRequest, res: Response): Promise<any>;
    detectRoleConflicts(req: AuthRequest, res: Response): Promise<any>;
    resolveRoleConflicts(req: AuthRequest, res: Response): Promise<any>;
    refreshUserPermissionCache(req: AuthRequest, res: Response): Promise<any>;
}
export declare const userRoleController: UserRoleController;
//# sourceMappingURL=userRoleController.d.ts.map