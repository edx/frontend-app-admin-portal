import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { Card } from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { formatPrice } from '../data';
import { calculateOrderSummary, TOP_UP_DISCOUNT_RATE, useAddFunds } from './data';

const formatCurrency = (value) => formatPrice(value, { minimumFractionDigits: 2 });

const SummaryRow = ({ label, value, valueClassName }) => (
  <div className="d-flex justify-content-between small mb-2">
    <dt className="font-weight-normal">{label}</dt>
    <dd className={`mb-0 font-weight-bold ${valueClassName}`}>{value}</dd>
  </div>
);

SummaryRow.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  valueClassName: PropTypes.string,
};

SummaryRow.defaultProps = {
  valueClassName: '',
};

const EMPTY_VALUE = '-';

const OrderSummary = ({ currentBalance, expirationDate }) => {
  const intl = useIntl();
  const { formData } = useAddFunds();
  const summary = calculateOrderSummary(formData.amount, currentBalance);

  return (
    <Card data-testid="add-funds-order-summary">
      <Card.Section>
        <h3 className="h4 mb-3">
          <FormattedMessage
            id="lcm.budget.add.funds.order.summary.title"
            defaultMessage="Order Summary"
            description="Heading for the order summary panel in the Add Funds flow"
          />
        </h3>
        <dl className="mb-0">
          <SummaryRow
            label={(
              <FormattedMessage
                id="lcm.budget.add.funds.order.summary.credit.amount"
                defaultMessage="Credit Amount"
                description="Label for the amount of credit being added to the budget"
              />
              )}
            value={summary ? formatCurrency(summary.creditAmount) : EMPTY_VALUE}
          />
          <SummaryRow
            label={(
              <FormattedMessage
                id="lcm.budget.add.funds.order.summary.discount"
                defaultMessage="Discount ({discountPercent})"
                description="Label for the discount applied to the top-up purchase"
                values={{ discountPercent: intl.formatNumber(TOP_UP_DISCOUNT_RATE, { style: 'percent' }) }}
              />
              )}
            value={summary ? `-${formatCurrency(summary.discount)}` : EMPTY_VALUE}
          />
          <SummaryRow
            label={(
              <FormattedMessage
                id="lcm.budget.add.funds.order.summary.total.cost"
                defaultMessage="Total Cost"
                description="Label for the total cost of the top-up purchase after discount"
              />
              )}
            value={summary ? formatCurrency(summary.totalCost) : EMPTY_VALUE}
          />
        </dl>
        <hr className="my-3" />
        <dl className="mb-0">
          <SummaryRow
            label={(
              <FormattedMessage
                id="lcm.budget.add.funds.order.summary.current.balance"
                defaultMessage="Current Balance"
                description="Label for the budget's current available balance"
              />
              )}
            value={formatCurrency(currentBalance)}
          />
          <SummaryRow
            label={(
              <FormattedMessage
                id="lcm.budget.add.funds.order.summary.new.balance"
                defaultMessage="New Balance"
                description="Label for the budget's balance after the top-up is applied"
              />
              )}
            value={summary ? formatCurrency(summary.newBalance) : EMPTY_VALUE}
            valueClassName={summary ? 'text-success' : ''}
          />
        </dl>
      </Card.Section>
      {expirationDate && (
        <Card.Footer className="justify-content-center small">
          <FormattedMessage
            id="lcm.budget.add.funds.order.summary.plan.expires"
            defaultMessage="Plan Expires {expirationDate}"
            description="The date the learner credit plan expires"
            values={{
              expirationDate: (
                <strong className="ml-2">
                  {intl.formatDate(dayjs(expirationDate).toDate(), { month: 'long', day: 'numeric', year: 'numeric' })}
                </strong>
              ),
            }}
          />
        </Card.Footer>
      )}
    </Card>
  );
};

OrderSummary.propTypes = {
  currentBalance: PropTypes.number.isRequired,
  expirationDate: PropTypes.string,
};

OrderSummary.defaultProps = {
  expirationDate: undefined,
};

export default OrderSummary;
