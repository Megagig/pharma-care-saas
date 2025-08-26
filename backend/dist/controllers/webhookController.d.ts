import { Request, Response } from 'express';
export declare class WebhookController {
    handlePaystackWebhook(req: Request, res: Response): Promise<void>;
    handleNombaWebhook(req: Request, res: Response): Promise<void>;
    private verifyNombaSignature;
    private handleSuccessfulPayment;
    private handleFailedPayment;
    private handleSubscriptionCreatedOrRenewed;
    private handleSubscriptionCanceled;
    private handleSubscriptionExpiringSoon;
    private verifyPaystackSignature;
    private handlePaystackSuccessfulCharge;
    private handlePaystackSubscriptionCreated;
    private handlePaystackSubscriptionDisabled;
    private handlePaystackInvoiceCreated;
}
export declare const webhookController: WebhookController;
//# sourceMappingURL=webhookController.d.ts.map