import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import PaymentMethodStep from '../steps/PaymentMethodStep';
import { initialAddFundsState, useAddFunds } from '../data';

jest.mock('../data', () => ({
  ...jest.requireActual('../data'),
  useAddFunds: jest.fn(),
}));

const mockUpdateFormData = jest.fn();

const renderPaymentMethodStep = ({ paymentMethod = initialAddFundsState.formData.paymentMethod } = {}) => {
  useAddFunds.mockReturnValue({
    formData: { ...initialAddFundsState.formData, amount: 1000, paymentMethod },
    updateFormData: mockUpdateFormData,
    stepHeadingRef: React.createRef(),
  });
  return render(
    <IntlProvider locale="en">
      <PaymentMethodStep />
    </IntlProvider>,
  );
};

describe('PaymentMethodStep', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the heading and a labelled group of payment methods', () => {
    renderPaymentMethodStep();

    expect(screen.getByRole('heading', { name: 'Choose a Payment Method' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Payment method' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('preselects credit card and describes it', () => {
    renderPaymentMethodStep();

    const creditCard = screen.getByRole('radio', { name: /Credit Card/ });
    expect(creditCard).toBeChecked();
    expect(creditCard).toBeEnabled();
    expect(creditCard).toHaveAccessibleDescription('Pay with your Visa, Mastercard, or AmEx.');
    expect(screen.getByText('Instant')).toBeInTheDocument();
  });

  it('shows bank account as a disabled option with its transfer time', () => {
    renderPaymentMethodStep();

    const bankAccount = screen.getByRole('radio', { name: /Bank Account/ });
    expect(bankAccount).toBeDisabled();
    expect(bankAccount).not.toBeChecked();
    expect(bankAccount).toHaveAccessibleName(/4 Business Days/);
    expect(bankAccount).toHaveAccessibleDescription('Link your bank securely via Stripe Financial Connections.');
  });

  it('does not select bank account when it is clicked', async () => {
    const user = userEvent.setup();
    renderPaymentMethodStep();

    await user.click(screen.getByText('Bank Account'));

    expect(mockUpdateFormData).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: /Credit Card/ })).toBeChecked();
  });

  it('shows the processing fee note', () => {
    renderPaymentMethodStep();

    expect(screen.getByTestId('add-funds-processing-fee-note')).toHaveTextContent(
      'edX covers processing fees on all top-up payments.',
    );
  });

  it('selects credit card with the keyboard', async () => {
    const user = userEvent.setup();
    renderPaymentMethodStep({ paymentMethod: null });

    await user.tab();
    const creditCard = screen.getByRole('radio', { name: /Credit Card/ });
    expect(creditCard).toHaveFocus();
    await user.keyboard(' ');

    expect(mockUpdateFormData).toHaveBeenCalledWith({ paymentMethod: 'card' });
  });

  it.each(['{ArrowDown}', '{ArrowRight}', '{ArrowUp}', '{ArrowLeft}'])(
    'skips the disabled bank account option on %s',
    async (key) => {
      const user = userEvent.setup();
      renderPaymentMethodStep();
      const creditCard = screen.getByRole('radio', { name: /Credit Card/ });
      const bankAccount = screen.getByRole('radio', { name: /Bank Account/ });

      await user.tab();
      expect(creditCard).toHaveFocus();
      await user.keyboard(key);

      expect(bankAccount).not.toHaveFocus();
      expect(bankAccount).not.toBeChecked();
      expect(creditCard).toBeChecked();
      expect(mockUpdateFormData).not.toHaveBeenCalledWith({ paymentMethod: 'bank-account' });
    },
  );

  it('selects credit card when its label is clicked', async () => {
    const user = userEvent.setup();
    renderPaymentMethodStep({ paymentMethod: null });

    await user.click(screen.getByText('Credit Card'));

    expect(mockUpdateFormData).toHaveBeenCalledWith({ paymentMethod: 'card' });
  });
});
