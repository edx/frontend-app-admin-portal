import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Stack } from '@openedx/paragon';
import { Info } from '@openedx/paragon/icons';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

import AddFundsStepHeading from './AddFundsStepHeading';

/**
 * Placeholder for Add Funds steps that have not been built yet. Replace each usage in
 * `AddFundsStepper` with the real step component as it is implemented.
 */
const StepComingSoon = ({ title }) => (
  <Stack gap={4}>
    <AddFundsStepHeading>{title}</AddFundsStepHeading>
    <Alert variant="info" icon={Info}>
      <FormattedMessage
        id="lcm.budget.add.funds.step.coming.soon"
        defaultMessage="This step is under development and will be available in a future release."
        description="Placeholder message for Add Funds steps that have not been built yet"
      />
    </Alert>
  </Stack>
);

StepComingSoon.propTypes = {
  title: PropTypes.node.isRequired,
};

export default StepComingSoon;
