import { Request, Response } from "express";
import mongoose from "mongoose";
interface IUser {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
}
interface AuthenticatedRequest extends Request {
    user?: IUser;
    workplaceId?: mongoose.Types.ObjectId;
}
export declare const getUserSuggestions: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const searchMessagesByMentions: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMentionStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMentionedUsers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createMentionNotifications: (messageId: mongoose.Types.ObjectId, conversationId: mongoose.Types.ObjectId, senderId: mongoose.Types.ObjectId, mentionedUserIds: mongoose.Types.ObjectId[], messageContent: string, priority?: "normal" | "urgent", workplaceId?: mongoose.Types.ObjectId) => Promise<{
    userId: mongoose.Types.ObjectId;
    type: string;
    title: string;
    content: string;
    data: {
        conversationId: mongoose.Types.ObjectId;
        messageId: mongoose.Types.ObjectId;
        senderId: mongoose.Types.ObjectId;
        actionUrl: string;
    };
    priority: "normal" | "urgent";
    deliveryChannels: {
        inApp: boolean;
        email: boolean;
        sms: boolean;
    };
    workplaceId: mongoose.Types.ObjectId | undefined;
}[] | undefined>;
export {};
//# sourceMappingURL=mentionController.d.ts.map