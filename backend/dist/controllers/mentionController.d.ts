import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from '../types/auth';
export declare const getUserSuggestions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const searchMessagesByMentions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const searchMessagesByMentionsV2: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMentionStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMentionedUsers: (req: AuthRequest, res: Response) => Promise<void>;
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
    workplaceId: mongoose.Types.ObjectId;
}[]>;
//# sourceMappingURL=mentionController.d.ts.map