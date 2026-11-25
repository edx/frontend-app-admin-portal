import { useIntl } from '@edx/frontend-platform/i18n';
import { ADMIN_TOUR_EVENT_NAMES, MULTI_PLAN_FUNDING_SETTINGS_TARGETS } from '../constants';
import messages from '../messages';
import { TourStep } from '../../types';
import { configuration } from '../../../../config';

interface CreateTourFlowsProps {
  handleAdvanceTour: (advanceEventName: string) => void;
  handleEndTour: (endEventName: string, flowUuid?: string) => void;
  handleBackTour: (backEventName: string) => void;
}

const MultiPlanFundingSettingsFlow = ({
  handleAdvanceTour,
  handleEndTour,
  handleBackTour,
}: CreateTourFlowsProps): Array<TourStep> => {
  const intl = useIntl();
  const onAdvance = () => handleAdvanceTour(
    ADMIN_TOUR_EVENT_NAMES.MULTI_PLAN_FUNDING_ADVANCE_EVENT_NAME,
  );
  const onBack = () => handleBackTour(
    ADMIN_TOUR_EVENT_NAMES.MULTI_PLAN_FUNDING_BACK_EVENT_NAME,
  );
  const onEnd = () => handleEndTour(
    ADMIN_TOUR_EVENT_NAMES.MULTI_PLAN_FUNDING_COMPLETED_EVENT_NAME,
    configuration.ADMIN_ONBOARDING_UUIDS.FLOW_MULTI_PLAN_FUNDING_UUID,
  );

  return [
    {
      target: `#${MULTI_PLAN_FUNDING_SETTINGS_TARGETS.PLANS_TABLE}`,
      placement: 'top',
      title: intl.formatMessage(messages.multiPlanFundingTitle),
      body: intl.formatMessage(messages.multiPlanFundingStepOneBody),
      onAdvance,
    },
    {
      target: `#${MULTI_PLAN_FUNDING_SETTINGS_TARGETS.FIRST_ACTION}`,
      placement: 'left',
      body: intl.formatMessage(messages.multiPlanFundingStepTwoBody),
      onAdvance,
      onBack,
    },
    {
      target: `#${MULTI_PLAN_FUNDING_SETTINGS_TARGETS.POOL_STATUS_HEADER}`,
      placement: 'top',
      body: intl.formatMessage(messages.multiPlanFundingStepThreeBody),
      onAdvance,
      onBack,
    },
    {
      target: `#${MULTI_PLAN_FUNDING_SETTINGS_TARGETS.TAB_DESCRIPTION}`,
      placement: 'bottom',
      body: intl.formatMessage(messages.multiPlanFundingStepFourBody),
      onBack,
      onEnd,
    },
  ];
};

export default MultiPlanFundingSettingsFlow;
