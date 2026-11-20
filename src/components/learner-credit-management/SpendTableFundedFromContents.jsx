import React from 'react';
import PropTypes from 'prop-types';
import { Button, useToggle } from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { getSplitFundingBreakdown, useBudgetId, useSubsidyAccessPolicyNames } from './data';
import SplitFundingDetailsModal from './SplitFundingDetailsModal';

/**
 * "Funded From" cell of the Spent table (multi-plan learner credit).
 *
 * * Split-funded rows: a "View details" button that opens the per-budget breakdown.
 * * Single-budget rows: the name of the current budget, as plain text.
 *
 * Budget names are looked up by UUID (see `useSubsidyAccessPolicyNames`), so inactive budgets keep their names.
 */
const SpendTableFundedFrom = ({ row }) => {
  const intl = useIntl();
  const [isModalOpen, openModal, closeModal] = useToggle(false);
  const { subsidyAccessPolicyId } = useBudgetId();
  const currentBudgetNames = useSubsidyAccessPolicyNames([subsidyAccessPolicyId]);

  const breakdown = getSplitFundingBreakdown(row.original.splitFunding);

  if (!breakdown) {
    return <span className="x-small">{currentBudgetNames[subsidyAccessPolicyId] || null}</span>;
  }

  return (
    <>
      <Button
        variant="link"
        size="inline"
        className="x-small"
        onClick={openModal}
        aria-label={intl.formatMessage({
          id: 'lcm.budget.detail.page.spent.table.funded.from.view.details.aria.label',
          defaultMessage: 'View details of how {courseTitle} was funded across budgets',
          description: 'Accessible label for the button that opens the split funding details of a spent enrollment',
        }, { courseTitle: row.original.courseTitle || '' })}
      >
        <FormattedMessage
          id="lcm.budget.detail.page.spent.table.funded.from.view.details"
          defaultMessage="View details"
          description="Button in the Funded From column that opens the split funding details of a spent enrollment"
        />
      </Button>
      {isModalOpen && (
        <SplitFundingDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          fundedOn={row.original.enrollmentDate}
          breakdown={breakdown}
        />
      )}
    </>
  );
};

SpendTableFundedFrom.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      courseTitle: PropTypes.string,
      enrollmentDate: PropTypes.string,
      splitFunding: PropTypes.shape({
        totalQuantity: PropTypes.number,
        legs: PropTypes.arrayOf(PropTypes.shape({
          legOrder: PropTypes.number,
          subsidyAccessPolicyUuid: PropTypes.string,
          quantity: PropTypes.number,
          reversed: PropTypes.bool,
        })),
      }),
    }).isRequired,
  }).isRequired,
};

export default SpendTableFundedFrom;
