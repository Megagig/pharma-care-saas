import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import mongoose from 'mongoose';
export interface WorkspaceSubscriptionData {
    workspaceId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    billingInterval: 'monthly' | 'yearly';
    autoRenew?: boolean;
}
export interface TrialCreationData {
    workspaceId: mongoose.Types.ObjectId;
    trialDurationDays?: number;
}
export declare class SubscriptionManagementController {
    getWorkspaceSubscription(req: AuthRequest, res: Response): Promise<any>;
    createTrialSubscription(req: AuthRequest, res: Response): Promise<any>;
    updateSubscriptionStatus(req: AuthRequest, res: Response): Promise<any>;
    createWorkspaceCheckout(req: AuthRequest, res: Response): Promise<any>;
    handleWorkspacePaymentSuccess(req: AuthRequest, res: Response): Promise<any>;
    private activateWorkspaceSubscription;
    upgradeWorkspaceSubscription(req: AuthRequest, res: Response): Promise<any>;
    downgradeWorkspaceSubscription(req: AuthRequest, res: Response): Promise<any>;
    cancelScheduledDowngrade(req: AuthRequest, res: Response): Promise<any>;
    handleUpgradePaymentSuccess(req: AuthRequest, res: Response): Promise<any>;
    private applySubscriptionUpgrade;
    checkTrialExpiry(req: AuthRequest, res: Response): Promise<any>;
    extendTrialPeriod(req: AuthRequest, res: Response): Promise<any>;
    handleSubscriptionExpiry(req: AuthRequest, res: Response): Promise<any>;
    enablePaywallMode(req: AuthRequest, res: Response): Promise<any>;
    getSubscriptionStatus(req: AuthRequest, res: Response): Promise<any>;
    private expireTrialSubscription;
    private sendStatusChangeNotification;
}
export declare const subscriptionManagementController: SubscriptionManagementController;
//# sourceMappingURL=subscriptionManagementController.d.ts.map