import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Button } from '@openedx/paragon';
import { Add } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import { ROUTE_NAMES } from '../../EnterpriseApp/data/constants';
import { ADD_FUNDS_ROUTE_SEGMENT } from './data/constants';
import messages from './messages';

/**
 * "Add funds" CTA on a budget card, driven by the budget's top-up eligibility. Hidden when there is
 * no eligibility (loading, any error, or no row for the budget); disabled when ineligible, described
 * by the reasons that `AddFundsIneligibleStatus` renders at the bottom of the card (`reasonsId`).
 */
const AddFundsButton = ({
  enterpriseSlug, budgetId, eligibility, reasonsId,
}) => {
  const intl = useIntl();

  if (!eligibility) {
    return null;
  }

  const buttonText = intl.formatMessage(messages.addFundsButton);

  if (eligibility.isEligible) {
    return (
      <Button
        data-testid="add-funds"
        as={Link}
        to={`/${enterpriseSlug}/admin/${ROUTE_NAMES.learnerCredit}/${budgetId}/${ADD_FUNDS_ROUTE_SEGMENT}`}
        variant="outline-primary"
        iconBefore={Add}
      >
        {buttonText}
      </Button>
    );
  }

  // `aria-disabled` rather than `disabled`, so keyboard and screen reader users can still reach
  // the button and hear why it's unavailable. `add-funds-button-disabled` drops the mouse hover style
  // (the `disabled` class alone doesn't); keyboard focus is unaffected.
  return (
    <Button
      data-testid="add-funds"
      variant="outline-primary"
      iconBefore={Add}
      className="disabled add-funds-button-disabled"
      aria-disabled="true"
      aria-describedby={reasonsId}
    >
      {buttonText}
    </Button>
  );
};

AddFundsButton.propTypes = {
  enterpriseSlug: PropTypes.string.isRequired,
  budgetId: PropTypes.string.isRequired,
  eligibility: PropTypes.shape({
    isEligible: PropTypes.bool.isRequired,
  }),
  reasonsId: PropTypes.string.isRequired,
};

AddFundsButton.defaultProps = {
  eligibility: null,
};

export default AddFundsButton;
