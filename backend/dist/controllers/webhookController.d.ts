import { Request, Response } from 'express';
export declare class WebhookController {
    getWebhooks(req: Request, res: Response): Promise<void>;
    createWebhook(req: Request, res: Response): Promise<void>;
    updateWebhook(req: Request, res: Response): Promise<void>;
    deleteWebhook(req: Request, res: Response): Promise<void>;
    testWebhook(req: Request, res: Response): Promise<void>;
    triggerWebhook(req: Request, res: Response): Promise<void>;
    getWebhookDeliveries(req: Request, res: Response): Promise<void>;
    getWebhookStatistics(req: Request, res: Response): Promise<void>;
    getAvailableEvents(req: Request, res: Response): Promise<void>;
    processRetries(req: Request, res: Response): Promise<void>;
}
declare const _default: WebhookController;
export default _default;
//# sourceMappingURL=webhookController.d.ts.map