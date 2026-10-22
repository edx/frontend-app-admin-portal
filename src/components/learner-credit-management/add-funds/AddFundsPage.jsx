import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { Skeleton, Stack } from '@openedx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

import { features } from '../../../config';
import { ROUTE_NAMES } from '../../EnterpriseApp/data/constants';
import NotFoundPage from '../../NotFoundPage';
import { canTopUpBudget, useBudgetId, useSubsidyAccessPolicy } from '../data';
import BudgetDetailPageWrapper from '../BudgetDetailPageWrapper';
import AddFundsBreadcrumbs from './AddFundsBreadcrumbs';
import AddFundsStepper from './AddFundsStepper';
import { ADD_FUNDS_ROUTE_SEGMENT, AddFundsContextProvider } from './data';

/**
 * Route entry point for the Learner Credit Top Up ("Add Funds") flow at
 * `/:enterpriseSlug/admin/learner-credit/:budgetId/add-funds/:step?`. Each step has its own URL;
 * step-level redirects are handled by `AddFundsStepper`. Budgets that fail `canTopUpBudget`
 * redirect back to budget detail.
 */
const AddFundsPage = ({ enterpriseSlug }) => {
  const navigate = useNavigate();
  const { budgetId, subsidyAccessPolicyId } = useBudgetId();
  const {
    data: subsidyAccessPolicy,
    isInitialLoading,
    isError,
    error,
  } = useSubsidyAccessPolicy(subsidyAccessPolicyId);
  const learnerCreditPath = `/${enterpriseSlug}/admin/${ROUTE_NAMES.learnerCredit}`;
  const budgetDetailPath = `${learnerCreditPath}/${budgetId}`;
  const addFundsBasePath = `${budgetDetailPath}/${ADD_FUNDS_ROUTE_SEGMENT}`;

  if (!features.TOP_UP_LEARNER_CREDIT || !subsidyAccessPolicyId) {
    return <Navigate to={budgetDetailPath} replace />;
  }

  if (isInitialLoading || (!subsidyAccessPolicy && !isError)) {
    return (
      <BudgetDetailPageWrapper>
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

  // A failed background refetch keeps the cached budget; only an initial load failure exits the flow.
  if (isError && !subsidyAccessPolicy) {
    if (error?.customAttributes?.httpErrorStatus === 404) {
      return <NotFoundPage />;
    }
    return <Navigate to={budgetDetailPath} replace />;
  }

  if (!canTopUpBudget({ isPolicy: true, status: subsidyAccessPolicy.status })) {
    return <Navigate to={budgetDetailPath} replace />;
  }

  return (
    <BudgetDetailPageWrapper subsidyAccessPolicy={subsidyAccessPolicy}>
      <Stack gap={3}>
        <AddFundsBreadcrumbs
          learnerCreditPath={learnerCreditPath}
          budgetDetailPath={budgetDetailPath}
          budgetDisplayName={subsidyAccessPolicy.displayName}
        />
        {/* Keyed by budget so selections don't carry over when only `:budgetId` changes. */}
        <AddFundsContextProvider key={budgetId} basePath={addFundsBasePath}>
          <AddFundsStepper
            currentBalance={subsidyAccessPolicy.aggregates?.spendAvailableUsd ?? 0}
            expirationDate={subsidyAccessPolicy.subsidyExpirationDatetime}
            onExit={() => navigate(budgetDetailPath, { replace: true })}
          />
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
