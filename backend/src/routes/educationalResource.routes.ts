import { Router } from 'express';
import { body, param, query } from 'express-validator';
import EducationalResourceController from '../controllers/educationalResourceController';
import { patientAuth } from '../middlewares/patientAuth';
import { workspaceAuth } from '../middlewares/workspaceAuth';
import { validateRequest } from '../middlewares/validateRequest';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Validation schemas
const resourceSearchValidation = [
  query('category')
    .optional()
    .isIn(['medication', 'condition', 'wellness', 'faq', 'prevention', 'nutrition', 'lifestyle'])
    .withMessage('Invalid category'),
  query('mediaType')
    .optional()
    .isIn(['article', 'video', 'infographic', 'pdf', 'audio', 'interactive'])
    .withMessage('Invalid media type'),
  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  query('language')
    .optional()
    .isIn(['en', 'yo', 'ig', 'ha', 'fr'])
    .withMessage('Invalid language'),
  query('localizedFor')
    .optional()
    .isIn(['nigeria', 'general', 'west_africa'])
    .withMessage('Invalid localization'),
  query('sortBy')
    .optional()
    .isIn(['relevance', 'popularity', 'newest', 'rating'])
    .withMessage('Invalid sort option'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
];

const slugValidation = [
  param('slug')
    .isLength({ min: 1, max: 200 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid slug format'),
];

const categoryValidation = [
  param('category')
    .isIn(['medication', 'condition', 'wellness', 'faq', 'prevention', 'nutrition', 'lifestyle'])
    .withMessage('Invalid category'),
];

const resourceIdValidation = [
  param('resourceId')
    .isMongoId()
    .withMessage('Invalid resource ID'),
];

const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
];

const createResourceValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),
  body('content')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('category')
    .isIn(['medication', 'condition', 'wellness', 'faq', 'prevention', 'nutrition', 'lifestyle'])
    .withMessage('Invalid category'),
  body('mediaType')
    .isIn(['article', 'video', 'infographic', 'pdf', 'audio', 'interactive'])
    .withMessage('Invalid media type'),
  body('tags')
    .optional()
    .isArray({ max: 15 })
    .withMessage('Tags must be an array with maximum 15 items'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('language')
    .optional()
    .isIn(['en', 'yo', 'ig', 'ha', 'fr'])
    .withMessage('Invalid language'),
  body('localizedFor')
    .optional()
    .isIn(['nigeria', 'general', 'west_africa'])
    .withMessage('Invalid localization'),
  body('accessLevel')
    .optional()
    .isIn(['public', 'patient_only', 'premium', 'staff_only'])
    .withMessage('Invalid access level'),
  body('mediaUrl')
    .optional()
    .isURL()
    .withMessage('Media URL must be a valid URL'),
  body('thumbnail')
    .optional()
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 86400 })
    .withMessage('Duration must be between 1 second and 24 hours'),
  body('fileSize')
    .optional()
    .isInt({ min: 1, max: 104857600 })
    .withMessage('File size must be between 1 byte and 100MB'),
  body('targetAudience.conditions')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Target conditions must be an array with maximum 20 items'),
  body('targetAudience.medications')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Target medications must be an array with maximum 20 items'),
  body('targetAudience.ageGroups')
    .optional()
    .isArray()
    .withMessage('Target age groups must be an array'),
  body('targetAudience.ageGroups.*')
    .optional()
    .isIn(['child', 'teen', 'adult', 'senior'])
    .withMessage('Invalid age group'),
  body('targetAudience.demographics')
    .optional()
    .isArray()
    .withMessage('Target demographics must be an array'),
  body('targetAudience.demographics.*')
    .optional()
    .isIn(['male', 'female', 'pregnant', 'elderly'])
    .withMessage('Invalid demographic'),
  body('sources')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Sources must be an array with maximum 10 items'),
  body('sources.*.title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Source title must be between 1 and 200 characters'),
  body('sources.*.url')
    .optional()
    .isURL()
    .withMessage('Source URL must be a valid URL'),
  body('sources.*.author')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Source author must be between 1 and 100 characters'),
  body('sources.*.type')
    .optional()
    .isIn(['journal', 'website', 'book', 'guideline', 'study'])
    .withMessage('Invalid source type'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
];

const updateResourceValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),
  body('content')
    .optional()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('category')
    .optional()
    .isIn(['medication', 'condition', 'wellness', 'faq', 'prevention', 'nutrition', 'lifestyle'])
    .withMessage('Invalid category'),
  body('mediaType')
    .optional()
    .isIn(['article', 'video', 'infographic', 'pdf', 'audio', 'interactive'])
    .withMessage('Invalid media type'),
  body('tags')
    .optional()
    .isArray({ max: 15 })
    .withMessage('Tags must be an array with maximum 15 items'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('accessLevel')
    .optional()
    .isIn(['public', 'patient_only', 'premium', 'staff_only'])
    .withMessage('Invalid access level'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
];

// Public routes (no authentication required)
router.get(
  '/public',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  resourceSearchValidation,
  validateRequest,
  EducationalResourceController.getPublicResources
);

router.get(
  '/public/slug/:slug',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 requests per 15 minutes
  slugValidation,
  validateRequest,
  EducationalResourceController.getPublicResourceBySlug
);

router.get(
  '/public/popular',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  validateRequest,
  EducationalResourceController.getPopularResources
);

router.get(
  '/public/category/:category',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  categoryValidation,
  query('language').optional().isIn(['en', 'yo', 'ig', 'ha', 'fr']).withMessage('Invalid language'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be non-negative'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  validateRequest,
  EducationalResourceController.getResourcesByCategory
);

router.get(
  '/public/categories',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  EducationalResourceController.getAvailableCategories
);

router.get(
  '/public/tags',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  EducationalResourceController.getAvailableTags
);

// Patient routes (require patient authentication)
router.get(
  '/patient',
  patientAuth,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // Higher limit for authenticated users
  resourceSearchValidation,
  validateRequest,
  EducationalResourceController.getPatientResources
);

router.get(
  '/patient/slug/:slug',
  patientAuth,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }),
  slugValidation,
  validateRequest,
  EducationalResourceController.getPatientResourceBySlug
);

router.get(
  '/patient/recommendations',
  patientAuth,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('includeGeneral').optional().isBoolean().withMessage('includeGeneral must be boolean'),
  validateRequest,
  EducationalResourceController.getPatientRecommendations
);

router.post(
  '/patient/:resourceId/rate',
  patientAuth,
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }), // 10 ratings per hour
  resourceIdValidation,
  ratingValidation,
  validateRequest,
  EducationalResourceController.rateResource
);

router.post(
  '/patient/:resourceId/view',
  patientAuth,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  resourceIdValidation,
  validateRequest,
  EducationalResourceController.trackResourceView
);

router.post(
  '/patient/:resourceId/download',
  patientAuth,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  resourceIdValidation,
  validateRequest,
  EducationalResourceController.trackResourceDownload
);

// Admin routes (require workspace admin authentication)
router.get(
  '/admin',
  workspaceAuth,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 500 }), // Higher limit for admin users
  query('category').optional().isIn(['medication', 'condition', 'wellness', 'faq', 'prevention', 'nutrition', 'lifestyle']),
  query('status').optional().isIn(['published', 'draft', 'all']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('skip').optional().isInt({ min: 0 }),
  query('page').optional().isInt({ min: 1 }),
  validateRequest,
  EducationalResourceController.getAdminResources
);

router.post(
  '/admin',
  workspaceAuth,
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 50 }), // 50 creates per hour
  createResourceValidation,
  validateRequest,
  EducationalResourceController.createResource
);

router.put(
  '/admin/:resourceId',
  workspaceAuth,
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 100 }), // 100 updates per hour
  resourceIdValidation,
  updateResourceValidation,
  validateRequest,
  EducationalResourceController.updateResource
);

router.delete(
  '/admin/:resourceId',
  workspaceAuth,
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }), // 20 deletes per hour
  resourceIdValidation,
  validateRequest,
  EducationalResourceController.deleteResource
);

router.get(
  '/admin/analytics',
  workspaceAuth,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
  validateRequest,
  EducationalResourceController.getResourceAnalytics
);

export default router;