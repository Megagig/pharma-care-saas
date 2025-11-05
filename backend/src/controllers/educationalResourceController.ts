import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import EducationalResource from '../models/EducationalResource';
import EducationalResourceService, { ResourceSearchOptions } from '../services/EducationalResourceService';
import logger from '../utils/logger';
import { PatientAuthRequest } from '../middlewares/patientAuth';
import { WorkspaceAuthRequest } from '../middlewares/workspaceAuth';

// Extend Request types for different authentication contexts
interface PublicResourceRequest extends Request {
  query: {
    category?: string;
    tags?: string;
    mediaType?: string;
    difficulty?: string;
    language?: string;
    localizedFor?: string;
    search?: string;
    sortBy?: string;
    limit?: string;
    skip?: string;
    page?: string;
  };
}

interface PatientResourceRequest extends PatientAuthRequest {
  query: {
    category?: string;
    tags?: string;
    mediaType?: string;
    difficulty?: string;
    search?: string;
    sortBy?: string;
    limit?: string;
    skip?: string;
    page?: string;
  };
}

interface AdminResourceRequest extends WorkspaceAuthRequest {
  body: {
    title?: string;
    description?: string;
    content?: string;
    category?: string;
    tags?: string[];
    mediaType?: string;
    mediaUrl?: string;
    thumbnail?: string;
    duration?: number;
    fileSize?: number;
    targetAudience?: {
      conditions?: string[];
      medications?: string[];
      ageGroups?: string[];
      demographics?: string[];
    };
    difficulty?: string;
    accessLevel?: string;
    requiredSubscription?: string;
    sources?: Array<{
      title: string;
      url?: string;
      author?: string;
      publishedDate?: Date;
      type: string;
    }>;
    isPublished?: boolean;
  };
  query: {
    category?: string;
    status?: string;
    limit?: string;
    skip?: string;
    page?: string;
  };
}

export class EducationalResourceController {
  /**
   * Get published educational resources (Public endpoint)
   */
  static async getPublicResources(req: PublicResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        category,
        tags,
        mediaType,
        difficulty,
        language = 'en',
        localizedFor = 'general',
        search,
        sortBy = 'newest',
        limit = '20',
        skip = '0',
        page,
      } = req.query;

      // Calculate skip from page if provided
      const limitNum = parseInt(limit, 10);
      let skipNum = parseInt(skip, 10);
      if (page) {
        const pageNum = parseInt(page, 10);
        skipNum = (pageNum - 1) * limitNum;
      }

      const options: ResourceSearchOptions = {
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
        mediaType,
        difficulty: difficulty as any,
        language,
        localizedFor,
        searchQuery: search,
        sortBy: sortBy as any,
        accessLevel: 'public', // Only public resources for unauthenticated users
        limit: limitNum,
        skip: skipNum,
      };

      const result = await EducationalResourceService.getResources(options);

