import React from 'react';
import PropTypes from 'prop-types';
import {
  ActionRow, Badge, Button, Hyperlink, ModalDialog, Stack,
} from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { configuration } from '../../config';
import { formatDate, formatPrice, useSubsidyAccessPolicyNames } from './data';

const formatAmount = (amount) => formatPrice(amount, { minimumFractionDigits: 2 });

/**
 * "Spent Details" modal for a split-funded (multi-plan) spent transaction. Lists how much each budget
 * contributed to the enrollment, the total, and a link to the multi-plan funding help center article.
 */
const SplitFundingDetailsModal = ({
  isOpen,
  onClose,
  fundedOn,
  breakdown,
}) => {
  const intl = useIntl();
  const helpCenterUrl = configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL;
  // Resolve each contributing budget by UUID, so inactive or not-yet-loaded budgets still show their names.
  const budgetNamesById = useSubsidyAccessPolicyNames(breakdown.legs.map(leg => leg.subsidyAccessPolicyUuid));
  const unknownBudgetName = intl.formatMessage({
    id: 'lcm.budget.detail.page.spent.split.funding.modal.unknown.budget',
    defaultMessage: 'Another budget',
    description: 'Fallback label in the split funding details modal when the name of a contributing budget is unavailable',
  });

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={intl.formatMessage({
        id: 'lcm.budget.detail.page.spent.split.funding.modal.title',
        defaultMessage: 'Spent Details',
        description: 'Title of the modal showing how a split-funded enrollment was paid for across budgets',
      })}
      hasCloseButton={false}
      isOverflowVisible={false}
    >
      <ModalDialog.Header>
        <ModalDialog.Title>
          <FormattedMessage
            id="lcm.budget.detail.page.spent.split.funding.modal.title"
            defaultMessage="Spent Details"
            description="Title of the modal showing how a split-funded enrollment was paid for across budgets"
          />
        </ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <hr className="mt-0" />
        {fundedOn && (
          <dl className="mb-3">
            <dt className="font-weight-normal text-primary-500">
              <FormattedMessage
                id="lcm.budget.detail.page.spent.split.funding.modal.funded.on"
                defaultMessage="Funded On"
                description="Label for the date the split-funded enrollment was paid for"
              />
            </dt>
            <dd className="font-weight-bold mb-0">{formatDate(fundedOn)}</dd>
          </dl>
        )}
        <div className="border rounded p-3" data-testid="split-funding-breakdown">
          <ul className="list-unstyled mb-0">
            {breakdown.legs.map(leg => (
              <li key={leg.key} className="d-flex justify-content-between align-items-center mb-2">
                <Stack direction="horizontal" gap={2}>
                  <span>{budgetNamesById[leg.subsidyAccessPolicyUuid] || leg.budgetName || unknownBudgetName}</span>
                  {leg.reversed && (
                    <Badge variant="success">
                      <FormattedMessage
                        id="lcm.budget.detail.page.spent.split.funding.modal.refunded"
                        defaultMessage="Refunded"
                        description="Badge shown next to a budget whose share of a split-funded enrollment was refunded"
                      />
                    </Badge>
                  )}
                </Stack>
                <span>{formatAmount(leg.amount)}</span>
              </li>
            ))}
          </ul>
          <hr />
          <div className="d-flex justify-content-between font-weight-bold">
            <span>
              <FormattedMessage
                id="lcm.budget.detail.page.spent.split.funding.modal.total"
                defaultMessage="Total"
                description="Label for the total amount of a split-funded enrollment"
              />
            </span>
            <span className="text-success-500">{formatAmount(breakdown.total)}</span>
          </div>
        </div>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          {helpCenterUrl && (
            <Hyperlink
              destination={helpCenterUrl}
              target="_blank"
            >
              <FormattedMessage
                id="lcm.budget.detail.page.spent.split.funding.modal.help.center.link"
                defaultMessage="Help center: Multi-plan funding"
                description="Link to the help center article that explains multi-plan (split-funded) learner credit enrollments"
              />
            </Hyperlink>
          )}
          <ActionRow.Spacer />
          <Button variant="outline-primary" onClick={onClose}>
            <FormattedMessage
              id="lcm.budget.detail.page.spent.split.funding.modal.close"
              defaultMessage="Close"
              description="Button to close the split funding details modal"
            />
          </Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

SplitFundingDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fundedOn: PropTypes.string,
  breakdown: PropTypes.shape({
    legs: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      subsidyAccessPolicyUuid: PropTypes.string,
      budgetName: PropTypes.string,
      amount: PropTypes.number.isRequired,
      reversed: PropTypes.bool,
    })).isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

export default SplitFundingDetailsModal;
