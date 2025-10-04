import { Request, Response, NextFunction } from 'express';
export interface CompressionOptions {
    threshold?: number;
    level?: number;
    filter?: (req: Request, res: Response) => boolean;
    chunkSize?: number;
}
export declare const intelligentCompressionMiddleware: (options?: CompressionOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const brotliCompressionMiddleware: () => (req: Request, res: Response, next: NextFunction) => void;
export declare const responseSizeMonitoringMiddleware: () => (req: Request, res: Response, next: NextFunction) => void;
export declare const adaptiveCompressionMiddleware: () => (req: Request, res: Response, next: NextFunction) => void;
export default intelligentCompressionMiddleware;
//# sourceMappingURL=compressionMiddleware.d.ts.map