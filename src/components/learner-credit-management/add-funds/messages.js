import { defineMessages } from '@edx/frontend-platform/i18n';
import { ADD_FUNDS_STEP_KEYS } from './data';

const messages = defineMessages({
  pageBreadcrumb: {
    id: 'lcm.budget.add.funds.breadcrumb',
    defaultMessage: 'Add Funds',
    description: 'Breadcrumb label for the Add Funds page of a learner credit budget',
  },
  breadcrumbAriaLabel: {
    id: 'lcm.budget.add.funds.breadcrumb.aria.label',
    defaultMessage: 'Add funds breadcrumb navigation',
    description: 'Accessible label for the breadcrumb navigation on the Add Funds page',
  },
  budgetFallbackName: {
    id: 'lcm.budget.add.funds.breadcrumb.budget.fallback',
    defaultMessage: 'Overview',
    description: 'Breadcrumb label for the budget when it has no display name',
  },
  learnerCreditBreadcrumb: {
    id: 'lcm.budget.add.funds.breadcrumb.learner.credit',
    defaultMessage: 'Learner Credit',
    description: 'Breadcrumb label linking back to the learner credit budgets page',
  },
  back: {
    id: 'lcm.budget.add.funds.back',
    defaultMessage: 'Back',
    description: 'Button text to go back to the previous step of the Add Funds flow',
  },
  continue: {
    id: 'lcm.budget.add.funds.continue',
    defaultMessage: 'Continue',
    description: 'Button text to continue to the next step of the Add Funds flow',
  },
  [ADD_FUNDS_STEP_KEYS.selectAmount]: {
    id: 'lcm.budget.add.funds.step.select.amount',
    defaultMessage: 'Select Amount',
    description: 'Stepper label for the step where the admin chooses how much to add to the budget',
  },
  [ADD_FUNDS_STEP_KEYS.paymentMethod]: {
    id: 'lcm.budget.add.funds.step.payment.method',
    defaultMessage: 'Payment Method',
    description: 'Stepper label for the step where the admin chooses a payment method',
  },
  [ADD_FUNDS_STEP_KEYS.paymentDetails]: {
    id: 'lcm.budget.add.funds.step.payment.details',
    defaultMessage: 'Payment Details',
    description: 'Stepper label for the step where the admin enters payment details',
  },
  [ADD_FUNDS_STEP_KEYS.confirmation]: {
    id: 'lcm.budget.add.funds.step.confirmation',
    defaultMessage: 'Confirmation',
    description: 'Stepper label for the final confirmation step of the Add Funds flow',
  },
  selectAmountTitle: {
    id: 'lcm.budget.add.funds.select.amount.title',
    defaultMessage: 'Select an Amount',
    description: 'Heading for the step where the admin chooses how much to add to the budget',
  },
  presetAmountLabel: {
    id: 'lcm.budget.add.funds.select.amount.preset.label',
    defaultMessage: 'Choose a preset amount',
    description: 'Label for the group of preset top-up amount buttons',
  },
  customAmountDivider: {
    id: 'lcm.budget.add.funds.select.amount.divider',
    defaultMessage: 'Or enter a custom amount',
    description: 'Divider text between preset amounts and the custom amount input',
  },
  customAmountLabel: {
    id: 'lcm.budget.add.funds.select.amount.custom.label',
    defaultMessage: 'Custom amount',
    description: 'Accessible label for the custom top-up amount input',
  },
  customAmountPlaceholder: {
    id: 'lcm.budget.add.funds.select.amount.custom.placeholder',
    defaultMessage: 'e.g. 1500',
    description: 'Placeholder for the custom top-up amount input',
  },
  customAmountInvalid: {
    id: 'lcm.budget.add.funds.select.amount.custom.invalid',
    defaultMessage: 'Enter an amount between {min} and {max}.',
    description: 'Validation error when the custom top-up amount is out of range',
  },
  amountLimits: {
    id: 'lcm.budget.add.funds.select.amount.limits',
    defaultMessage: 'Minimum {min} · Maximum {max}',
    description: 'Helper text describing the minimum and maximum top-up amount',
  },
  orderSummaryTitle: {
    id: 'lcm.budget.add.funds.order.summary.title',
    defaultMessage: 'Order Summary',
    description: 'Heading for the order summary panel in the Add Funds flow',
  },
  creditAmount: {
    id: 'lcm.budget.add.funds.order.summary.credit.amount',
    defaultMessage: 'Credit Amount',
    description: 'Label for the amount of credit being added to the budget',
  },
  totalCost: {
    id: 'lcm.budget.add.funds.order.summary.total.cost',
    defaultMessage: 'Total Cost',
    description: 'Label for the total cost of the top-up purchase',
  },
  currentBalance: {
    id: 'lcm.budget.add.funds.order.summary.current.balance',
    defaultMessage: 'Current Balance',
    description: "Label for the budget's current available balance",
  },
  newBalance: {
    id: 'lcm.budget.add.funds.order.summary.new.balance',
    defaultMessage: 'New Balance',
    description: "Label for the budget's balance after the top-up is applied",
  },
  newBalanceAnnouncement: {
    id: 'lcm.budget.add.funds.order.summary.new.balance.announcement',
    defaultMessage: 'Adding {amount}. New balance: {newBalance}.',
    description: 'Screen reader announcement when a valid top-up amount updates the order summary',
  },
  notAvailable: {
    id: 'lcm.budget.add.funds.order.summary.not.available',
    defaultMessage: 'Not available',
    description: 'Screen reader text for an order summary value that cannot be shown yet',
  },
  planExpires: {
    id: 'lcm.budget.add.funds.order.summary.plan.expires',
    defaultMessage: 'Plan Expires {expirationDate}',
    description: 'The date the learner credit plan expires',
  },
});

export default messages;
