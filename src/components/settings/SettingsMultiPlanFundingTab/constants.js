import { ROUTE_NAMES } from '../../EnterpriseApp/data/constants';

// Settings tab key / route segment for multi-plan learner credit funding (ENT-12446).
export const MULTI_PLAN_FUNDING_TAB = 'multi_plan_funding';

// Admin onboarding tour target: the "Multi-plan funding" settings tab title.
export const MULTI_PLAN_FUNDING_TAB_TOUR_TARGET = 'multi-plan-funding-settings-tab';

export const getMultiPlanFundingPlansPath = (enterpriseSlug) => `/${enterpriseSlug}/admin/settings/${MULTI_PLAN_FUNDING_TAB}`;

export const getMultiPlanFundingPlanPath = (enterpriseSlug, planId) => (
  `${getMultiPlanFundingPlansPath(enterpriseSlug)}/${planId}`
);

// Budget detail ("View budget") page in Learner Credit Management; the plan name in the plans table links here.
export const getBudgetDetailPath = (enterpriseSlug, planId) => (
  `/${enterpriseSlug}/admin/${ROUTE_NAMES.learnerCredit}/${planId}`
);
