"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
class TokenService {
    static generateSecureToken(orderId, workplaceId, expiryDays = TokenService.TOKEN_EXPIRY_DAYS) {
        try {
            const payload = {
                orderId,
                workplaceId,
                type: 'lab_order_access'
            };
            const token = jsonwebtoken_1.default.sign(payload, TokenService.TOKEN_SECRET, {
                expiresIn: `${expiryDays}d`,
                issuer: 'pharmacare-lab-module',
                audience: 'lab-order-access'
            });
            const hashedToken = TokenService.hashToken(token);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);
            return {
                token,
                hashedToken,
                expiresAt
            };
        }
        catch (error) {
            throw new Error('Token generation failed');
        }
    }
    static generateRandomToken(length = 32) {
        try {
            return crypto_1.default.randomBytes(length).toString('hex');
        }
        catch (error) {
            throw new Error('Random token generation failed');
        }
    }
    static validateToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, TokenService.TOKEN_SECRET, {
                issuer: 'pharmacare-lab-module',
                audience: 'lab-order-access'
            });
            if (!decoded.orderId || !decoded.workplaceId || decoded.type !== 'lab_order_access') {
                return {
                    valid: false,
                    error: 'Invalid token payload structure'
                };
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(decoded.workplaceId)) {
                return {
                    valid: false,
                    error: 'Invalid workplace ID format'
                };
            }
            return {
                valid: true,
                payload: decoded
            };
        }
        catch (error) {
            let errorMessage = 'Token validation failed';
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                errorMessage = 'Token has expired';
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                errorMessage = 'Invalid token format';
            }
            else if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
                errorMessage = 'Token not yet valid';
            }
            return {
                valid: false,
                error: errorMessage
            };
        }
    }
    static hashToken(token) {
        try {
            return crypto_1.default
                .createHash(TokenService.HASH_ALGORITHM)
                .update(token)
                .digest('hex');
        }
        catch (error) {
            throw new Error('Token hashing failed');
        }
    }
    static verifyTokenHash(token, hash) {
        try {
            const computedHash = TokenService.hashToken(token);
            return computedHash === hash;
        }
        catch (error) {
            return false;
        }
    }
    static generateQRCodeData(token, baseUrl) {
        try {
            const scanUrl = baseUrl || process.env.FRONTEND_URL || 'https://app.pharmacare.com';
            return `${scanUrl}/lab/scan?token=${encodeURIComponent(token)}`;
        }
        catch (error) {
            throw new Error('QR code data generation failed');
        }
    }
    static generateBarcodeData(orderId, token) {
        try {
            const tokenHash = TokenService.hashToken(token).substring(0, 16);
            return `${orderId}:${tokenHash}`;
        }
        catch (error) {
            throw new Error('Barcode data generation failed');
        }
    }
    static parseBarcodeData(barcodeData) {
        try {
            const parts = barcodeData.split(':');
            if (parts.length !== 2) {
                return null;
            }
            const [orderId, tokenHash] = parts;
            if (!orderId || !tokenHash) {
                return null;
            }
            if (!/^LAB-\d{4}-\d{4}$/.test(orderId)) {
                return null;
            }
            if (!/^[a-f0-9]{16}$/i.test(tokenHash)) {
                return null;
            }
            return { orderId, tokenHash };
        }
        catch (error) {
            return null;
        }
    }
    static isTokenExpired(expiresAt) {
        return new Date() > expiresAt;
    }
    static generateTokenWithExpiry(orderId, workplaceId, expiresAt) {
        try {
            const now = new Date();
            const expiryDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (expiryDays <= 0) {
                throw new Error('Expiration date must be in the future');
            }
            return TokenService.generateSecureToken(orderId, workplaceId, expiryDays);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Expiration date must be in the future') {
                throw error;
            }
            throw new Error('Token generation with custom expiry failed');
        }
    }
    static validateTokenWithExpiry(token, expiresAt) {
        if (TokenService.isTokenExpired(expiresAt)) {
            return {
                valid: false,
                error: 'Token has expired'
            };
        }
        return TokenService.validateToken(token);
    }
    static generateLabOrderTokens(orderId, workplaceId, expiryDays) {
        try {
            const primary = TokenService.generateSecureToken(orderId, workplaceId, expiryDays);
            const qrCodeData = TokenService.generateQRCodeData(primary.token);
            const barcodeData = TokenService.generateBarcodeData(orderId, primary.token);
            return {
                primary,
                qrCodeData,
                barcodeData
            };
        }
        catch (error) {
            throw new Error('Lab order token generation failed');
        }
    }
}
exports.TokenService = TokenService;
TokenService.TOKEN_EXPIRY_DAYS = 30;
TokenService.TOKEN_SECRET = process.env.LAB_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback-secret-for-testing';
TokenService.HASH_ALGORITHM = 'sha256';
exports.default = TokenService;
//# sourceMappingURL=tokenService.js.map