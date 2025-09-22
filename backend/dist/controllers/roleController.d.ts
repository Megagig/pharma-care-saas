import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare class RoleController {
    private roleHierarchyService;
    private dynamicPermissionService;
    constructor();
    createRole(req: AuthRequest, res: Response): Promise<any>;
    getRoles(req: AuthRequest, res: Response): Promise<any>;
    getRoleById(req: AuthRequest, res: Response): Promise<any>;
    updateRole(req: AuthRequest, res: Response): Promise<any>;
    deleteRole(req: AuthRequest, res: Response): Promise<any>;
    getRolePermissions(req: AuthRequest, res: Response): Promise<any>;
    private invalidateRoleCaches;
}
export declare const roleController: RoleController;
//# sourceMappingURL=roleController.d.ts.map