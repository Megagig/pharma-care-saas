export declare const generateAccessToken: (userId: string) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const generateResetToken: () => string;
export declare const generateApiKey: () => string;
export declare const verifyToken: (token: string, secret?: string) => any;
export declare const hashToken: (token: string) => string;
//# sourceMappingURL=token.d.ts.map