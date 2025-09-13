export interface TokenPayload {
    orderId: string;
    workplaceId: string;
    type: 'lab_order_access';
    iat?: number;
    exp?: number;
}
export interface TokenValidationResult {
    valid: boolean;
    payload?: TokenPayload;
    error?: string;
}
export interface SecureTokenData {
    token: string;
    hashedToken: string;
    expiresAt: Date;
}
export declare class TokenService {
    private static readonly TOKEN_EXPIRY_DAYS;
    private static readonly TOKEN_SECRET;
    private static readonly HASH_ALGORITHM;
    static generateSecureToken(orderId: string, workplaceId: string, expiryDays?: number): SecureTokenData;
    static generateRandomToken(length?: number): string;
    static validateToken(token: string): TokenValidationResult;
    static hashToken(token: string): string;
    static verifyTokenHash(token: string, hash: string): boolean;
    static generateQRCodeData(token: string, baseUrl?: string): string;
    static generateBarcodeData(orderId: string, token: string): string;
    static parseBarcodeData(barcodeData: string): {
        orderId: string;
        tokenHash: string;
    } | null;
    static isTokenExpired(expiresAt: Date): boolean;
    static generateTokenWithExpiry(orderId: string, workplaceId: string, expiresAt: Date): SecureTokenData;
    static validateTokenWithExpiry(token: string, expiresAt: Date): TokenValidationResult;
    static generateLabOrderTokens(orderId: string, workplaceId: string, expiryDays?: number): {
        primary: SecureTokenData;
        qrCodeData: string;
        barcodeData: string;
    };
}
export default TokenService;
//# sourceMappingURL=tokenService.d.ts.map