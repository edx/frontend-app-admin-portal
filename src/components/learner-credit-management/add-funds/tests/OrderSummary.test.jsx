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
  it('hides the discount row by default', () => {
    renderOrderSummary();

    expect(screen.queryByText(/Discount/)).not.toBeInTheDocument();
    // Credit amount and total cost are both the full amount.
    expect(screen.getAllByText('$1,000.00')).toHaveLength(2);
  });

  it('shows the discount row when a discount rate is passed', () => {
    renderOrderSummary({ discountRate: 0.1 });

    expect(screen.getByText('Discount (10%)')).toBeInTheDocument();
    expect(screen.getByText('-$100.00')).toBeInTheDocument();
    expect(screen.getByText('$900.00')).toBeInTheDocument();
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

    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    expect(screen.getByText('$1,800.00')).toBeInTheDocument();
  });
});
