import React from 'react';
import PropTypes from 'prop-types';

/**
 * Heading for each Add Funds step. It is programmatically focusable so `AddFundsStepper` can
 * move focus to it when the step changes, announcing the new step to screen reader users.
 */
const AddFundsStepHeading = ({ children }) => (
  <h2 className="h3 mb-0" tabIndex={-1} data-add-funds-step-heading>
    {children}
  </h2>
);

AddFundsStepHeading.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AddFundsStepHeading;
