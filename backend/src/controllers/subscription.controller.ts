import { Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { query } from '../config/database';
import { AuthRequest, AppError } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 99,
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 199,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
};

export class SubscriptionController {
  async getCurrentSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await query(
        'SELECT * FROM subscriptions WHERE user_id = $1',
        [req.user.id]
      );

      res.json({
        success: true,
        data: result.rows[0] || null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlans(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plans = [
        {
          id: 'free_trial',
          name: 'Free Trial',
          price: 0,
          currency: 'EUR',
          interval: 'month',
          features: [
            '10 notes per month',
            '14-day trial period',
            'Basic SOAP note generation',
            'Text and audio input',
            'PDF/DOCX export',
          ],
          limits: {
            notesPerMonth: 10,
            audioMinutesPerMonth: 30,
          },
        },
        {
          id: 'basic',
          name: 'Basic',
          price: 99,
          currency: 'EUR',
          interval: 'month',
          features: [
            'Unlimited notes',
            '100 minutes audio transcription',
            'All SOAP note templates',
            'Priority email support',
            'Advanced export options',
          ],
          limits: {
            notesPerMonth: null,
            audioMinutesPerMonth: 100,
          },
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 199,
          currency: 'EUR',
          interval: 'month',
          features: [
            'Everything in Basic',
            'Unlimited audio transcription',
            'Custom templates',
            'Priority support',
            'API access (coming soon)',
            'Team collaboration (coming soon)',
          ],
          limits: {
            notesPerMonth: null,
            audioMinutesPerMonth: null,
          },
        },
      ];

      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCheckoutSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { planId } = req.body;

      if (!PLANS[planId as keyof typeof PLANS]) {
        throw new AppError('Invalid plan ID', 400);
      }

      const plan = PLANS[planId as keyof typeof PLANS];

      // Get or create Stripe customer
      let stripeCustomerId: string;
      const subResult = await query(
        'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
        [req.user.id]
      );

      if (subResult.rows[0]?.stripe_customer_id) {
        stripeCustomerId = subResult.rows[0].stripe_customer_id;
      } else {
        const userResult = await query('SELECT email, name FROM users WHERE id = $1', [
          req.user.id,
        ]);
        const user = userResult.rows[0];

        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: req.user.id },
        });

        stripeCustomerId = customer.id;
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL}/subscription?success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
        metadata: {
          userId: req.user.id,
          planId,
        },
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createPortalSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await query(
        'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
        [req.user.id]
      );

      if (!result.rows[0]?.stripe_customer_id) {
        throw new AppError('No active subscription found', 404);
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: result.rows[0].stripe_customer_id,
        return_url: `${process.env.FRONTEND_URL}/subscription`,
      });

      res.json({
        success: true,
        data: {
          url: session.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUsage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const result = await query(
        'SELECT * FROM usage_tracking WHERE user_id = $1 AND month = $2',
        [req.user.id, month]
      );

      const usage = result.rows[0] || {
        notes_count: 0,
        audio_minutes: 0,
      };

      res.json({
        success: true,
        data: {
          id: usage.id,
          userId: req.user.id,
          month,
          notesCount: usage.notes_count,
          audioMinutes: parseFloat(usage.audio_minutes),
          createdAt: usage.created_at,
          updatedAt: usage.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sig = req.headers['stripe-signature'] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err: any) {
        throw new AppError(`Webhook Error: ${err.message}`, 400);
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleCheckoutCompleted(session);
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionUpdate(subscription);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    await query(
      `UPDATE subscriptions
       SET stripe_customer_id = $1,
           stripe_subscription_id = $2,
           status = $3,
           updated_at = NOW()
       WHERE user_id = $4`,
      [session.customer, session.subscription, 'active', userId]
    );

    // Update user subscription tier
    const planId = session.metadata?.planId;
    if (planId) {
      await query(
        'UPDATE users SET subscription_tier = $1 WHERE id = $2',
        [planId, userId]
      );
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    await query(
      `UPDATE subscriptions
       SET status = $1,
           current_period_start = to_timestamp($2),
           current_period_end = to_timestamp($3),
           cancel_at_period_end = $4,
           updated_at = NOW()
       WHERE stripe_subscription_id = $5`,
      [
        subscription.status,
        subscription.current_period_start,
        subscription.current_period_end,
        subscription.cancel_at_period_end,
        subscription.id,
      ]
    );
  }
}

export default new SubscriptionController();
