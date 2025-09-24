import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare class UserRoleController {
    private dynamicPermissionService;
    private roleHierarchyService;
    constructor();
    assignUserRoles(req: AuthRequest, res: Response): Promise<any>;
    revokeUserRole(req: AuthRequest, res: Response): Promise<any>;
    updateUserPermissions(req: AuthRequest, res: Response): Promise<any>;
    getUserEffectivePermissions(req: AuthRequest, res: Response): Promise<any>;
    bulkUpdateUsers(req: AuthRequest, res: Response): Promise<any>;
}
export declare const userRoleController: UserRoleController;
//# sourceMappingURL=userRoleController.d.ts.map