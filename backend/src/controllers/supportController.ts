import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { SupportTicketService } from '../services/SupportTicketService';
import { KnowledgeBaseService } from '../services/KnowledgeBaseService';
import { SupportMetricsService } from '../services/SupportMetricsService';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import logger from '../utils/logger';
import { body, query, param } from 'express-validator';

/**
 * Support Controller
 * Handles support ticket management, knowledge base, and support metrics
 * for the SaaS Settings Module
 */
export class SupportController {
  private ticketService: SupportTicketService;
  private knowledgeBaseService: KnowledgeBaseService;
  private metricsService: SupportMetricsService;

  constructor() {
    this.ticketService = SupportTicketService.getInstance();
    this.knowledgeBaseService = KnowledgeBaseService.getInstance();
    this.metricsService = SupportMetricsService.getInstance();
  }

  // Ticket Management Methods

  /**
   * Create a new support ticket
   * POST /api/admin/saas/support/tickets
   */
  async createTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        body('title').notEmpty().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
        body('description').notEmpty().isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
        body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
        body('category').isIn(['technical', 'billing', 'feature_request', 'bug_report', 'general']).withMessage('Invalid category'),
        body('tags').optional().isArray().withMessage('Tags must be an array'),
        body('workspaceId').optional().isMongoId().withMessage('Invalid workspace ID')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const ticketData = {
        ...req.body,
        userId: req.user!._id
      };

      logger.info('Creating support ticket', {
        userId: req.user!._id,
        title: ticketData.title,
        priority: ticketData.priority
      });

      const ticket = await this.ticketService.createTicket(ticketData);

