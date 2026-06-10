import React, { useContext } from 'react';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { Button, Hyperlink } from '@openedx/paragon';
import { ADMIN_TOUR_EVENT_NAMES, EDIT_HIGHLIGHTS_LEARN_MORE_URL, EDIT_HIGHLIGHTS_TARGETS } from '../constants';
import messages from '../messages';
import { TourStep } from '../../types';
import { configuration } from '../../../../config';
import { EnterpriseAppContext } from '../../../EnterpriseApp/EnterpriseAppContextProvider';

const withFlushSpotlight = (steps: Array<TourStep>): Array<TourStep> => (
  steps.map((step) => (
    step.target === `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_NEW_BUTTON}`
      ? step
      : { ...step, overlayPadding: 0 }
  ))
);

interface CreateTourFlowsProps {
  handleAdvanceTour: (advanceEventName: string) => void;
  handleEndTour: (endEventName: string, flowUuid?: string) => void;
  handleBackTour: (backEventName: string) => void;
  handleDismissTour: (dismissEventName: string) => void;
}

const EditHighlightsFlow = ({
  handleAdvanceTour,
  handleEndTour,
  handleBackTour,
  handleDismissTour,
}: CreateTourFlowsProps): Array<TourStep> => {
  const intl = useIntl();
  const { enterpriseCuration: { enterpriseCuration } } = useContext(EnterpriseAppContext);
  const hasHighlights = (enterpriseCuration?.highlightSets?.length ?? 0) > 0;
  const onAdvance = () => handleAdvanceTour(
    ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_ADVANCE_EVENT_NAME,
  );
  const onBack = () => handleBackTour(
    ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_BACK_EVENT_NAME,
  );
  const onEnd = () => handleEndTour(
    ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_COMPLETED_EVENT_NAME,
    configuration.ADMIN_ONBOARDING_UUIDS.FLOW_SHOWCASE_COURSES_UUID,
  );
  const onDismiss = () => handleDismissTour(
    ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_DISMISS_EVENT_NAME,
  );

  // Step one shows a custom "Dismiss" button next to "Next" (Paragon only renders a
  // close icon by default); it's positioned into the footer via _ProductTours.scss.
  const stepOneBody = (
    <>
      <span>{intl.formatMessage(messages.editHighlightsStepOneBody)}</span>
      <Button
        className="edit-highlights-dismiss-button"
        variant="tertiary"
        onClick={onDismiss}
      >
        {intl.formatMessage(messages.editHighlightsDismissButton)}
      </Button>
    </>
  );

  const stepThreeBody = (
    <FormattedMessage
      {...messages.editHighlightsStepThreeBody}
      values={{
        a: (chunks) => (
          <Hyperlink
            destination={EDIT_HIGHLIGHTS_LEARN_MORE_URL}
            target="_blank"
          >
            {chunks}
          </Hyperlink>
        ),
      }}
    />
  );

  // No highlight sets → condensed 3-step flow (decided by highlight-set existence,
  // not admin tenure). The omitted tab/card steps need an existing highlight set to
  // anchor to. Admins with highlight sets keep the 5-step flow below.
  if (!hasHighlights) {
    return withFlushSpotlight([
      {
        target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SIDEBAR}`,
        placement: 'right',
        title: intl.formatMessage(messages.editHighlightsPopupOneTitle),
        body: stepOneBody,
        onAdvance,
      },
      {
        // Anchor the popup to the card footer (`right`) so it sits low — beside the New
        // highlight button — with the arrow at the popup's middle pointing at the button.
        // The footer is full-width (unlike the inset button), so the popup clears the
        // card's right edge. (Targeted by class: Paragon's Card.Footer forwards className,
        // not id.) Spotlight the whole zero-state card, stretched up to the tabs.
        target: `.${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_ZERO_STATE_FOOTER}`,
        overlayTarget: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_ZERO_STATE_CARD}`,
        overlayTopTarget: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SECTION}`,
        placement: 'right',
        body: stepThreeBody,
        onAdvance,
        onBack,
      },
      {
        // `top-start` left-aligns the popup to the tab (extends right); `top` would
        // center it and spill off the left edge.
        target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_CATALOG_VISIBILITY_TAB}`,
        placement: 'top-start',
        body: intl.formatMessage(messages.editHighlightsStepFourBody),
        onBack,
        onEnd,
      },
    ]);
  }

  return withFlushSpotlight([
    {
      target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SIDEBAR}`,
      placement: 'right',
      title: intl.formatMessage(messages.editHighlightsPopupOneTitle),
      body: stepOneBody,
      onAdvance,
    },
    {
      // Spotlight the whole section but anchor the popup to the Highlights tab so its
      // arrow points at it; `top-start` keeps it clear of the sidebar.
      target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_TAB}`,
      overlayTarget: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SECTION}`,
      placement: 'top-start',
      body: intl.formatMessage(messages.editHighlightsStepTwoBody),
      onAdvance,
      onBack,
    },
    {
      target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_NEW_BUTTON}`,
      overlayPadding: 3,
      placement: 'left',
      body: stepThreeBody,
      onAdvance,
      onBack,
    },
    {
      // `top-start` left-aligns the popup to the tab (extends right), like the
      // 3-step flow's catalog step, instead of centering it.
      target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_CATALOG_VISIBILITY_TAB}`,
      placement: 'top-start',
      body: intl.formatMessage(messages.editHighlightsStepFourBody),
      onAdvance,
      onBack,
    },
    {
      // Spotlight the left portion of the section (through the card, before the New
      // button); anchor the popup to the card so its arrow points at it.
      target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHT_SET_CARD}`,
      overlayTarget: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SECTION}`,
      overlayWidthRatio: 0.6,
      placement: 'right',
      body: intl.formatMessage(messages.editHighlightsStepFiveBody),
      onBack,
      onEnd,
    },
  ]);
};

export default EditHighlightsFlow;
