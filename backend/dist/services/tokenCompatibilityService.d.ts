export interface LegacyTokenPayload {
    userId?: string;
    id?: string;
    workspaceId?: string;
    pharmacyId?: string;
    iat?: number;
    exp?: number;
}
export interface ModernTokenPayload {
    userId: string;
    workspaceId?: string;
    workplaceRole?: string;
    iat: number;
    exp: number;
}
export declare class TokenCompatibilityService {
    static verifyToken(token: string): Promise<{
        payload: LegacyTokenPayload | ModernTokenPayload;
        isLegacy: boolean;
        needsRefresh: boolean;
    }>;
    static generateModernToken(userId: string): Promise<string>;
    static refreshTokenWithWorkspaceContext(oldToken: string): Promise<{
        newToken: string;
        user: any;
        workspace: any;
    }>;
    static migrateLegacyToken(legacyToken: string): Promise<{
        modernToken: string;
        migrationInfo: {
            wasLegacy: boolean;
            addedWorkspaceContext: boolean;
            userId: string;
            workspaceId?: string;
        };
    }>;
    static validateTokenAndGetContext(token: string): Promise<{
        user: any;
        workspace: any;
        subscription: any;
        isLegacyToken: boolean;
        needsMigration: boolean;
    }>;
    static shouldRefreshToken(payload: LegacyTokenPayload | ModernTokenPayload): boolean;
    static extractUserId(payload: LegacyTokenPayload | ModernTokenPayload): string | null;
    static extractWorkspaceId(payload: LegacyTokenPayload | ModernTokenPayload): string | null;
}
export default TokenCompatibilityService;
//# sourceMappingURL=tokenCompatibilityService.d.ts.map