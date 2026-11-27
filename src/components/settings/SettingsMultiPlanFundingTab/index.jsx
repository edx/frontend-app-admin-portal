import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Alert, Button, DataTable } from '@openedx/paragon';
import { Error as ErrorIcon } from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { formatDate, formatPrice } from '../../learner-credit-management/data';
import { useMultiPlanFundingPlans } from './data/hooks';
import MultiPlanFundingHelpLink from './MultiPlanFundingHelpLink';
import MultiPlanPoolStatusBadge from './MultiPlanPoolStatusBadge';
import { getBudgetDetailPath, getMultiPlanFundingPlanPath } from './constants';
import { MULTI_PLAN_FUNDING_SETTINGS_TARGETS } from '../../ProductTours/AdminOnboardingTours/constants';
import messages from './messages';

const planRowPropType = PropTypes.shape({
  index: PropTypes.number,
  original: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
    expires: PropTypes.string,
    isMultiPlanEligible: PropTypes.bool.isRequired,
    canJoinPool: PropTypes.bool.isRequired,
    fundingSettingsPath: PropTypes.string.isRequired,
    budgetDetailPath: PropTypes.string.isRequired,
  }).isRequired,
}).isRequired;

const PlanNameCell = ({ row }) => (
  <Link to={row.original.budgetDetailPath}>{row.original.name}</Link>
);
PlanNameCell.propTypes = { row: planRowPropType };

const BalanceCell = ({ row }) => formatPrice(row.original.balance);
BalanceCell.propTypes = { row: planRowPropType };

const PoolStatusCell = ({ row }) => (
  <MultiPlanPoolStatusBadge
    canJoinPool={row.original.canJoinPool}
    isMultiPlanEligible={row.original.isMultiPlanEligible}
  />
);
PoolStatusCell.propTypes = { row: planRowPropType };

const ExpiresCell = ({ row }) => (row.original.expires ? formatDate(row.original.expires, 'MMMM D, YYYY') : null);
ExpiresCell.propTypes = { row: planRowPropType };

const FundingSettingsCell = ({ row }) => {
  const intl = useIntl();
  return (
    <Button
      as={Link}
      to={row.original.fundingSettingsPath}
      variant="outline-primary"
      size="sm"
      id={row.index === 0 ? MULTI_PLAN_FUNDING_SETTINGS_TARGETS.FIRST_ACTION : undefined}
      aria-label={intl.formatMessage(messages.fundingSettingsButtonAriaLabel, { planName: row.original.name })}
    >
      <FormattedMessage {...messages.fundingSettingsButton} />
    </Button>
  );
};
FundingSettingsCell.propTypes = { row: planRowPropType };

/**
 * Settings > Multi-plan funding (ENT-12446). Lists the customer's active learner credit plans with their
 * multi-plan pool status and a link to each plan's funding settings.
 */
const SettingsMultiPlanFundingTab = ({ enterpriseId, enterpriseSlug }) => {
  const intl = useIntl();
  const { data: plans, isLoading, isError } = useMultiPlanFundingPlans(enterpriseId);

  const rows = useMemo(() => (plans || []).map(plan => ({
    ...plan,
    fundingSettingsPath: getMultiPlanFundingPlanPath(enterpriseSlug, plan.id),
    budgetDetailPath: getBudgetDetailPath(enterpriseSlug, plan.id),
  })), [plans, enterpriseSlug]);

  return (
    <section>
      <p id={MULTI_PLAN_FUNDING_SETTINGS_TARGETS.TAB_DESCRIPTION} className="mb-2">
        <FormattedMessage {...messages.tabDescription} />
      </p>
      <p className="mb-4">
        <MultiPlanFundingHelpLink />
      </p>
      {isError ? (
        <Alert variant="danger" icon={ErrorIcon}>
          <FormattedMessage {...messages.loadError} />
        </Alert>
      ) : (
        <div id={MULTI_PLAN_FUNDING_SETTINGS_TARGETS.PLANS_TABLE}>
          <DataTable
            isLoading={isLoading}
            itemCount={rows.length}
            data={rows}
            isSortable
            columns={[
              {
                Header: intl.formatMessage(messages.plansColumn),
                accessor: 'name',
                Cell: PlanNameCell,
                disableSortBy: true,
              },
              {
                Header: intl.formatMessage(messages.balanceColumn),
                accessor: 'balance',
                Cell: BalanceCell,
              },
              {
                Header: (
                  <span id={MULTI_PLAN_FUNDING_SETTINGS_TARGETS.POOL_STATUS_HEADER}>
                    {intl.formatMessage(messages.drawDownColumn)}
                  </span>
                ),
                accessor: 'isMultiPlanEligible',
                Cell: PoolStatusCell,
              },
              {
                Header: intl.formatMessage(messages.expiresColumn),
                accessor: 'expires',
                Cell: ExpiresCell,
              },
            ]}
            additionalColumns={[
              {
                id: 'actions',
                Header: <span className="sr-only">{intl.formatMessage(messages.actionsColumn)}</span>,
                disableSortBy: true,
                Cell: FundingSettingsCell,
              },
            ]}
          >
            <DataTable.Table />
            <DataTable.EmptyTable content={intl.formatMessage(messages.emptyState)} />
          </DataTable>
        </div>
      )}
    </section>
  );
};

SettingsMultiPlanFundingTab.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
  enterpriseSlug: PropTypes.string.isRequired,
};

export default SettingsMultiPlanFundingTab;