      sendSuccess(
        res,
        ticket,
        'Support ticket created successfully',
        201
      );
    } catch (error) {
      logger.error('Error creating support ticket:', error);
      sendError(
        res,
        'TICKET_CREATION_ERROR',
        'Failed to create support ticket',
        500
      );
    }
  }

  /**
   * Get tickets with filtering and pagination
   * GET /api/admin/saas/support/tickets
   */
  async getTickets(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
        query('status').optional().isArray().withMessage('Status must be an array'),
        query('priority').optional().isArray().withMessage('Priority must be an array'),
        query('category').optional().isArray().withMessage('Category must be an array'),
        query('assignedTo').optional().isMongoId().withMessage('Invalid assigned to ID'),
        query('search').optional().isString().withMessage('Search must be a string')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const filters = {
        status: req.query.status as string[],
        priority: req.query.priority as string[],
        category: req.query.category as string[],
        assignedTo: req.query.assignedTo as string,
        userId: req.query.userId as string,
        workspaceId: req.query.workspaceId as string,
        search: req.query.search as string,
        tags: req.query.tags as string[],
        dateRange: req.query.startDate && req.query.endDate ? {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string)
        } : undefined
      };

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      logger.info('Fetching support tickets', {
        userId: req.user!._id,
        filters,
        pagination
      });

      const result = await this.ticketService.getTickets(filters, pagination);

      sendSuccess(
        res,
        result,
        'Tickets retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching tickets:', error);
      sendError(
        res,
        'TICKETS_FETCH_ERROR',
        'Failed to fetch tickets',
        500
      );
    }
  }

  /**
   * Get ticket by ID
   * GET /api/admin/saas/support/tickets/:ticketId
   */
  async getTicketById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        param('ticketId').isMongoId().withMessage('Invalid ticket ID')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const { ticketId } = req.params;

      logger.info('Fetching ticket by ID', {
        userId: req.user!._id,
        ticketId
      });

      const ticket = await this.ticketService.getTicketById(ticketId);

      if (!ticket) {
        sendError(res, 'TICKET_NOT_FOUND', 'Ticket not found', 404);
        return;
      }

      sendSuccess(
        res,
        ticket,
        'Ticket retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching ticket by ID:', error);
      sendError(
        res,
        'TICKET_FETCH_ERROR',
        'Failed to fetch ticket',
        500
      );
    }
  }

  /**
   * Assign ticket to agent
   * PUT /api/admin/saas/support/tickets/:ticketId/assign
   */
  async assignTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
        body('assignedToId').isMongoId().withMessage('Invalid assigned to ID')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const { ticketId } = req.params;
      const { assignedToId } = req.body;

      logger.info('Assigning ticket', {
        userId: req.user!._id,
        ticketId,
        assignedToId
      });

      const ticket = await this.ticketService.assignTicket(
        ticketId,
        assignedToId,
        req.user!._id
      );

      sendSuccess(
        res,
        ticket,
        'Ticket assigned successfully'
      );
    } catch (error) {
      logger.error('Error assigning ticket:', error);
      sendError(
        res,
        'TICKET_ASSIGNMENT_ERROR',
        'Failed to assign ticket',
        500
      );
    }
  }

  /**
   * Update ticket status
   * PUT /api/admin/saas/support/tickets/:ticketId/status
   */
  async updateTicketStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
        body('status').isIn(['open', 'in_progress', 'pending_customer', 'resolved', 'closed']).withMessage('Invalid status'),
        body('resolutionNotes').optional().isString().withMessage('Resolution notes must be a string')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const { ticketId } = req.params;
      const { status, resolutionNotes } = req.body;

      logger.info('Updating ticket status', {
        userId: req.user!._id,
        ticketId,
        status
      });

      const ticket = await this.ticketService.updateTicketStatus(
        ticketId,
        status,
        req.user!._id,
        resolutionNotes
      );

      sendSuccess(
        res,
        ticket,
        'Ticket status updated successfully'
      );
    } catch (error) {
      logger.error('Error updating ticket status:', error);
      sendError(
        res,
        'TICKET_UPDATE_ERROR',
        'Failed to update ticket status',
        500
      );
    }
  }

  /**
   * Escalate ticket
   * PUT /api/admin/saas/support/tickets/:ticketId/escalate
   */
  async escalateTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
        body('reason').notEmpty().isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const { ticketId } = req.params;
      const { reason } = req.body;

      logger.info('Escalating ticket', {
        userId: req.user!._id,
        ticketId,
        reason
      });

      const ticket = await this.ticketService.escalateTicket(
        ticketId,
        req.user!._id,
        reason
      );

      sendSuccess(
        res,
        ticket,
        'Ticket escalated successfully'
      );
    } catch (error) {
      logger.error('Error escalating ticket:', error);
      sendError(
        res,
        'TICKET_ESCALATION_ERROR',
        'Failed to escalate ticket',
        500
      );
    }
  }

  /**
   * Add comment to ticket
   * POST /api/admin/saas/support/tickets/:ticketId/comments
   */
  async addComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
        body('content').notEmpty().isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),
        body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const { ticketId } = req.params;
      const { content, isInternal, attachments } = req.body;

      // Determine author type based on user role
      const authorType = ['support_agent', 'senior_support_agent', 'technical_support', 'admin', 'super_admin'].includes(req.user!.role)
        ? 'agent'
        : 'customer';

      logger.info('Adding comment to ticket', {
        userId: req.user!._id,
        ticketId,
        authorType
      });

      const comment = await this.ticketService.addComment({
        ticketId,
        authorId: req.user!._id,
        content,
        authorType,
        isInternal: isInternal || false,
        attachments
      });

      sendSuccess(
        res,
        comment,
        'Comment added successfully',
        201
      );
    } catch (error) {
      logger.error('Error adding comment:', error);
      sendError(
        res,
        'COMMENT_CREATION_ERROR',
        'Failed to add comment',
        500
      );
    }
  }

  /**
   * Get ticket comments
   * GET /api/admin/saas/support/tickets/:ticketId/comments
   */
  async getTicketComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
        query('includeInternal').optional().isBoolean().withMessage('includeInternal must be a boolean')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const { ticketId } = req.params;
      const includeInternal = req.query.includeInternal === 'true';

      logger.info('Fetching ticket comments', {
        userId: req.user!._id,
        ticketId,
        includeInternal
      });

      const comments = await this.ticketService.getTicketComments(ticketId, includeInternal);

      sendSuccess(
        res,
        { comments },
        'Comments retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching comments:', error);
      sendError(
        res,
        'COMMENTS_FETCH_ERROR',
        'Failed to fetch comments',
        500
      );
    }
  }

  // Knowledge Base Methods

  /**
   * Create knowledge base article
   * POST /api/admin/saas/support/knowledge-base/articles
   */
  async createArticle(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        body('title').notEmpty().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
        body('content').notEmpty().withMessage('Content is required'),
        body('excerpt').notEmpty().isLength({ min: 10, max: 500 }).withMessage('Excerpt must be 10-500 characters'),
        body('category').notEmpty().withMessage('Category is required'),
        body('tags').optional().isArray().withMessage('Tags must be an array'),
        body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const articleData = {
        ...req.body,
        authorId: req.user!._id
      };

      logger.info('Creating knowledge base article', {
        userId: req.user!._id,
        title: articleData.title
      });

      const article = await this.knowledgeBaseService.createArticle(articleData);

      sendSuccess(
        res,
        article,
        'Article created successfully',
        201
      );
    } catch (error) {
      logger.error('Error creating article:', error);
      sendError(
        res,
        'ARTICLE_CREATION_ERROR',
        'Failed to create article',
        500
      );
    }
  }

  /**
   * Get knowledge base articles
   * GET /api/admin/saas/support/knowledge-base/articles
   */
  async getArticles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string[],
        category: req.query.category as string,
        subcategory: req.query.subcategory as string,
        tags: req.query.tags as string[],
        authorId: req.query.authorId as string,
        isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
        search: req.query.search as string,
        dateRange: req.query.startDate && req.query.endDate ? {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string)
        } : undefined
      };

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      logger.info('Fetching knowledge base articles', {
        userId: req.user!._id,
        filters,
        pagination
      });

      const result = await this.knowledgeBaseService.getArticles(filters, pagination);

      sendSuccess(
        res,
        result,
        'Articles retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching articles:', error);
      sendError(
        res,
        'ARTICLES_FETCH_ERROR',
        'Failed to fetch articles',
        500
      );
    }
  }

  /**
   * Search knowledge base articles
   * GET /api/admin/saas/support/knowledge-base/search
   */
  async searchArticles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        query('q').notEmpty().withMessage('Search query is required'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const searchQuery = req.query.q as string;
      const filters = {
        category: req.query.category as string,
        tags: req.query.tags as string[]
      };
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      logger.info('Searching knowledge base articles', {
        userId: req.user!._id,
        searchQuery,
        filters
      });

      const result = await this.knowledgeBaseService.searchArticles(searchQuery, filters, pagination);

      sendSuccess(
        res,
        result,
        'Search completed successfully'
      );
    } catch (error) {
      logger.error('Error searching articles:', error);
      sendError(
        res,
        'SEARCH_ERROR',
        'Failed to search articles',
        500
      );
    }
  }

  // Metrics Methods

  /**
   * Get support metrics
   * GET /api/admin/saas/support/metrics
   */
  async getSupportMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const timeRange = req.query.startDate && req.query.endDate ? {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string)
      } : undefined;

      logger.info('Fetching support metrics', {
        userId: req.user!._id,
        timeRange
      });

      const metrics = await this.metricsService.getSupportKPIs(timeRange);

      sendSuccess(
        res,
        metrics,
        'Support metrics retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching support metrics:', error);
      sendError(
        res,
        'METRICS_ERROR',
        'Failed to fetch support metrics',
        500
      );
    }
  }

  /**
   * Get support analytics
   * GET /api/admin/saas/support/analytics
   */
  async getSupportAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validationRules = [
        query('startDate').notEmpty().isISO8601().withMessage('Valid start date is required'),
        query('endDate').notEmpty().isISO8601().withMessage('Valid end date is required')
      ];

      // Validation temporarily disabled
      // const validationResult = await validateRequest(req, validationRules);
      // if (!validationResult.isValid) {
      //   sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, validationResult.errors);
      //   return;
      // }

      const timeRange = {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string)
      };

      logger.info('Fetching support analytics', {
        userId: req.user!._id,
        timeRange
      });

      const analytics = await this.metricsService.getSupportAnalytics(timeRange);

      sendSuccess(
        res,
        analytics,
        'Support analytics retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching support analytics:', error);
      sendError(
        res,
        'ANALYTICS_ERROR',
        'Failed to fetch support analytics',
        500
      );
    }
  }
}

// Create and export controller instance
export const supportController = new SupportController();