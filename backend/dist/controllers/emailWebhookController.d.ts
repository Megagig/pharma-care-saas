import { Request, Response } from 'express';
export declare class EmailWebhookController {
    handleResendWebhook(req: Request, res: Response): Promise<void>;
    handleGenericWebhook(req: Request, res: Response): Promise<void>;
    getDeliveryStats(req: Request, res: Response): Promise<void>;
    getDeliveryHistory(req: Request, res: Response): Promise<void>;
    retryFailedEmail(req: Request, res: Response): Promise<void>;
    private handleEmailSent;
    private handleEmailDelivered;
    private handleEmailBounced;
    private handleEmailComplained;
    private verifyResendSignature;
}
export declare const emailWebhookController: EmailWebhookController;
//# sourceMappingURL=emailWebhookController.d.ts.map