import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare class RoleHierarchyController {
    private roleHierarchyService;
    private dynamicPermissionService;
    constructor();
    addChildRoles(req: AuthRequest, res: Response): Promise<any>;
    removeChildRole(req: AuthRequest, res: Response): Promise<any>;
    getRoleHierarchy(req: AuthRequest, res: Response): Promise<any>;
    changeParentRole(req: AuthRequest, res: Response): Promise<any>;
    getFullRoleHierarchyTree(req: AuthRequest, res: Response): Promise<any>;
    validateRoleHierarchy(req: AuthRequest, res: Response): Promise<any>;
}
export declare const roleHierarchyController: RoleHierarchyController;
//# sourceMappingURL=roleHierarchyController.d.ts.map