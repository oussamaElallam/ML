import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/plans', subscriptionController.getPlans.bind(subscriptionController));
router.post('/webhook', subscriptionController.handleWebhook.bind(subscriptionController));

// Authenticated routes
router.use(authenticate);

router.get('/', subscriptionController.getCurrentSubscription.bind(subscriptionController));
router.post('/create-checkout', subscriptionController.createCheckoutSession.bind(subscriptionController));
router.post('/create-portal-session', subscriptionController.createPortalSession.bind(subscriptionController));
router.get('/usage', subscriptionController.getCurrentUsage.bind(subscriptionController));

export default router;
