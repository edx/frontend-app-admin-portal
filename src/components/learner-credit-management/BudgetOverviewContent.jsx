import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Card, Skeleton } from '@openedx/paragon';

import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import {
  useBudgetDetailHeaderData,
  useBudgetId,
  useSubsidyAccessPolicy,
} from './data';
import BudgetDetailPageOverviewAvailability from './BudgetDetailPageOverviewAvailability';
import BudgetDetailPageOverviewUtilization from './BudgetDetailPageOverviewUtilization';
import BudgetStatusSubtitle from './BudgetStatusSubtitle';
import { ALLOCATE_LEARNING_BUDGETS_TARGETS } from '../ProductTours/AdminOnboardingTours/constants';

const BudgetOverviewContent = ({
  enterpriseUUID,
}) => {
  const intl = useIntl();
  const { subsidyAccessPolicyId } = useBudgetId();

  const { data: subsidyAccessPolicy } = useSubsidyAccessPolicy(subsidyAccessPolicyId);

  const isBnREnabledPolicy = subsidyAccessPolicy?.bnrEnabled || false;

  const {
    budgetId,
    budgetDisplayName,
    budgetTotalSummary,
    budgetAggregates,
    status,
    badgeVariant,
    term,
    date,
    isAssignable,
    isRetired,
  } = useBudgetDetailHeaderData({
    intl,
    subsidyAccessPolicy,
    budgetId: subsidyAccessPolicyId,
  });

  if (!subsidyAccessPolicy) {
    return (
      <div data-testid="budget-detail-skeleton">
        <Skeleton height={180} id={ALLOCATE_LEARNING_BUDGETS_TARGETS.BUDGET_DETAIL_CARD} />
        <span className="sr-only">
          <FormattedMessage
            id="lcm.budget.detail.page.overview.loading"
            defaultMessage="Loading budget header data"
            description="Loading budget header data"
          />
        </span>
      </div>
    );
  }

  return (
    <Card id={ALLOCATE_LEARNING_BUDGETS_TARGETS.BUDGET_DETAIL_CARD}>
      <Card.Section>
        <h2>{budgetDisplayName}</h2>
        <BudgetStatusSubtitle
          badgeVariant={badgeVariant}
          status={status}
          isAssignable={isAssignable}
          isBnREnabled={subsidyAccessPolicy?.bnrEnabled}
          term={term}
          date={date}
          policy={subsidyAccessPolicy}
          enterpriseUUID={enterpriseUUID}
          isRetired={isRetired}
        />
        <BudgetDetailPageOverviewAvailability
          budgetId={budgetId}
          budgetTotalSummary={budgetTotalSummary}
          isAssignable={isAssignable}
          status={status}
        />
        <BudgetDetailPageOverviewUtilization
          budgetId={budgetId}
          budgetTotalSummary={budgetTotalSummary}
          budgetAggregates={budgetAggregates}
          isAssignable={isAssignable}
          isBnREnabledPolicy={isBnREnabledPolicy}
          isRetired={isRetired}
        />
      </Card.Section>
    </Card>
  );
};

const mapStateToProps = state => ({
  enterpriseUUID: state.portalConfiguration.enterpriseId,
  enterpriseFeatures: state.portalConfiguration.enterpriseFeatures,
});

BudgetOverviewContent.propTypes = {
  enterpriseUUID: PropTypes.string.isRequired,
  enterpriseFeatures: PropTypes.shape({
  }).isRequired,
};

export default connect(mapStateToProps)(BudgetOverviewContent);
