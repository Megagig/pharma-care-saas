export declare class EncryptionService {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly hmacAlgorithm;
    private readonly keyRotationInterval;
    private keys;
    private currentKeyId;
    constructor();
    private initializeDefaultKey;
    generateEncryptionKey(): Promise<string>;
    rotateEncryptionKey(conversationId: string): Promise<string>;
    encryptMessage(content: string, keyId?: string): Promise<string>;
    decryptMessage(encryptedContent: string, keyId?: string): Promise<string>;
    needsRotation(keyId: string): boolean;
    getCurrentKeyId(): string | null;
    validateKey(keyId: string): boolean;
    cleanupOldKeys(retentionDays?: number): void;
    getStats(): {
        algorithm: string;
        keyLength: number;
        activeKeys: number;
        totalKeys: number;
        currentKeyId: string | null;
        keyRotationInterval: number;
    };
}
export declare const encryptionService: EncryptionService;
//# sourceMappingURL=encryptionService.d.ts.map