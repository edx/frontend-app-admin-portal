import React from 'react';
import PropTypes from 'prop-types';
import {
  Badge, Form, Icon, Stack,
} from '@openedx/paragon';
import { AccountBalance, CreditCard, WarningFilled } from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { PAYMENT_METHODS, useAddFunds } from '../data';
import messages from '../messages';
import AddFundsStepHeading from './AddFundsStepHeading';

// Never stored: the bank account option is always disabled until ACH returns (ADR 0012).
const BANK_ACCOUNT_OPTION_VALUE = 'bank-account';

const PaymentMethodOption = ({
  value, icon, label, badge, badgeVariant, description, disabled,
}) => (
  <Form.Radio
    value={value}
    disabled={disabled}
    className="add-funds-payment-method-option w-100 align-items-start bg-white border rounded p-3 mb-3"
    controlClassName="mt-2"
    labelClassName="mb-0"
    description={description}
  >
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <span className="d-inline-flex bg-light-300 rounded p-1" aria-hidden>
        <Icon src={icon} size="sm" />
      </span>
      <span className="font-weight-bold">{label}</span>
      <Badge variant={badgeVariant}>{badge}</Badge>
    </Stack>
  </Form.Radio>
);

PaymentMethodOption.propTypes = {
  value: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.node.isRequired,
  badge: PropTypes.node.isRequired,
  badgeVariant: PropTypes.string.isRequired,
  description: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

PaymentMethodOption.defaultProps = {
  disabled: false,
};

const PaymentMethodStep = () => {
  const intl = useIntl();
  const { formData: { paymentMethod }, updateFormData } = useAddFunds();

  return (
    <Stack gap={4}>
      <AddFundsStepHeading>
        <FormattedMessage {...messages.paymentMethodTitle} />
      </AddFundsStepHeading>
      <Form.RadioSet
        name="add-funds-payment-method"
        aria-label={intl.formatMessage(messages.paymentMethodGroupLabel)}
        value={paymentMethod ?? ''}
        onChange={(e) => updateFormData({ paymentMethod: e.target.value })}
      >
        <PaymentMethodOption
          value={PAYMENT_METHODS.card}
          icon={CreditCard}
          label={<FormattedMessage {...messages.creditCardLabel} />}
          badge={<FormattedMessage {...messages.creditCardBadge} />}
          badgeVariant="success"
          description={<FormattedMessage {...messages.creditCardDescription} />}
        />
        <PaymentMethodOption
          value={BANK_ACCOUNT_OPTION_VALUE}
          icon={AccountBalance}
          label={<FormattedMessage {...messages.bankAccountLabel} />}
          badge={<FormattedMessage {...messages.bankAccountBadge} />}
          badgeVariant="warning"
          description={<FormattedMessage {...messages.bankAccountDescription} />}
          disabled
        />
      </Form.RadioSet>
      <div className="d-flex align-items-start bg-light-100 rounded p-3 small" data-testid="add-funds-processing-fee-note">
        <Icon src={WarningFilled} size="sm" className="text-warning mr-2 flex-shrink-0" />
        <span className="font-weight-bold">
          <FormattedMessage {...messages.processingFeeNote} />
        </span>
      </div>
    </Stack>
  );
};

export default PaymentMethodStep;
