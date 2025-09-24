import mongoose from 'mongoose';
interface UserMigrationResult {
    userId: mongoose.Types.ObjectId;
    email: string;
    staticRole: string;
    staticWorkplaceRole?: string;
    assignedRoles: string[];
    directPermissions: string[];
    success: boolean;
    errors: string[];
}
export declare class UserRoleMigrator {
    private systemUserId;
    private migrationResults;
    constructor();
    migrate(): Promise<UserMigrationResult[]>;
    private migrateUser;
    private migrateSystemRole;
    private migrateWorkplaceRole;
    private migrateDirectPermissions;
    private getRolePermissions;
    private updateUserDocument;
    private validateMigration;
    private generateMigrationReport;
    rollbackUser(userId: mongoose.Types.ObjectId): Promise<void>;
    rollbackAll(): Promise<void>;
}
export declare function migrateUserRoles(): Promise<UserMigrationResult[]>;
export declare function rollbackUserRoleMigration(): Promise<void>;
export {};
//# sourceMappingURL=002-migrate-user-roles.d.ts.map