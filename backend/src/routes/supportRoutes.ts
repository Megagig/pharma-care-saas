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

export default router;
