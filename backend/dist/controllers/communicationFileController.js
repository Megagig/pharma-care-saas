"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationFileController = void 0;
const cloudinary_1 = require("cloudinary");
const Message_1 = __importDefault(require("../models/Message"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const AuditLog_1 = require("../models/AuditLog");
const logger_1 = __importDefault(require("../utils/logger"));
const fileUploadService_1 = require("../services/fileUploadService");
class CommunicationFileController {
    static async uploadFile(req, res) {
        try {
            const { conversationId } = req.body;
            const userId = req.user?._id;
            const workplaceId = req.user?.workplaceId;
            if (!userId || !workplaceId) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }
            if (!conversationId) {
                res.status(400).json({ error: "Conversation ID is required" });
                return;
            }
            if (!req.file) {
                res.status(400).json({ error: "No file uploaded" });
                return;
            }
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
                "participants.userId": userId,
            });
            if (!conversation) {
                res.status(403).json({ error: "Access denied to this conversation" });
                return;
            }
            const processResult = await fileUploadService_1.FileUploadService.processUploadedFile(req.file);
            if (!processResult.success) {
                res.status(400).json({ error: processResult.error });
                return;
            }
            const cloudinaryResult = await cloudinary_1.v2.uploader.upload(req.file.path, {
                folder: `communication-files/${workplaceId}`,
                resource_type: "auto",
                access_mode: "authenticated",
                type: "authenticated",
                secure: true,
                transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
            });
            await fileUploadService_1.FileUploadService.deleteFile(req.file.path);
            const fileData = {
                fileName: cloudinaryResult.public_id,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                url: cloudinaryResult.url,
                secureUrl: cloudinaryResult.secure_url,
                publicId: cloudinaryResult.public_id,
                uploadedAt: new Date(),
            };
            await AuditLog_1.AuditLog.create({
                action: "file_uploaded",
                userId,
                targetId: conversationId,
                targetType: "conversation",
                details: {
                    conversationId,
                    fileName: fileData.originalName,
                    fileSize: fileData.size,
                    mimeType: fileData.mimeType,
                    publicId: fileData.publicId,
                },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent") || "",
                workplaceId,
                timestamp: new Date(),
            });
            logger_1.default.info("File uploaded successfully", {
                userId,
                conversationId,
                fileName: fileData.originalName,
                fileSize: fileData.size,
            });
            res.status(201).json({
                success: true,
                message: "File uploaded successfully",
                file: {
                    id: fileData.publicId,
                    fileName: fileData.fileName,
                    originalName: fileData.originalName,
                    mimeType: fileData.mimeType,
                    size: fileData.size,
                    secureUrl: fileData.secureUrl,
                    uploadedAt: fileData.uploadedAt,
                },
            });
        }
        catch (error) {
            logger_1.default.error("File upload failed", {
                error: error.message,
                userId: req.user?._id,
                conversationId: req.body.conversationId,
            });
            if (req.file?.path) {
                try {
                    await fileUploadService_1.FileUploadService.deleteFile(req.file.path);
                }
                catch (cleanupError) {
                    logger_1.default.error("Failed to cleanup file after error", {
                        error: cleanupError,
                    });
                }
            }
            res.status(500).json({
                error: "File upload failed",
                message: error.message,
            });
        }
    }
    static async downloadFile(req, res) {
        try {
            const { fileId } = req.params;
            if (!fileId || typeof fileId !== "string") {
                res.status(400).json({ error: "Valid file ID is required" });
                return;
            }
            const userId = req.user?._id;
            const workplaceId = req.user?.workplaceId;
            if (!userId || !workplaceId) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }
            const message = await Message_1.default.findOne({
                "content.attachments.fileId": fileId,
            }).populate("conversationId");
            if (!message) {
                res.status(404).json({ error: "File not found" });
                return;
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                workplaceId,
                "participants.userId": userId,
            });
            if (!conversation) {
                res.status(403).json({ error: "Access denied to this file" });
                return;
            }
            const attachment = message.content.attachments?.find((att) => att.fileId === fileId);
            if (!attachment) {
                res.status(404).json({ error: "File attachment not found" });
                return;
            }
            const downloadUrl = cloudinary_1.v2.url(fileId, {
                resource_type: "auto",
                type: "authenticated",
                sign_url: true,
                secure: true,
            });
            await AuditLog_1.AuditLog.create({
                action: "file_downloaded",
                userId,
                targetId: message._id,
                targetType: "message",
                details: {
                    conversationId: message.conversationId,
                    messageId: message._id,
                    fileName: attachment.fileName,
                    fileId,
                },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent") || "",
                workplaceId,
                timestamp: new Date(),
            });
            res.json({
                success: true,
                downloadUrl,
                fileName: attachment.fileName,
                mimeType: attachment.mimeType,
                size: attachment.fileSize,
            });
        }
        catch (error) {
            logger_1.default.error("File download failed", {
                error: error.message,
                userId: req.user?._id,
                fileId: req.params.fileId,
            });
            res.status(500).json({
                error: "File download failed",
                message: error.message,
            });
        }
    }
    static async deleteFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user?._id;
            const workplaceId = req.user?.workplaceId;
            if (!userId || !workplaceId) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }
            const message = await Message_1.default.findOne({
                "content.attachments.fileId": fileId,
            });
            if (!message) {
                res.status(404).json({ error: "File not found" });
                return;
            }
            if (message.senderId.toString() !== userId &&
                req.user?.role !== "super_admin") {
                res.status(403).json({
                    error: "Access denied. Only file owner or admin can delete files",
                });
                return;
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                workplaceId,
                "participants.userId": userId,
            });
            if (!conversation) {
                res.status(403).json({ error: "Access denied to this conversation" });
                return;
            }
            const attachmentIndex = message.content.attachments?.findIndex((att) => att.fileId === fileId);
            if (attachmentIndex === -1 || attachmentIndex === undefined) {
                res.status(404).json({ error: "File attachment not found" });
                return;
            }
            const attachment = message.content.attachments[attachmentIndex];
            if (!fileId || typeof fileId !== "string") {
                res.status(400).json({ error: "Valid file ID is required" });
                return;
            }
            await cloudinary_1.v2.uploader.destroy(fileId, { resource_type: "auto" });
            message.content.attachments.splice(attachmentIndex, 1);
            await message.save();
            await AuditLog_1.AuditLog.create({
                action: "file_deleted",
                userId,
                targetId: message._id,
                targetType: "message",
                details: {
                    conversationId: message.conversationId,
                    messageId: message._id,
                    fileName: attachment?.fileName || "unknown",
                    fileId,
                },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent") || "",
                workplaceId,
                timestamp: new Date(),
            });
            logger_1.default.info("File deleted successfully", {
                userId,
                fileId,
                fileName: attachment?.fileName || "unknown",
            });
            res.json({
                success: true,
                message: "File deleted successfully",
            });
        }
        catch (error) {
            logger_1.default.error("File deletion failed", {
                error: error.message,
                userId: req.user?._id,
                fileId: req.params.fileId,
            });
            res.status(500).json({
                error: "File deletion failed",
                message: error.message,
            });
        }
    }
    static async getFileMetadata(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user?._id;
            const workplaceId = req.user?.workplaceId;
            if (!userId || !workplaceId) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }
            const message = await Message_1.default.findOne({
                "content.attachments.fileId": fileId,
            }).populate("senderId", "firstName lastName role");
            if (!message) {
                res.status(404).json({ error: "File not found" });
                return;
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                workplaceId,
                "participants.userId": userId,
            });
            if (!conversation) {
                res.status(403).json({ error: "Access denied to this file" });
                return;
            }
            const attachment = message.content.attachments?.find((att) => att.fileId === fileId);
            if (!attachment) {
                res.status(404).json({ error: "File attachment not found" });
                return;
            }
            res.json({
                success: true,
                file: {
                    id: attachment.fileId,
                    fileName: attachment.fileName,
                    mimeType: attachment.mimeType,
                    size: attachment.fileSize,
                    uploadedAt: message.createdAt,
                    uploadedBy: message.senderId,
                    conversationId: message.conversationId,
                    messageId: message._id,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Get file metadata failed", {
                error: error.message,
                userId: req.user?._id,
                fileId: req.params.fileId,
            });
            res.status(500).json({
                error: "Failed to get file metadata",
                message: error.message,
            });
        }
    }
    static async listConversationFiles(req, res) {
        try {
            const { conversationId } = req.params;
            const userId = req.user?._id;
            const workplaceId = req.user?.workplaceId;
            const { page = 1, limit = 20, fileType } = req.query;
            if (!userId || !workplaceId) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
                "participants.userId": userId,
            });
            if (!conversation) {
                res.status(403).json({ error: "Access denied to this conversation" });
                return;
            }
            const query = {
                conversationId,
                "content.attachments": { $exists: true, $ne: [] },
            };
            if (fileType) {
                query["content.attachments.mimeType"] = new RegExp(fileType, "i");
            }
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const messages = await Message_1.default.find(query)
                .populate("senderId", "firstName lastName role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum);
            const total = await Message_1.default.countDocuments(query);
            const files = messages.flatMap((message) => message.content.attachments?.map((attachment) => ({
                id: attachment.fileId,
                fileName: attachment.fileName,
                mimeType: attachment.mimeType,
                size: attachment.fileSize,
                secureUrl: attachment.secureUrl,
                uploadedAt: message.createdAt,
                uploadedBy: message.senderId,
                messageId: message._id,
            })) || []);
            res.json({
                success: true,
                files,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum),
                },
            });
        }
        catch (error) {
            logger_1.default.error("List conversation files failed", {
                error: error.message,
                userId: req.user?._id,
                conversationId: req.params.conversationId,
            });
            res.status(500).json({
                error: "Failed to list conversation files",
                message: error.message,
            });
        }
    }
}
exports.CommunicationFileController = CommunicationFileController;
exports.default = CommunicationFileController;
//# sourceMappingURL=communicationFileController.js.map