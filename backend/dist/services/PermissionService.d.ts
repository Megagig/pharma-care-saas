import { IUser } from '../models/User';
import { PermissionResult, WorkspaceContext } from '../types/auth';
declare class PermissionService {
    private static instance;
    private cachedMatrix;
    private lastLoadTime;
    private readonly CACHE_DURATION;
    private constructor();
    static getInstance(): PermissionService;
    checkPermission(context: WorkspaceContext, user: IUser, action: string): Promise<PermissionResult>;
    resolveUserPermissions(user: IUser, context: WorkspaceContext): Promise<string[]>;
    private loadPermissionMatrix;
    private checkUserStatus;
    private checkSubscriptionRequirements;
    private checkPlanFeatures;
    private checkPlanTiers;
    private checkSystemRoles;
    private checkWorkplaceRoles;
    refreshCache(): Promise<void>;
}
export default PermissionService;
//# sourceMappingURL=PermissionService.d.ts.map