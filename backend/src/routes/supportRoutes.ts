import express from 'express';
import { supportController } from '../controllers/supportController';
import { auth } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Ticket Management Routes
router.post('/tickets', 
  requireRole('super_admin', 'admin', 'support_agent', 'user'), 
  supportController.createTicket.bind(supportController)
);

router.get('/tickets', 
  requireRole('super_admin', 'admin', 'support_agent'), 
  supportController.getTickets.bind(supportController)
);

router.get('/tickets/:ticketId', 
  requireRole('super_admin', 'admin', 'support_agent', 'user'), 
  supportController.getTicketById.bind(supportController)
);

router.put('/tickets/:ticketId/assign', 
  requireRole('super_admin', 'admin', 'support_agent'), 
  supportController.assignTicket.bind(supportController)
);

router.put('/tickets/:ticketId/status', 
  requireRole('super_admin', 'admin', 'support_agent'), 
  supportController.updateTicketStatus.bind(supportController)
);

router.put('/tickets/:ticketId/escalate', 
  requireRole('super_admin', 'admin', 'support_agent'), 
  supportController.escalateTicket.bind(supportController)
);

router.post('/tickets/:ticketId/comments', 
  requireRole('super_admin', 'admin', 'support_agent', 'user'), 
  supportController.addComment.bind(supportController)
);

router.get('/tickets/:ticketId/comments', 
  requireRole('super_admin', 'admin', 'support_agent', 'user'), 
  supportController.getTicketComments.bind(supportController)
);

router.post('/knowledge-base/articles', 
  requireRole('super_admin', 'admin', 'support_agent'), 
  supportController.createArticle.bind(supportController)
);

router.get('/knowledge-base/articles', 
  requireRole('super_admin', 'admin', 'support_agent', 'user'), 
  supportController.getArticles.bind(supportController)
);

router.get('/knowledge-base/search', 
  requireRole('super_admin', 'admin', 'support_agent', 'user'), 
  supportController.searchArticles.bind(supportController)
);

router.get('/metrics', 
  requireRole('super_admin', 'admin'), 
  supportController.getSupportMetrics.bind(supportController)
);

router.get('/analytics', 
  requireRole('super_admin', 'admin'), 
  supportController.getSupportAnalytics.bind(supportController)
);

// Help System Routes

// Public help content routes (for pharmacists, admins, super admins)
router.get('/help/content', 
  requireRole('super_admin', 'admin', 'pharmacist', 'owner', 'user'), 
  supportController.getHelpContent.bind(supportController)
);

router.get('/help/categories', 
  requireRole('super_admin', 'admin', 'pharmacist', 'owner', 'user'), 
  supportController.getHelpCategories.bind(supportController)
);

router.post('/help/feedback', 
  requireRole('super_admin', 'admin', 'pharmacist', 'owner', 'user'), 
  supportController.submitHelpFeedback.bind(supportController)
);

router.get('/help/manual/pdf', 
  requireRole('super_admin', 'admin', 'pharmacist', 'owner', 'user'), 
  supportController.generatePDFManual.bind(supportController)
);

// Super Admin only routes
router.get('/help/settings', 
  requireRole('super_admin'), 
  supportController.getHelpSettings.bind(supportController)
);

router.put('/help/settings', 
  requireRole('super_admin'), 
  supportController.updateHelpSettings.bind(supportController)
);

router.get('/help/analytics', 
  requireRole('super_admin'), 
  supportController.getHelpAnalytics.bind(supportController)
);

// FAQ Management (Super Admin only)
router.post('/help/faqs', 
  requireRole('super_admin'), 
  supportController.createFAQ.bind(supportController)
);

router.put('/help/faqs/:id', 
  requireRole('super_admin'), 
  supportController.updateFAQ.bind(supportController)
);

router.delete('/help/faqs/:id', 
  requireRole('super_admin'), 
  supportController.deleteFAQ.bind(supportController)
);

// Video Management (Super Admin only)
router.post('/help/videos', 
  requireRole('super_admin'), 
  supportController.createVideo.bind(supportController)
);

router.put('/help/videos/:id', 
  requireRole('super_admin'), 
  supportController.updateVideo.bind(supportController)
);

router.delete('/help/videos/:id', 
  requireRole('super_admin'), 
  supportController.deleteVideo.bind(supportController)
);

// Feedback Management (Super Admin only)
router.get('/help/feedback', 
  requireRole('super_admin'), 
  supportController.getAllFeedback.bind(supportController)
);

router.put('/help/feedback/:id/respond', 
  requireRole('super_admin'), 
  supportController.respondToFeedback.bind(supportController)
);

export default router;
