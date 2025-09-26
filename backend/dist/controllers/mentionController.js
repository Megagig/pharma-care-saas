"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMentionNotifications = exports.getMentionedUsers = exports.getMentionStats = exports.searchMessagesByMentions = exports.getUserSuggestions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const getUserSuggestions = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { query, limit = 10 } = req.query;
        const currentUserId = req.user?._id;
        const workplaceId = req.workplaceId;
        if (!workplaceId) {
            res.status(400).json({
                success: false,
                message: "Workplace context required",
            });
            return;
        }
        const conversation = await Conversation_1.default.findOne({
            _id: conversationId,
            workplaceId,
            "participants.userId": currentUserId,
        });
        if (!conversation) {
            res.status(404).json({
                success: false,
                message: "Conversation not found or access denied",
            });
            return;
        }
        const searchQuery = {
            workplaceId,
            isDeleted: false,
            _id: { $ne: currentUserId },
        };
        if (query && typeof query === "string") {
            const searchRegex = new RegExp(query, "i");
            searchQuery.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
            ];
        }
        const allowedRoles = ["pharmacist", "doctor"];
        if (conversation.type === "patient_query" && conversation.patientId) {
            const patient = await User_1.default.findById(conversation.patientId);
            if (patient) {
                allowedRoles.push("patient");
            }
        }
        searchQuery.role = { $in: allowedRoles };
        const users = await User_1.default.find(searchQuery)
            .select("firstName lastName email role avatar")
            .limit(Number(limit))
            .sort({ firstName: 1, lastName: 1 });
        const suggestions = users.map((user) => ({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            displayName: `${user.firstName} ${user.lastName}`,
            subtitle: `${user.role} • ${user.email}`,
        }));
        res.json({
            success: true,
            data: suggestions,
        });
    }
    catch (error) {
        console.error("Error getting user suggestions:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user suggestions",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
        });
    }
};
exports.getUserSuggestions = getUserSuggestions;
const searchMessagesByMentions = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId, limit = 50, page = 1 } = req.query;
        const currentUserId = req.user?._id;
        const workplaceId = req.workplaceId;
        if (!workplaceId) {
            res.status(400).json({
                success: false,
                message: "Workplace context required",
            });
            return;
        }
        const conversation = await Conversation_1.default.findOne({
            _id: conversationId,
            workplaceId,
            "participants.userId": currentUserId,
        });
        if (!conversation) {
            res.status(404).json({
                success: false,
                message: "Conversation not found or access denied",
            });
            return;
        }
        const searchQuery = {
            conversationId,
            mentions: { $exists: true, $ne: [] },
            isDeleted: false,
        };
        if (userId && typeof userId === "string") {
            searchQuery.mentions = userId;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const messages = await Message_1.default.find(searchQuery)
            .populate("senderId", "firstName lastName role email avatar")
            .populate("mentions", "firstName lastName role email avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Message_1.default.countDocuments(searchQuery);
        const formattedMessages = messages.map((message) => ({
            _id: message._id,
            conversationId: message.conversationId,
            senderId: message.senderId._id,
            sender: {
                _id: message.senderId._id,
                firstName: message.senderId.firstName,
                lastName: message.senderId.lastName,
                role: message.senderId.role,
                email: message.senderId.email,
                avatar: message.senderId.avatar,
            },
            content: {
                text: message.content.text,
                type: message.content.type,
            },
            mentions: message.mentions.map((m) => m._id),
            mentionedUsers: message.mentions.map((m) => ({
                _id: m._id,
                firstName: m.firstName,
                lastName: m.lastName,
                role: m.role,
                email: m.email,
                avatar: m.avatar,
            })),
            priority: message.priority,
            createdAt: message.createdAt,
        }));
        res.json({
            success: true,
            data: {
                messages: formattedMessages,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        console.error("Error searching messages by mentions:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search messages by mentions",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
        });
    }
};
exports.searchMessagesByMentions = searchMessagesByMentions;
const getMentionStats = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user?._id;
        const workplaceId = req.workplaceId;
        if (!workplaceId) {
            res.status(400).json({
                success: false,
                message: "Workplace context required",
            });
            return;
        }
        const conversation = await Conversation_1.default.findOne({
            _id: conversationId,
            workplaceId,
            "participants.userId": currentUserId,
        });
        if (!conversation) {
            res.status(404).json({
                success: false,
                message: "Conversation not found or access denied",
            });
            return;
        }
        const totalMentions = await Message_1.default.countDocuments({
            conversationId,
            mentions: { $exists: true, $ne: [] },
            isDeleted: false,
        });
        const mentionsByUser = await Message_1.default.aggregate([
            {
                $match: {
                    conversationId: new mongoose_1.default.Types.ObjectId(conversationId),
                    mentions: { $exists: true, $ne: [] },
                    isDeleted: false,
                },
            },
            {
                $unwind: "$mentions",
            },
            {
                $group: {
                    _id: "$mentions",
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    userId: "$_id",
                    count: 1,
                    userName: {
                        $concat: ["$user.firstName", " ", "$user.lastName"],
                    },
                },
            },
        ]);
        const recentMentions = await Message_1.default.find({
            conversationId,
            mentions: { $exists: true, $ne: [] },
            isDeleted: false,
        })
            .populate("senderId", "firstName lastName")
            .populate("mentions", "firstName lastName")
            .sort({ createdAt: -1 })
            .limit(10)
            .select("_id senderId mentions createdAt");
        const mentionsByUserMap = mentionsByUser.reduce((acc, item) => {
            acc[item.userId.toString()] = item.count;
            return acc;
        }, {});
        const formattedRecentMentions = recentMentions.map((message) => ({
            messageId: message._id,
            senderId: message.senderId._id,
            mentionedUsers: message.mentions.map((m) => m._id),
            timestamp: message.createdAt,
        }));
        res.json({
            success: true,
            data: {
                totalMentions,
                mentionsByUser: mentionsByUserMap,
                recentMentions: formattedRecentMentions,
            },
        });
    }
    catch (error) {
        console.error("Error getting mention stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get mention statistics",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
        });
    }
};
exports.getMentionStats = getMentionStats;
const getMentionedUsers = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user?._id;
        const workplaceId = req.workplaceId;
        if (!workplaceId) {
            res.status(400).json({
                success: false,
                message: "Workplace context required",
            });
            return;
        }
        const conversation = await Conversation_1.default.findOne({
            _id: conversationId,
            workplaceId,
            "participants.userId": currentUserId,
        });
        if (!conversation) {
            res.status(404).json({
                success: false,
                message: "Conversation not found or access denied",
            });
            return;
        }
        const mentionedUserIds = await Message_1.default.distinct("mentions", {
            conversationId,
            mentions: { $exists: true, $ne: [] },
            isDeleted: false,
        });
        const users = await User_1.default.find({
            _id: { $in: mentionedUserIds },
            isDeleted: false,
        }).select("firstName lastName role email avatar");
        res.json({
            success: true,
            data: {
                users: users.map((user) => ({
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    email: user.email,
                    avatar: user.avatar,
                })),
            },
        });
    }
    catch (error) {
        console.error("Error getting mentioned users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get mentioned users",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
        });
    }
};
exports.getMentionedUsers = getMentionedUsers;
const createMentionNotifications = async (messageId, conversationId, senderId, mentionedUserIds, messageContent, priority = "normal", workplaceId) => {
    try {
        const Notification = mongoose_1.default.model("Notification");
        const sender = await User_1.default.findById(senderId).select("firstName lastName");
        if (!sender)
            return;
        const senderName = `${sender.firstName} ${sender.lastName}`;
        const notifications = mentionedUserIds
            .filter((userId) => !userId.equals(senderId))
            .map((userId) => ({
            userId,
            type: "mention",
            title: `${senderName} mentioned you`,
            content: messageContent.substring(0, 100) +
                (messageContent.length > 100 ? "..." : ""),
            data: {
                conversationId,
                messageId,
                senderId,
                actionUrl: `/communication/${conversationId}?message=${messageId}`,
            },
            priority,
            deliveryChannels: {
                inApp: true,
                email: priority === "urgent",
                sms: false,
            },
            workplaceId,
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
        return notifications;
    }
    catch (error) {
        console.error("Error creating mention notifications:", error);
        throw error;
    }
};
exports.createMentionNotifications = createMentionNotifications;
//# sourceMappingURL=mentionController.js.map