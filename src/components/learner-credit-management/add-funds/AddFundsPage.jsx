import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { Skeleton, Stack } from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { features } from '../../../config';
import { BUDGET_STATUSES, ROUTE_NAMES } from '../../EnterpriseApp/data/constants';
import NotFoundPage from '../../NotFoundPage';
import { getBudgetStatus, useBudgetId, useSubsidyAccessPolicy } from '../data';
import BudgetDetailPageWrapper from '../BudgetDetailPageWrapper';
import AddFundsBreadcrumbs from './AddFundsBreadcrumbs';
import AddFundsStepper from './AddFundsStepper';
import { ADD_FUNDS_ROUTE_SEGMENT, AddFundsContextProvider } from './data';

/**
 * Route entry point for the Learner Credit Top Up ("Add Funds") flow at
 * `/:enterpriseSlug/admin/learner-credit/:budgetId/add-funds/:step?`. Each step has its own URL;
 * step-level redirects (unknown or not-yet-reachable steps) are handled by `AddFundsStepper`.
 *
 * Mirrors the `canAddFunds` rules in `SubBudgetCard`: users who reach this route for a budget
 * that can't be topped up (flag off, non-policy, scheduled, retired or expired) are redirected
 * back to the budget detail page.
 */
const AddFundsPage = ({ enterpriseSlug }) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { budgetId, subsidyAccessPolicyId } = useBudgetId();
  const {
    data: subsidyAccessPolicy,
    isInitialLoading,
    isError,
    error,
  } = useSubsidyAccessPolicy(subsidyAccessPolicyId);
  const budgetDetailPath = `/${enterpriseSlug}/admin/${ROUTE_NAMES.learnerCredit}/${budgetId}`;
  const addFundsBasePath = `${budgetDetailPath}/${ADD_FUNDS_ROUTE_SEGMENT}`;

  if (!features.TOP_UP_LEARNER_CREDIT || !subsidyAccessPolicyId) {
    return <Navigate to={budgetDetailPath} replace />;
  }

  if (isInitialLoading || (!subsidyAccessPolicy && !isError)) {
    return (
      <BudgetDetailPageWrapper includeHero={false}>
        <Skeleton height={25} />
        <Skeleton height={60} />
        <Skeleton height={360} />
        <span className="sr-only">
          <FormattedMessage
            id="lcm.budget.add.funds.loading"
            defaultMessage="Loading add funds"
            description="Screen reader text while the Add Funds page is loading"
          />
        </span>
      </BudgetDetailPageWrapper>
    );
  }

  if (isError) {
    if (error?.customAttributes?.httpErrorStatus === 404) {
      return <NotFoundPage />;
    }
    return <Navigate to={budgetDetailPath} replace />;
  }

  const { status } = getBudgetStatus({
    intl,
    startDateStr: subsidyAccessPolicy.subsidyActiveDatetime,
    endDateStr: subsidyAccessPolicy.subsidyExpirationDatetime,
    isBudgetRetired: subsidyAccessPolicy.retired,
  });
  if (subsidyAccessPolicy.isRetiredOrExpired || status === BUDGET_STATUSES.scheduled) {
    return <Navigate to={budgetDetailPath} replace />;
  }

  return (
    <BudgetDetailPageWrapper subsidyAccessPolicy={subsidyAccessPolicy}>
      <Stack gap={3}>
        <AddFundsBreadcrumbs
          budgetId={budgetId}
          budgetDisplayName={subsidyAccessPolicy.displayName || 'Overview'}
        />
        <AddFundsContextProvider basePath={addFundsBasePath}>
          <AddFundsStepper onExit={() => navigate(budgetDetailPath)} />
        </AddFundsContextProvider>
      </Stack>
    </BudgetDetailPageWrapper>
  );
};

AddFundsPage.propTypes = {
  enterpriseSlug: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseSlug: state.portalConfiguration.enterpriseSlug,
});

export default connect(mapStateToProps)(AddFundsPage);
