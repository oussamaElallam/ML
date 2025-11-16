import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { subscriptionService } from '../services/subscription.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Check,
  Loader2,
  CreditCard,
  TrendingUp,
  Clock,
} from 'lucide-react';
import type { SubscriptionPlan, Subscription, UsageTracking } from '../types';

export function SubscriptionPage() {
  const { user, subscription, setSubscription } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<UsageTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansData, currentSub, usageData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getCurrentUsage(),
      ]);

      setPlans(plansData);
      if (currentSub) {
        setSubscription(currentSub);
      }
      setUsage(usageData);
    } catch (error) {
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true);
    try {
      const { url } = await subscriptionService.createCheckoutSession(planId);
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to start checkout');
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await subscriptionService.createPortalSession();
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to open billing portal');
    }
  };

  const defaultPlans: SubscriptionPlan[] = [
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

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Subscription & Billing
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your subscription and view usage statistics
          </p>
        </div>

        {/* Current Plan */}
        {subscription && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Current Plan
              </h2>
              <button
                onClick={handleManageBilling}
                className="btn-outline inline-flex items-center space-x-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>Manage Billing</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-lg font-semibold text-gray-900 capitalize mt-1">
                  {user?.subscriptionTier?.replace('_', ' ')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-green-600 capitalize mt-1">
                  {subscription.status}
                </p>
              </div>

              {subscription.currentPeriodEnd && (
                <div>
                  <p className="text-sm text-gray-600">Renews On</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {format(new Date(subscription.currentPeriodEnd), 'PPP')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usage Stats */}
        {usage && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              This Month's Usage
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Notes Generated</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usage.notesCount}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Audio Minutes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(usage.audioMinutes)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Available Plans
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayPlans.map((plan) => {
              const isCurrentPlan =
                user?.subscriptionTier === plan.id ||
                (plan.id === 'free_trial' && user?.subscriptionTier === 'free_trial');

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow-md p-6 ${
                    plan.id === 'pro'
                      ? 'ring-2 ring-primary-600 relative'
                      : 'border border-gray-200'
                  }`}
                >
                  {plan.id === 'pro' && (
                    <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      POPULAR
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>

                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      €{plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full btn-secondary cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isUpgrading}
                      className="w-full btn-primary"
                    >
                      {isUpgrading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : plan.price === 0 ? (
                        'Start Free Trial'
                      ) : (
                        'Upgrade'
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">
                Can I cancel anytime?
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Yes, you can cancel your subscription at any time. Your access
                will continue until the end of your billing period.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">
                Is my data secure?
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Absolutely. We are HIPAA-compliant and use enterprise-grade
                encryption for all data at rest and in transit.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">
                What happens when I exceed my limits?
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                You'll be notified when approaching your limits. For the free
                trial, you'll need to upgrade. Paid plans have soft limits with
                overage options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