      res.json({
        success: true,
        data: {
          resources: result.resources,
          pagination: {
            total: result.total,
            limit: limitNum,
            skip: skipNum,
            page: page ? parseInt(page, 10) : Math.floor(skipNum / limitNum) + 1,
            hasMore: result.hasMore,
          },
        },
      });
    } catch (error) {
      logger.error('Error retrieving public educational resources:', error);
      next(error);
    }
  }

  /**
   * Get educational resources for authenticated patients
   */
  static async getPatientResources(req: PatientResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        category,
        tags,
        mediaType,
        difficulty,
        search,
        sortBy = 'newest',
        limit = '20',
        skip = '0',
        page,
      } = req.query;

      const workplaceId = req.patientUser?.workplaceId;
      const patientId = req.patientUser?.patientId;

      // Calculate skip from page if provided
      const limitNum = parseInt(limit, 10);
      let skipNum = parseInt(skip, 10);
      if (page) {
        const pageNum = parseInt(page, 10);
        skipNum = (pageNum - 1) * limitNum;
      }

      const options: ResourceSearchOptions = {
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
        mediaType,
        difficulty: difficulty as any,
        searchQuery: search,
        sortBy: sortBy as any,
        accessLevel: undefined, // Allow public and patient_only resources
        workplaceId,
        patientId,
        limit: limitNum,
        skip: skipNum,
      };

      const result = await EducationalResourceService.getResources(options);

      res.json({
        success: true,
        data: {
          resources: result.resources,
          pagination: {
            total: result.total,
            limit: limitNum,
            skip: skipNum,
            page: page ? parseInt(page, 10) : Math.floor(skipNum / limitNum) + 1,
            hasMore: result.hasMore,
          },
        },
      });
    } catch (error) {
      logger.error('Error retrieving patient educational resources:', error);
      next(error);
    }
  }

  /**
   * Get a single resource by slug (Public endpoint)
   */
  static async getPublicResourceBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const resource = await EducationalResourceService.getResourceBySlug(slug, {
        userType: 'public',
        incrementView: true,
      });

      if (!resource) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Educational resource not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { resource },
      });
    } catch (error) {
      logger.error('Error retrieving public educational resource by slug:', error);
      next(error);
    }
  }

  /**
   * Get a single resource by slug for authenticated patients
   */
  static async getPatientResourceBySlug(req: PatientResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const workplaceId = req.patientUser?.workplaceId;

      const resource = await EducationalResourceService.getResourceBySlug(slug, {
        workplaceId,
        userType: 'patient',
        incrementView: true,
      });

      if (!resource) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Educational resource not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { resource },
      });
    } catch (error) {
      logger.error('Error retrieving patient educational resource by slug:', error);
      next(error);
    }
  }

  /**
   * Get personalized recommendations for patient
   */
  static async getPatientRecommendations(req: PatientResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workplaceId = req.patientUser?.workplaceId;
      const patientId = req.patientUser?.patientId;
      const { limit = '10', includeGeneral = 'true' } = req.query;

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PATIENT_ID_REQUIRED',
            message: 'Patient ID is required for recommendations',
          },
        });
        return;
      }

      const recommendations = await EducationalResourceService.getRecommendationsForPatient({
        patientId,
        workplaceId: workplaceId!,
        limit: parseInt(limit, 10),
        includeGeneral: includeGeneral === 'true',
      });

      res.json({
        success: true,
        data: { recommendations },
      });
    } catch (error) {
      logger.error('Error retrieving patient recommendations:', error);
      next(error);
    }
  }

  /**
   * Get popular resources
   */
  static async getPopularResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '10' } = req.query;
      const workplaceId = (req as any).patientUser?.workplaceId; // Optional workplace context

      const resources = await EducationalResourceService.getPopularResources(
        workplaceId,
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: { resources },
      });
    } catch (error) {
      logger.error('Error retrieving popular resources:', error);
      next(error);
    }
  }

  /**
   * Get resources by category
   */
  static async getResourcesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const { language = 'en', limit = '20', skip = '0', page } = req.query;
      const workplaceId = (req as any).patientUser?.workplaceId; // Optional workplace context

      // Calculate skip from page if provided
      const limitNum = parseInt(limit as string, 10);
      let skipNum = parseInt(skip as string, 10);
      if (page) {
        const pageNum = parseInt(page as string, 10);
        skipNum = (pageNum - 1) * limitNum;
      }

      const result = await EducationalResourceService.getResourcesByCategory(category, {
        workplaceId,
        language: language as string,
        limit: limitNum,
        skip: skipNum,
      });

      res.json({
        success: true,
        data: {
          resources: result.resources,
          pagination: {
            total: result.total,
            limit: limitNum,
            skip: skipNum,
            page: page ? parseInt(page as string, 10) : Math.floor(skipNum / limitNum) + 1,
            hasMore: skipNum + result.resources.length < result.total,
          },
        },
      });
    } catch (error) {
      logger.error('Error retrieving resources by category:', error);
      next(error);
    }
  }

  /**
   * Get available categories
   */
  static async getAvailableCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workplaceId = (req as any).patientUser?.workplaceId; // Optional workplace context

      const categories = await EducationalResourceService.getAvailableCategories(workplaceId);

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      logger.error('Error retrieving available categories:', error);
      next(error);
    }
  }

  /**
   * Get available tags
   */
  static async getAvailableTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '50' } = req.query;
      const workplaceId = (req as any).patientUser?.workplaceId; // Optional workplace context

      const tags = await EducationalResourceService.getAvailableTags(
        workplaceId,
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: { tags },
      });
    } catch (error) {
      logger.error('Error retrieving available tags:', error);
      next(error);
    }
  }

  /**
   * Rate a resource (Patient only)
   */
  static async rateResource(req: PatientResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const { rating } = req.body;
      const workplaceId = req.patientUser?.workplaceId;
      const patientId = req.patientUser?.patientId;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RESOURCE_ID',
            message: 'Invalid resource ID format',
          },
        });
        return;
      }

      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RATING',
            message: 'Rating must be between 1 and 5',
          },
        });
        return;
      }

      const updatedResource = await EducationalResourceService.rateResource(
        new mongoose.Types.ObjectId(resourceId),
        rating,
        { patientId, workplaceId }
      );

      res.json({
        success: true,
        data: {
          resource: {
            id: updatedResource._id,
            title: updatedResource.title,
            ratings: updatedResource.ratings,
          },
        },
        message: 'Resource rated successfully',
      });
    } catch (error) {
      logger.error('Error rating educational resource:', error);
      next(error);
    }
  }

  /**
   * Track resource view (Patient only)
   */
  static async trackResourceView(req: PatientResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const workplaceId = req.patientUser?.workplaceId;
      const patientId = req.patientUser?.patientId;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RESOURCE_ID',
            message: 'Invalid resource ID format',
          },
        });
        return;
      }

      await EducationalResourceService.trackResourceView(
        new mongoose.Types.ObjectId(resourceId),
        { patientId, workplaceId, userType: 'patient' }
      );

      res.json({
        success: true,
        message: 'Resource view tracked successfully',
      });
    } catch (error) {
      logger.error('Error tracking resource view:', error);
      next(error);
    }
  }

  /**
   * Track resource download (Patient only)
   */
  static async trackResourceDownload(req: PatientResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const workplaceId = req.patientUser?.workplaceId;
      const patientId = req.patientUser?.patientId;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RESOURCE_ID',
            message: 'Invalid resource ID format',
          },
        });
        return;
      }

      await EducationalResourceService.trackResourceDownload(
        new mongoose.Types.ObjectId(resourceId),
        { patientId, workplaceId, userType: 'patient' }
      );

      res.json({
        success: true,
        message: 'Resource download tracked successfully',
      });
    } catch (error) {
      logger.error('Error tracking resource download:', error);
      next(error);
    }
  }

  // Admin endpoints for resource management

  /**
   * Get all resources for admin (Workspace Admin only)
   */
  static async getAdminResources(req: AdminResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, limit = '20', skip = '0', page } = req.query;
      const workplaceId = req.user?.workplaceId;

      // Calculate skip from page if provided
      const limitNum = parseInt(limit, 10);
      let skipNum = parseInt(skip, 10);
      if (page) {
        const pageNum = parseInt(page, 10);
        skipNum = (pageNum - 1) * limitNum;
      }

      let query: any = {
        workplaceId,
        isDeleted: false,
      };

      if (category) {
        query.category = category;
      }

      if (status === 'published') {
        query.isPublished = true;
      } else if (status === 'draft') {
        query.isPublished = false;
      }

      const [resources, total] = await Promise.all([
        EducationalResource.find(query)
          .select('title slug description category mediaType difficulty isPublished publishedAt viewCount downloadCount ratings createdAt updatedAt')
          .sort({ createdAt: -1 })
          .skip(skipNum)
          .limit(limitNum)
          .lean(),
        EducationalResource.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          resources,
          pagination: {
            total,
            limit: limitNum,
            skip: skipNum,
            page: page ? parseInt(page, 10) : Math.floor(skipNum / limitNum) + 1,
            hasMore: skipNum + resources.length < total,
          },
        },
      });
    } catch (error) {
      logger.error('Error retrieving admin educational resources:', error);
      next(error);
    }
  }

  /**
   * Create new educational resource (Workspace Admin only)
   */
  static async createResource(req: AdminResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workplaceId = req.user?.workplaceId;
      const createdBy = req.user?._id;

      const resourceData = {
        ...req.body,
        workplaceId,
        createdBy,
      };

      // Generate unique slug
      if (resourceData.title) {
        const baseSlug = resourceData.title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        resourceData.slug = await EducationalResource.ensureUniqueSlug(baseSlug);
      }

      const resource = new EducationalResource(resourceData);
      await resource.save();

      logger.info('Educational resource created', {
        resourceId: resource._id,
        title: resource.title,
        workplaceId,
        createdBy,
      });

      res.status(201).json({
        success: true,
        data: { resource },
        message: 'Educational resource created successfully',
      });
    } catch (error) {
      logger.error('Error creating educational resource:', error);
      next(error);
    }
  }

  /**
   * Update educational resource (Workspace Admin only)
   */
  static async updateResource(req: AdminResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const workplaceId = req.user?.workplaceId;
      const updatedBy = req.user?._id;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RESOURCE_ID',
            message: 'Invalid resource ID format',
          },
        });
        return;
      }

      const resource = await EducationalResource.findOne({
        _id: resourceId,
        workplaceId,
        isDeleted: false,
      });

      if (!resource) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Educational resource not found',
          },
        });
        return;
      }

      // Update fields
      Object.assign(resource, req.body, { updatedBy });

      // Generate new slug if title changed
      if (req.body.title && req.body.title !== resource.title) {
        const baseSlug = req.body.title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        resource.slug = await EducationalResource.ensureUniqueSlug(baseSlug, resource._id);
      }

      await resource.save();

      logger.info('Educational resource updated', {
        resourceId: resource._id,
        title: resource.title,
        workplaceId,
        updatedBy,
      });

      res.json({
        success: true,
        data: { resource },
        message: 'Educational resource updated successfully',
      });
    } catch (error) {
      logger.error('Error updating educational resource:', error);
      next(error);
    }
  }

  /**
   * Delete educational resource (Workspace Admin only)
   */
  static async deleteResource(req: AdminResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const workplaceId = req.user?.workplaceId;
      const updatedBy = req.user?._id;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RESOURCE_ID',
            message: 'Invalid resource ID format',
          },
        });
        return;
      }

      const resource = await EducationalResource.findOne({
        _id: resourceId,
        workplaceId,
        isDeleted: false,
      });

      if (!resource) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Educational resource not found',
          },
        });
        return;
      }

      // Soft delete
      resource.isDeleted = true;
      resource.updatedBy = updatedBy;
      await resource.save();

      logger.info('Educational resource deleted', {
        resourceId: resource._id,
        title: resource.title,
        workplaceId,
        deletedBy: updatedBy,
      });

      res.json({
        success: true,
        message: 'Educational resource deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting educational resource:', error);
      next(error);
    }
  }

  /**
   * Get resource analytics (Workspace Admin only)
   */
  static async getResourceAnalytics(req: AdminResourceRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workplaceId = req.user?.workplaceId;
      const { startDate, endDate } = req.query;

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        };
      }

      const analytics = await EducationalResourceService.getResourceAnalytics(workplaceId, dateRange);

      res.json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      logger.error('Error retrieving resource analytics:', error);
      next(error);
    }
  }
}

export default EducationalResourceController;