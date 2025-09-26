export declare class SystemRolePermissionSeeder {
    private systemUserId;
    constructor();
    seed(): Promise<void>;
    private seedPermissions;
    private seedSystemRoles;
    private seedWorkplaceRoles;
    private seedRolePermissions;
    private validateSeededData;
    private generateDisplayName;
    private generateDescription;
    private categorizePermission;
    private assessRiskLevel;
    private extractDependencies;
    private extractConflicts;
    private getPermissionsForSystemRole;
    private getPermissionsForWorkplaceRole;
    private calculateRolePriority;
}
export declare function seedSystemRolesAndPermissions(): Promise<void>;
//# sourceMappingURL=001-seed-system-roles-permissions.d.ts.map