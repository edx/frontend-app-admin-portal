import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';
import { InfoOutline } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import { TOP_UP_INELIGIBILITY_REASONS } from './data/constants';
import messages from './messages';

const REASON_MESSAGES = {
  [TOP_UP_INELIGIBILITY_REASONS.budgetNotActive]: messages.reasonBudgetNotActive,
  [TOP_UP_INELIGIBILITY_REASONS.budgetExpiringSoon]: messages.reasonBudgetExpiringSoon,
  [TOP_UP_INELIGIBILITY_REASONS.accountNotEligible]: messages.reasonAccountNotEligible,
};

// Unknown codes share one generic message (the API's own `message` is English-only), so dedupe.
const getReasonMessages = (reasons) => {
  const reasonMessages = reasons.map(({ errorCode }) => REASON_MESSAGES[errorCode] || messages.reasonUnknown);
  return reasonMessages.length ? [...new Set(reasonMessages)] : [messages.reasonUnknown];
};

/**
 * Warning strip across the bottom of a budget card listing every reason funds can't be added.
 * `id` is what the disabled "Add funds" button's `aria-describedby` points at.
 */
const AddFundsIneligibleStatus = ({ id, reasons }) => {
  const intl = useIntl();
  return (
    <Card.Status
      variant="warning"
      icon={InfoOutline}
      className="add-funds-ineligible-status py-2"
      data-testid="add-funds-ineligible-status"
    >
      <ul id={id} className="list-unstyled mb-0 font-weight-bold">
        {getReasonMessages(reasons).map((message) => (
          <li key={message.id}>{intl.formatMessage(message)}</li>
        ))}
      </ul>
    </Card.Status>
  );
};

AddFundsIneligibleStatus.propTypes = {
  id: PropTypes.string.isRequired,
  reasons: PropTypes.arrayOf(PropTypes.shape({
    errorCode: PropTypes.string,
  })).isRequired,
};

export default AddFundsIneligibleStatus;
