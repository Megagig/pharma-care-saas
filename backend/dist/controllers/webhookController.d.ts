import { Request, Response } from 'express';
export declare class WebhookController {
    handleNombaWebhook(req: Request, res: Response): Promise<void>;
    private verifyNombaSignature;
    private handleSuccessfulPayment;
    private handleFailedPayment;
    private handleSubscriptionCreatedOrRenewed;
    private handleSubscriptionCanceled;
    private handleSubscriptionExpiringSoon;
}
export declare const webhookController: WebhookController;
//# sourceMappingURL=webhookController.d.ts.map