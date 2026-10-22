import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import {
  ActionRow, Button, Card, Stepper,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { ADD_FUNDS_STEPS, useAddFunds } from './data';
import StepComingSoon from './steps/StepComingSoon';
import messages from './messages';

const AddFundsStepper = ({ onExit }) => {
  const intl = useIntl();
  const {
    currentStepKey,
    stepRedirect,
    getStepPath,
    isFirstStep,
    isLastStep,
    canProceed,
    goToNextStep,
    goToPreviousStep,
    stepHeadingRef,
  } = useAddFunds();
  const isInitialRender = useRef(true);

  // Move focus to the new step's heading on step change (but not on first load) so keyboard and
  // screen reader users are taken to the new content.
  useEffect(() => {
    if (stepRedirect) {
      return;
    }
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [currentStepKey, stepRedirect, stepHeadingRef]);

  // TODO: replace each `StepComingSoon` with the real step component as it is built.
  const renderStepContent = (stepKey) => (
    <StepComingSoon title={intl.formatMessage(messages[stepKey])} />
  );

  // Guard: unknown/missing steps, and steps ahead of what the user has completed (deep links,
  // refreshes that cleared in-memory selections), are redirected to the furthest allowed step.
  if (stepRedirect) {
    return <Navigate to={getStepPath(stepRedirect)} replace />;
  }

  const handleBack = isFirstStep ? onExit : goToPreviousStep;

  return (
    <Stepper activeKey={currentStepKey}>
      <Card className="mb-3">
        <Stepper.Header />
      </Card>
      <Card className="mb-3">
        <Card.Section>
          {ADD_FUNDS_STEPS.map((stepKey, index) => (
            <Stepper.Step
              key={stepKey}
              eventKey={stepKey}
              index={index}
              title={intl.formatMessage(messages[stepKey])}
            >
              {renderStepContent(stepKey)}
            </Stepper.Step>
          ))}
        </Card.Section>
      </Card>
      <Card>
        <Card.Section>
          <ActionRow>
            <Button variant="outline-primary" onClick={handleBack}>
              {intl.formatMessage(messages.back)}
            </Button>
            <ActionRow.Spacer />
            {!isLastStep && (
              <Button variant="primary" onClick={goToNextStep} disabled={!canProceed}>
                {intl.formatMessage(messages.continue)}
              </Button>
            )}
          </ActionRow>
        </Card.Section>
      </Card>
    </Stepper>
  );
};

AddFundsStepper.propTypes = {
  onExit: PropTypes.func.isRequired,
};

export default AddFundsStepper;
