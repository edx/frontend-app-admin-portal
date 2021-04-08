import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormControl } from '@edx/paragon';

const RenderField = ({
  input,
  label,
  type,
  description,
  disabled,
  required,
  meta: { touched, error },
}) => (
  <Form.Group>
    <Form.Label>{label}</Form.Label>
    <Form.Control
      {...input}
      type={type}
      description={description}
      disabled={disabled}
      required={required}
      isValid={touched && !error}
      isInvalid={touched && error}
    />
    {error && <FormControl.Feedback type="invalid">{error}</FormControl.Feedback>}
    {description && <Form.Text>{description}</Form.Text>}
  </Form.Group>
);

RenderField.defaultProps = {
  description: null,
  disabled: false,
  required: false,
};

RenderField.propTypes = {
  input: PropTypes.shape({}).isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  type: PropTypes.string.isRequired,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string,
  }).isRequired,
  description: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
};

export default RenderField;
