import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import {
  ActionRow, Button, Card, Col, Row, Stepper,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { ADD_FUNDS_STEP_KEYS, ADD_FUNDS_STEPS, useAddFunds } from './data';
import SelectAmountStep from './steps/SelectAmountStep';
import StepComingSoon from './steps/StepComingSoon';
import OrderSummary from './OrderSummary';
import messages from './messages';

const AddFundsStepper = ({ currentBalance, expirationDate, onExit }) => {
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
  } = useAddFunds();
  const stepContentRef = useRef(null);
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
    stepContentRef.current?.querySelector('[data-add-funds-step-heading]')?.focus();
  }, [currentStepKey, stepRedirect]);

  // TODO: replace each `StepComingSoon` with the real step component as it is built.
  const renderStepContent = (stepKey) => {
    switch (stepKey) {
      case ADD_FUNDS_STEP_KEYS.selectAmount:
        return <SelectAmountStep />;
      default:
        return <StepComingSoon title={intl.formatMessage(messages[stepKey])} />;
    }
  };

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
      <Row>
        <Col lg={8} className="mb-3">
          <Card className="h-100">
            <Card.Section ref={stepContentRef}>
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
        </Col>
        <Col lg={4} className="mb-3">
          <OrderSummary currentBalance={currentBalance} expirationDate={expirationDate} />
        </Col>
      </Row>
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
  currentBalance: PropTypes.number.isRequired,
  expirationDate: PropTypes.string,
  onExit: PropTypes.func.isRequired,
};

AddFundsStepper.defaultProps = {
  expirationDate: undefined,
};

export default AddFundsStepper;
