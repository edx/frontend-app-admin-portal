import { useId } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import dayjs from 'dayjs';
import classNames from 'classnames';
import {
  Card,
  Button,
  Badge,
  Stack,
} from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { BUDGET_STATUSES, BUDGET_TYPES, ROUTE_NAMES } from '../EnterpriseApp/data/constants';
import {
  getBudgetStatus, getTranslatedBudgetStatus, getTranslatedBudgetTerm, useTopUpEligibility,
} from './data';
import { isTopUpCandidate, isBudgetRetiredOrExpired } from './data/utils';
import { useEnterpriseBudgets } from '../EnterpriseSubsidiesContext/data/hooks';
import SubBudgetCardUtilization from './SubBudgetCardUtilization';
import { ALLOCATE_LEARNING_BUDGETS_TARGETS } from '../ProductTours/AdminOnboardingTours/constants';
import AddFundsButton from './add-funds/AddFundsButton';
import AddFundsIneligibleStatus from './add-funds/AddFundsIneligibleStatus';

const BaseBackgroundFetchingWrapper = ({
  enterpriseId,
  enablePortalLearnerCreditManagementScreen,
  children,
}) => {
  const { isFetching: isFetchingBudgets } = useEnterpriseBudgets({
    enablePortalLearnerCreditManagementScreen,
    enterpriseId,
  });
  return <span style={{ opacity: isFetchingBudgets ? 0.5 : 1 }}>{children}</span>;
};

BaseBackgroundFetchingWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  enterpriseId: PropTypes.string.isRequired,
  enablePortalLearnerCreditManagementScreen: PropTypes.bool.isRequired,
};

BaseBackgroundFetchingWrapper.defaultProps = {
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
  enablePortalLearnerCreditManagementScreen: state.portalConfiguration.enablePortalLearnerCreditManagementScreen,
});

const BackgroundFetchingWrapper = connect(mapStateToProps)(BaseBackgroundFetchingWrapper);

const BaseSubBudgetCard = ({
  id,
  start,
  end,
  available,
  pending,
  spent,
  displayName,
  enterpriseSlug,
  enterpriseId,
  enablePortalLearnerCreditManagementScreen,
  isLoading,
  isAssignable,
  isBnREnabled,
  isRetired,
  retiredAt,
  source,
}) => {
  const { isFetching: isFetchingBudgets } = useEnterpriseBudgets({
    enablePortalLearnerCreditManagementScreen,
    enterpriseId,
  });
  const intl = useIntl();
  const budgetLabel = getBudgetStatus({
    intl,
    startDateStr: start,
    endDateStr: end,
    isBudgetRetired: isRetired,
    retiredDateStr: retiredAt,
  });
  const {
    status, term, badgeVariant, date,
  } = budgetLabel;
  const formattedDate = date ? intl.formatDate(
    dayjs(date).toDate(),
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
  ) : undefined;
  const isRetiredOrExpired = isBudgetRetiredOrExpired(status);
  const showActions = status !== BUDGET_STATUSES.scheduled;
  const showAddFunds = showActions && isTopUpCandidate({ isPolicy: source === BUDGET_TYPES.policy, status });
  // Every card shares one eligibility request, and the card doesn't wait for it to render.
  const { data: cachedTopUpEligibility, isError: isTopUpEligibilityError } = useTopUpEligibility({
    enterpriseId,
    policyUuid: id,
    enabled: showAddFunds,
  });
  // React Query keeps the last good row when a background refetch fails; treat any error as no row.
  const topUpEligibility = isTopUpEligibilityError ? null : cachedTopUpEligibility;
  const addFundsReasonsId = useId();
  const showAddFundsReasons = showAddFunds && topUpEligibility?.isEligible === false;

  const hasBudgetAggregatesSection = () => {
    const statusesWithoutAggregates = [
      BUDGET_STATUSES.scheduled,
    ];
    return !statusesWithoutAggregates.includes(status);
  };

  const renderActions = (budgetId) => (
    <Stack direction="horizontal" gap={2}>
      {showAddFunds && (
        <AddFundsButton
          enterpriseSlug={enterpriseSlug}
          budgetId={budgetId}
          eligibility={topUpEligibility}
          reasonsId={addFundsReasonsId}
        />
      )}
      <Button
        data-testid="view-budget"
        id={ALLOCATE_LEARNING_BUDGETS_TARGETS.VIEW_BUDGET}
        as={Link}
        to={`/${enterpriseSlug}/admin/${ROUTE_NAMES.learnerCredit}/${budgetId}`}
        variant={isRetiredOrExpired ? 'outline-primary' : 'primary'}
      >
        {isRetiredOrExpired ? (
          <FormattedMessage
            id="lcm.budgets.budget.card.view.budget.history"
            defaultMessage="View budget history"
            description="Button text to view budget history"
          />
        ) : (
          <FormattedMessage
            id="lcm.budgets.budget.card.view.budget"
            defaultMessage="View budget"
            description="Button text to view a budget"
          />
        )}
      </Button>
    </Stack>
  );

  const renderCardHeader = (budgetType, budgetId) => {
    const subtitle = (
      <Stack direction="horizontal" gap={2.5}>
        <Badge variant={badgeVariant}>{getTranslatedBudgetStatus(intl, status)}</Badge>
        {(term && formattedDate) && (
          <span data-testid="budget-date">
            {getTranslatedBudgetTerm(intl, term)} {formattedDate}
          </span>
        )}
      </Stack>
    );

    return (
      <Card.Header
        title={<BackgroundFetchingWrapper>{budgetType}</BackgroundFetchingWrapper>}
        subtitle={<BackgroundFetchingWrapper>{subtitle}</BackgroundFetchingWrapper>}
        actions={showActions ? renderActions(budgetId) : undefined}
        className={classNames('align-items-center', { 'mb-4.5': !hasBudgetAggregatesSection() })}
      />
    );
  };

  return (
    <Card
      orientation="horizontal"
      isLoading={isLoading}
      data-testid="balance-detail-section"
    >
      <Card.Body>
        <Stack gap={4.5}>
          {renderCardHeader(displayName || 'Overview', id)}
          {hasBudgetAggregatesSection() && (
            <SubBudgetCardUtilization
              isFetchingBudgets={isFetchingBudgets}
              isAssignable={isAssignable}
              isBnREnabled={isBnREnabled}
              status={status}
              available={available}
              pending={pending}
              spent={spent}
            />
          )}
        </Stack>
        {showAddFundsReasons && (
          <AddFundsIneligibleStatus id={addFundsReasonsId} reasons={topUpEligibility.reasons} />
        )}
      </Card.Body>
    </Card>
  );
};

BaseSubBudgetCard.propTypes = {
  enterpriseSlug: PropTypes.string.isRequired,
  enterpriseId: PropTypes.string.isRequired,
  enablePortalLearnerCreditManagementScreen: PropTypes.bool.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  start: PropTypes.string,
  end: PropTypes.string,
  spent: PropTypes.number,
  isLoading: PropTypes.bool,
  available: PropTypes.number,
  pending: PropTypes.number,
  displayName: PropTypes.string,
  isAssignable: PropTypes.bool,
  isBnREnabled: PropTypes.bool,
  isRetired: PropTypes.bool,
  retiredAt: PropTypes.string,
  source: PropTypes.oneOf(Object.values(BUDGET_TYPES)),
};

BaseSubBudgetCard.defaultProps = {
};

export default connect(mapStateToProps)(BaseSubBudgetCard);
