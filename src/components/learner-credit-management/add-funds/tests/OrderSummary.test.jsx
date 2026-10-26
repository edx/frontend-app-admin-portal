import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import OrderSummary from '../OrderSummary';
import { initialAddFundsState, useAddFunds } from '../data';

jest.mock('../data', () => ({
  ...jest.requireActual('../data'),
  useAddFunds: jest.fn(),
}));

const renderOrderSummary = ({ amount = 1000, ...props } = {}) => {
  useAddFunds.mockReturnValue({ formData: { ...initialAddFundsState.formData, amount } });
  return render(
    <IntlProvider locale="en">
      <OrderSummary currentBalance={1800} {...props} />
    </IntlProvider>,
  );
};

describe('OrderSummary', () => {
  it('shows the amount as the total cost, with no discount row', () => {
    renderOrderSummary();

    expect(screen.queryByText(/Discount/)).not.toBeInTheDocument();
    expect(screen.getByText('Credit Amount').nextElementSibling).toHaveTextContent('$1,000.00');
    expect(screen.getByText('Total Cost').nextElementSibling).toHaveTextContent('$1,000.00');
    expect(screen.getByText('New Balance').nextElementSibling).toHaveTextContent('$2,800.00');
  });

  it('announces one labelled sentence for a valid amount', () => {
    renderOrderSummary();

    expect(screen.getByRole('status')).toHaveTextContent('Adding $1,000.00. New balance: $2,800.00.');
  });

  it('announces nothing while the amount is invalid', () => {
    renderOrderSummary({ amount: 100 });

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows the plan expiry when an expiration date is passed', () => {
    renderOrderSummary({ expirationDate: '2027-03-15T12:00:00Z' });

    expect(screen.getByText('March 15, 2027')).toBeInTheDocument();
  });

  it('does not render the plan expiry footer without an expiration date', () => {
    renderOrderSummary();

    expect(screen.queryByText(/Plan Expires/)).not.toBeInTheDocument();
  });

  it('shows placeholders until the amount is valid', () => {
    renderOrderSummary({ amount: null });

    ['Credit Amount', 'Total Cost', 'New Balance'].forEach((label) => {
      expect(screen.getByText(label).nextElementSibling).toHaveTextContent('-Not available');
    });
    expect(screen.getByText('Current Balance').nextElementSibling).toHaveTextContent('$1,800.00');
  });

  it('shows no current or new balance when the balance is unknown', () => {
    renderOrderSummary({ currentBalance: undefined });

    expect(screen.getByText('Current Balance').nextElementSibling).toHaveTextContent('-Not available');
    expect(screen.getByText('New Balance').nextElementSibling).toHaveTextContent('-Not available');
    expect(screen.getByText('Total Cost').nextElementSibling).toHaveTextContent('$1,000.00');
  });
});
