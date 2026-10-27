import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { Card } from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { formatPrice } from '../data';
import { calculateOrderSummary, useAddFunds } from './data';
import messages from './messages';

const formatCurrency = (value) => formatPrice(value, { minimumFractionDigits: 2 });

const SummaryRow = ({ label, value, valueClassName }) => (
  <div className="d-flex justify-content-between small mb-2">
    <dt className="font-weight-bold text-gray-700">{label}</dt>
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

const EmptyValue = () => (
  <>
    <span aria-hidden>-</span>
    <span className="sr-only"><FormattedMessage {...messages.notAvailable} /></span>
  </>
);

const OrderSummary = ({ currentBalance, expirationDate }) => {
  const intl = useIntl();
  const { formData } = useAddFunds();
  const summary = calculateOrderSummary(formData.amount, currentBalance);
  const hasNewBalance = summary?.newBalance != null;

  return (
    <Card className="bg-light-300" data-testid="add-funds-order-summary">
      <Card.Section>
        <h3 className="h4 mb-3">
          <FormattedMessage {...messages.orderSummaryTitle} />
        </h3>
        <hr className="mt-0 mb-3" />
        <dl className="mb-0">
          <SummaryRow
            label={<FormattedMessage {...messages.creditAmount} />}
            value={summary ? formatCurrency(summary.creditAmount) : <EmptyValue />}
          />
          <SummaryRow
            label={<FormattedMessage {...messages.totalCost} />}
            value={summary ? formatCurrency(summary.totalCost) : <EmptyValue />}
          />
        </dl>
        <hr className="my-3" />
        <dl className="mb-0">
          <SummaryRow
            label={<FormattedMessage {...messages.currentBalance} />}
            value={currentBalance === undefined ? <EmptyValue /> : formatCurrency(currentBalance)}
          />
          <SummaryRow
            label={<FormattedMessage {...messages.newBalance} />}
            value={hasNewBalance ? formatCurrency(summary.newBalance) : <EmptyValue />}
            valueClassName={hasNewBalance ? 'text-success' : ''}
          />
        </dl>
        {/* One labelled sentence, announced only when a valid amount changes the summary. */}
        <p className="sr-only" role="status" data-testid="add-funds-order-summary-status">
          {hasNewBalance && intl.formatMessage(messages.newBalanceAnnouncement, {
            amount: formatCurrency(summary.creditAmount),
            newBalance: formatCurrency(summary.newBalance),
          })}
        </p>
      </Card.Section>
      {expirationDate && (
        <Card.Footer className="bg-transparent border-0 pt-0">
          <div className="d-flex justify-content-center w-100 small font-weight-bold text-gray-700 bg-white rounded p-3">
            <FormattedMessage
              {...messages.planExpires}
              values={{
                expirationDate: (
                  <strong className="ml-2 text-black">
                    {intl.formatDate(dayjs(expirationDate).toDate(), { month: 'long', day: 'numeric', year: 'numeric' })}
                  </strong>
                ),
              }}
            />
          </div>
        </Card.Footer>
      )}
    </Card>
  );
};

OrderSummary.propTypes = {
  currentBalance: PropTypes.number,
  expirationDate: PropTypes.string,
};

OrderSummary.defaultProps = {
  currentBalance: undefined,
  expirationDate: undefined,
};

export default OrderSummary;
