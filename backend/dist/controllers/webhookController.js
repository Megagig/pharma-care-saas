"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const express_validator_1 = require("express-validator");
const WebhookService_1 = __importDefault(require("../services/WebhookService"));
class WebhookController {
    async getWebhooks(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request parameters',
                        details: errors.array()
                    }
                });
                return;
            }
            const { userId, isActive, events, search, page = 1, limit = 20 } = req.query;
            const filters = {
                userId: userId,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                events: events ? (Array.isArray(events) ? events : [events]) : undefined,
                search: search
            };
            const result = await WebhookService_1.default.getWebhooks(filters, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error fetching webhooks:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch webhooks'
                }
            });
        }
    }
    async createWebhook(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid webhook data',
                        details: errors.array()
                    }
                });
                return;
            }
            const webhook = await WebhookService_1.default.createWebhook(req.body);
            res.status(201).json({
                success: true,
                data: webhook
            });
        }
        catch (error) {
            console.error('Error creating webhook:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to create webhook'
                }
            });
        }
    }
    async updateWebhook(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid webhook data',
                        details: errors.array()
                    }
                });
                return;
            }
            const { id } = req.params;
            const webhook = await WebhookService_1.default.updateWebhook(id, req.body);
            res.json({
                success: true,
                data: webhook
            });
        }
        catch (error) {
            console.error('Error updating webhook:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to update webhook'
                }
            });
        }
    }
    async deleteWebhook(req, res) {
        try {
            const { id } = req.params;
            await WebhookService_1.default.deleteWebhook(id);
            res.json({
                success: true,
                message: 'Webhook deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting webhook:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to delete webhook'
                }
            });
        }
    }
    async testWebhook(req, res) {
        try {
            const { id } = req.params;
            const result = await WebhookService_1.default.testWebhook(id);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error testing webhook:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to test webhook'
                }
            });
        }
    }
    async triggerWebhook(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid trigger data',
                        details: errors.array()
                    }
                });
                return;
            }
            const { eventType, eventData, eventId } = req.body;
            await WebhookService_1.default.triggerWebhook(eventType, eventData, eventId);
            res.json({
                success: true,
                message: 'Webhook triggered successfully'
            });
        }
        catch (error) {
            console.error('Error triggering webhook:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to trigger webhook'
                }
            });
        }
    }
    async getWebhookDeliveries(req, res) {
        try {
            const { webhookId, eventType, status, startDate, endDate, page = 1, limit = 20 } = req.query;
            const filters = {
                webhookId: webhookId,
                eventType: eventType,
                status: status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            };
            const result = await WebhookService_1.default.getWebhookDeliveries(filters, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error fetching webhook deliveries:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch webhook deliveries'
                }
            });
        }
    }
    async getWebhookStatistics(req, res) {
        try {
            const { webhookId, startDate, endDate } = req.query;
            const statistics = await WebhookService_1.default.getWebhookStatistics(webhookId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({
                success: true,
                data: statistics
            });
        }
        catch (error) {
            console.error('Error fetching webhook statistics:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch webhook statistics'
                }
            });
        }
    }
    async getAvailableEvents(req, res) {
        try {
            const events = WebhookService_1.default.getAvailableEvents();
            res.json({
                success: true,
                data: events
            });
        }
        catch (error) {
            console.error('Error fetching available events:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch available events'
                }
            });
        }
    }
    async processRetries(req, res) {
        try {
            await WebhookService_1.default.processWebhookRetries();
            res.json({
                success: true,
                message: 'Webhook retries processed successfully'
            });
        }
        catch (error) {
            console.error('Error processing webhook retries:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to process webhook retries'
                }
            });
        }
    }
}
exports.WebhookController = WebhookController;
exports.default = new WebhookController();
//# sourceMappingURL=webhookController.js.map