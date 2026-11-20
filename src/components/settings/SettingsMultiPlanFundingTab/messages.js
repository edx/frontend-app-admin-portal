import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  tabLabel: {
    id: 'adminPortal.settings.multiPlanFunding.tab.label',
    defaultMessage: 'Multi-plan funding',
    description: 'Label for the multi-plan learner credit funding tab in the settings page.',
  },
  tabDescription: {
    id: 'adminPortal.settings.multiPlanFunding.tab.description',
    defaultMessage: 'Choose which learner credit plans join the shared pool. If a learner’s balance runs out, funds are automatically used from another eligible plan they have access to.',
    description: 'Description at the top of the multi-plan funding settings tab.',
  },
  helpCenterLink: {
    id: 'adminPortal.settings.multiPlanFunding.helpCenter.link',
    defaultMessage: 'Learn more about multi-plan funding',
    description: 'Link to the help center article that explains multi-plan learner credit funding.',
  },
  plansColumn: {
    id: 'adminPortal.settings.multiPlanFunding.table.column.plans',
    defaultMessage: 'Plans',
    description: 'Column header for the plan name in the multi-plan funding plans table.',
  },
  balanceColumn: {
    id: 'adminPortal.settings.multiPlanFunding.table.column.balance',
    defaultMessage: 'Balance',
    description: 'Column header for the available balance in the multi-plan funding plans table.',
  },
  drawDownColumn: {
    id: 'adminPortal.settings.multiPlanFunding.table.column.drawDown',
    defaultMessage: 'Multi-plan draw-down',
    description: 'Column header for whether the plan is in the multi-plan pool.',
  },
  expiresColumn: {
    id: 'adminPortal.settings.multiPlanFunding.table.column.expires',
    defaultMessage: 'Expires',
    description: 'Column header for the plan expiration date in the multi-plan funding plans table.',
  },
  actionsColumn: {
    id: 'adminPortal.settings.multiPlanFunding.table.column.actions',
    defaultMessage: 'Actions',
    description: 'Accessible column header for the row actions in the multi-plan funding plans table.',
  },
  inPoolBadge: {
    id: 'adminPortal.settings.multiPlanFunding.badge.inPool',
    defaultMessage: 'In Pool',
    description: 'Badge shown when a plan is part of the multi-plan pool.',
  },
  notInPoolBadge: {
    id: 'adminPortal.settings.multiPlanFunding.badge.notInPool',
    defaultMessage: 'Not in Pool',
    description: 'Badge shown when a plan can join the multi-plan pool but has not been added.',
  },
  unavailableBadge: {
    id: 'adminPortal.settings.multiPlanFunding.badge.unavailable',
    defaultMessage: 'Unavailable',
    description: 'Badge shown when a plan is not eligible to join the multi-plan pool.',
  },
  fundingSettingsButton: {
    id: 'adminPortal.settings.multiPlanFunding.button.fundingSettings',
    defaultMessage: 'Funding settings',
    description: 'Button that opens the funding settings of a plan.',
  },
  fundingSettingsButtonAriaLabel: {
    id: 'adminPortal.settings.multiPlanFunding.button.fundingSettings.ariaLabel',
    defaultMessage: 'Funding settings for {planName}',
    description: 'Accessible label for the button that opens the funding settings of a plan.',
  },
  emptyState: {
    id: 'adminPortal.settings.multiPlanFunding.table.empty',
    defaultMessage: 'No active learner credit plans found.',
    description: 'Shown when the customer has no active learner credit plans.',
  },
  loadError: {
    id: 'adminPortal.settings.multiPlanFunding.loadError',
    defaultMessage: 'We couldn’t load your learner credit plans. Please refresh the page and try again.',
    description: 'Error shown when the plans cannot be loaded.',
  },
  loading: {
    id: 'adminPortal.settings.multiPlanFunding.loading',
    defaultMessage: 'Loading plans',
    description: 'Screen reader text while the multi-plan funding plans load.',
  },
  breadcrumbPlans: {
    id: 'adminPortal.settings.multiPlanFunding.breadcrumb.plans',
    defaultMessage: 'Plans',
    description: 'Breadcrumb link back to the multi-plan funding plans list.',
  },
  activeBadge: {
    id: 'adminPortal.settings.multiPlanFunding.badge.active',
    defaultMessage: 'Active',
    description: 'Badge shown when a plan is active.',
  },
  scheduledBadge: {
    id: 'adminPortal.settings.multiPlanFunding.badge.scheduled',
    defaultMessage: 'Scheduled',
    description: 'Badge shown when a plan has not started yet.',
  },
  inactiveBadge: {
    id: 'adminPortal.settings.multiPlanFunding.badge.inactive',
    defaultMessage: 'Inactive',
    description: 'Badge shown when a plan is retired or expired.',
  },
  planDetails: {
    id: 'adminPortal.settings.multiPlanFunding.planDetails',
    defaultMessage: 'Plan Details',
    description: 'Label above the available balance of a plan.',
  },
  utilized: {
    id: 'adminPortal.settings.multiPlanFunding.utilized',
    defaultMessage: 'Utilized {amount}',
    description: 'Amount of the plan already spent.',
  },
  spentOfTotal: {
    id: 'adminPortal.settings.multiPlanFunding.spentOfTotal',
    defaultMessage: '{spent} spent of {total}. Expires {expirationDate}',
    description: 'Summary of how much of the plan was spent and when it expires.',
  },
  fundingSettingsHeading: {
    id: 'adminPortal.settings.multiPlanFunding.fundingSettings.heading',
    defaultMessage: 'Funding Settings',
    description: 'Heading of the funding settings card of a plan.',
  },
  fundingSettingsSwitchLabel: {
    id: 'adminPortal.settings.multiPlanFunding.fundingSettings.switch.label',
    defaultMessage: 'Add this plan to the shared pool. If a learner’s balance runs out, funds will automatically be used from another eligible plan they have access to.',
    description: 'Label of the switch that adds a plan to the multi-plan pool.',
  },
  unavailableDescription: {
    id: 'adminPortal.settings.multiPlanFunding.fundingSettings.unavailable',
    defaultMessage: 'This plan can’t join the shared pool. Only active plans that learners browse and enroll from directly (without requests or assignments) are eligible.',
    description: 'Shown instead of the switch when a plan is not eligible to join the multi-plan pool.',
  },
  saveChanges: {
    id: 'adminPortal.settings.multiPlanFunding.fundingSettings.save',
    defaultMessage: 'Save Changes',
    description: 'Button that saves the funding settings of a plan.',
  },
  saving: {
    id: 'adminPortal.settings.multiPlanFunding.fundingSettings.saving',
    defaultMessage: 'Saving',
    description: 'Save button label while the funding settings are being saved.',
  },
  savedToast: {
    id: 'adminPortal.settings.multiPlanFunding.fundingSettings.savedToast',
    defaultMessage: 'Funding settings saved',
    description: 'Toast shown after the funding settings of a plan are saved.',
  },
  saveError: {
    id: 'adminPortal.settings.multiPlanFunding.fundingSettings.saveError',
    defaultMessage: 'We couldn’t save your funding settings. Please try again.',
    description: 'Error shown when the funding settings of a plan cannot be saved.',
  },
  customerDisabledError: {
    id: 'adminPortal.settings.multiPlanFunding.fundingSettings.customerDisabledError',
    defaultMessage: 'Multi-plan funding isn’t turned on for your organization. Contact support to turn it on.',
    description: 'Error shown when the API reports that multi-plan funding is turned off for the customer.',
  },
  howItWorksHeading: {
    id: 'adminPortal.settings.multiPlanFunding.howItWorks.heading',
    defaultMessage: 'How it works',
    description: 'Heading of the alert that explains how multi-plan funding picks plans.',
  },
  howItWorksBody: {
    id: 'adminPortal.settings.multiPlanFunding.howItWorks.body',
    defaultMessage: 'Plans are used automatically based on expiration date. The plan expiring soonest is used first. Admins can’t change the order.',
    description: 'Explains the order in which multi-plan funding uses plans.',
  },
  confirmModalTitle: {
    id: 'adminPortal.settings.multiPlanFunding.confirmModal.title',
    defaultMessage: 'Add this plan to the multi-plan pool?',
    description: 'Title of the modal that confirms adding a plan to the multi-plan pool.',
  },
  confirmModalBody: {
    id: 'adminPortal.settings.multiPlanFunding.confirmModal.body',
    defaultMessage: 'If your {planName} balance isn’t enough to cover the cost, we’ll automatically use funds from another eligible plan you have access to. Funds will be used from the plan closest to expiration first. No manual selection is required.',
    description: 'Body of the modal that confirms adding a plan to the multi-plan pool.',
  },
  confirmModalCancel: {
    id: 'adminPortal.settings.multiPlanFunding.confirmModal.cancel',
    defaultMessage: 'Cancel',
    description: 'Button that closes the modal without adding the plan to the multi-plan pool.',
  },
  confirmModalEnable: {
    id: 'adminPortal.settings.multiPlanFunding.confirmModal.enable',
    defaultMessage: 'Enable',
    description: 'Button that confirms adding the plan to the multi-plan pool.',
  },
  planNotFound: {
    id: 'adminPortal.settings.multiPlanFunding.planNotFound',
    defaultMessage: 'We couldn’t find this plan.',
    description: 'Shown when the requested plan cannot be loaded.',
  },
});

export default messages;
