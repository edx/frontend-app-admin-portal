import { useIntl } from '@edx/frontend-platform/i18n';
import messages from '../messages';
import { TourStep } from '../../types';
import { TOUR_TARGETS } from '../../constants';
import { ADMIN_TOUR_EVENT_NAMES } from '../constants';
import { configuration } from '../../../../config';
import { useIsMultiPlanFundingOptInVisible } from '../../../settings/SettingsMultiPlanFundingTab/data/hooks';
import { MULTI_PLAN_FUNDING_TAB_TOUR_TARGET } from '../../../settings/SettingsMultiPlanFundingTab/constants';

interface CreateTourFlowsProps {
  handleEndTour: (endEventName: string, flowUuid?: string) => void;
}

const SetUpPreferencesFlow = ({
  handleEndTour,
}: CreateTourFlowsProps): Array<TourStep> => {
  const intl = useIntl();
  const isMultiPlanFundingOptInVisible = useIsMultiPlanFundingOptInVisible();

  // Multi-plan learner credit (ENT-12446): the existing step also mentions the "Multi-plan funding" settings tab.
  // Only when the opt-in UI is enabled (feature flag + customer switch) and the tab is rendered, so nothing
  // multi-plan shows otherwise.
  const showMultiPlanFundingCopy = isMultiPlanFundingOptInVisible
    && !!global.document?.querySelector(`#${MULTI_PLAN_FUNDING_TAB_TOUR_TARGET}`);

  return [
    {
      title: intl.formatMessage(messages.viewSetUpPreferencesTitle),
      target: `#${TOUR_TARGETS.SETTINGS_SIDEBAR}`,
      placement: 'right',
      body: intl.formatMessage(
        showMultiPlanFundingCopy ? messages.viewSetUpPreferencesWithMultiPlanFunding : messages.viewSetUpPreferences,
      ),
      onEnd: () => handleEndTour(
        ADMIN_TOUR_EVENT_NAMES.SET_UP_PREFERENCES_COMPLETED_EVENT_NAME,
        configuration.ADMIN_ONBOARDING_UUIDS.FLOW_PREFERENCES_UUID,
      ),
    },
  ];
};

export default SetUpPreferencesFlow;
