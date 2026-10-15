import { defineMessages } from '@edx/frontend-platform/i18n';
import { ADD_FUNDS_STEP_KEYS } from './data';

const messages = defineMessages({
  pageBreadcrumb: {
    id: 'lcm.budget.add.funds.breadcrumb',
    defaultMessage: 'Add Funds',
    description: 'Breadcrumb label for the Add Funds page of a learner credit budget',
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
});

export default messages;
