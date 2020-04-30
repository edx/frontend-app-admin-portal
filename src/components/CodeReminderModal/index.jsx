import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm, SubmissionError } from 'redux-form';
import { Button, Icon, Modal } from '@edx/paragon';
import SaveTemplateButton from '../../containers/SaveTemplateButton';

import H3 from '../H3';
import TextAreaAutoSize from '../TextAreaAutoSize';
import StatusAlert from '../StatusAlert';
import TemplateSourceFields from '../TemplateSourceFields';

import { validateEmailTemplateFields } from '../../utils';
import { EMAIL_TEMPLATE_FIELD_MAX_LIMIT } from '../../data/constants/emailTemplate';

import './CodeReminderModal.scss';

class CodeReminderModal extends React.Component {
  constructor(props) {
    super(props);

    this.errorMessageRef = React.createRef();
    this.modalRef = React.createRef();

    this.state = {
      mode: 'remind',
      fields: {
        'email-template-greeting': null,
        'email-template-closing': null,
      },
    };

    this.setMode = this.setMode.bind(this);
    this.validateFormData = this.validateFormData.bind(this);
    this.handleModalSubmit = this.handleModalSubmit.bind(this);
    this.handleFieldOnChange = this.handleFieldOnChange.bind(this);
    this.getNumberOfSelectedCodes = this.getNumberOfSelectedCodes.bind(this);
    this.renderSaveTemplateMessage = this.renderSaveTemplateMessage.bind(this);
  }

  componentDidMount() {
    const { current: { firstFocusableElement } } = this.modalRef;

    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
  }

  componentDidUpdate(prevProps) {
    const {
      submitFailed,
      submitSucceeded,
      onClose,
      error,
    } = this.props;
    const {
      mode,
    } = this.state;

    const errorMessageRef = this.errorMessageRef && this.errorMessageRef.current;

    if (mode === 'remind' && submitSucceeded && submitSucceeded !== prevProps.submitSucceeded) {
      onClose();
    }

    if (submitFailed && error !== prevProps.error && errorMessageRef) {
      // When there is an new error, focus on the error message status alert
      errorMessageRef.focus();
    }
  }

  getNumberOfSelectedCodes() {
    const {
      data: { selectedCodes },
      couponDetailsTable: { data: tableData },
    } = this.props;
    let numberOfSelectedCodes = 0;
    if (selectedCodes && selectedCodes.length) {
      numberOfSelectedCodes = selectedCodes.length;
    } else if (tableData && tableData.count) {
      numberOfSelectedCodes = tableData.count;
    }
    return numberOfSelectedCodes;
  }

  setMode(mode) {
    this.setState({ mode });
  }

  validateFormData(formData) {
    const emailTemplateKey = 'email-template-body';

    /* eslint-disable no-underscore-dangle */
    const errors = validateEmailTemplateFields(formData);

    if (!formData[emailTemplateKey]) {
      const message = 'An email template is required.';
      errors[emailTemplateKey] = message;
      errors._error.push(message);
    }

    if (errors._error.length > 0) {
      throw new SubmissionError(errors);
    }
    /* eslint-enable no-underscore-dangle */
  }

  hasIndividualRemindData() {
    const { data } = this.props;
    return ['code', 'email'].every(key => key in data);
  }

  handleFieldOnChange(event, newValue, previousValue, name) {
    this.setState(prevState => ({
      fields: {
        ...prevState.fields,
        [name]: newValue,
      },
    }));
  }

  isSaveDisabled() {
    const { initialValues, submitting } = this.props;
    const fieldValues = Object.values(this.state.fields);
    const fields = Object.entries(this.state.fields);
    const maxFieldLength = EMAIL_TEMPLATE_FIELD_MAX_LIMIT;

    // disable button if form is in submitting state
    if (submitting) return true;

    // disable button if any field as text greater than allowed limit
    const valueNotInRange = fieldValues.some(value => value && value.length > maxFieldLength);
    if (valueNotInRange) return true;

    // enable button if any field value has changed and new value is different from original value
    const changed = fields.some(([key, value]) => value !== null && value !== initialValues[key]);
    if (changed) return false;

    return true;
  }

  handleModalSubmit(formData) {
    const {
      couponId,
      isBulkRemind,
      selectedToggle,
      data,
      sendCodeReminder,
    } = this.props;
    this.setMode('remind');

    // Validate form data
    this.validateFormData(formData);

    // Configure the options to send to the assignment reminder API endpoint
    const options = {
      template: formData['email-template-body'],
      template_greeting: formData['email-template-greeting'],
      template_closing: formData['email-template-closing'],
    };

    if (isBulkRemind && !data.selectedCodes.length) {
      options.code_filter = selectedToggle;
    } else if (isBulkRemind && data.selectedCodes.length) {
      options.assignments = data.selectedCodes.map(code => ({
        email: code.assigned_to,
        code: code.code,
      }));
    } else {
      options.assignments = [{ email: data.email, code: data.code }];
    }

    return sendCodeReminder(couponId, options)
      .then((response) => {
        this.props.onSuccess(response);
      })
      .catch((error) => {
        throw new SubmissionError({
          _error: [error.message],
        });
      });
    /* eslint-enable no-underscore-dangle */
  }

  renderBody() {
    const {
      data,
      isBulkRemind,
      submitFailed,
      submitSucceeded,
    } = this.props;
    const {
      mode,
    } = this.state;

    const numberOfSelectedCodes = this.getNumberOfSelectedCodes();

    return (
      <React.Fragment>
        {submitFailed && this.renderErrorMessage()}
        {mode === 'save' && submitSucceeded && this.renderSaveTemplateMessage()}
        <div className="assignment-details mb-4">
          {!isBulkRemind && this.hasIndividualRemindData() && (
            <React.Fragment>
              <p>Code: {data.code}</p>
              <p>Email: {data.email}</p>
            </React.Fragment>
          )}
          {isBulkRemind && numberOfSelectedCodes > 0 && (
            <React.Fragment>
              <p className="bulk-selected-codes">Selected Codes: {numberOfSelectedCodes}</p>
            </React.Fragment>
          )}
        </div>
        <form onSubmit={e => e.preventDefault()}>
          <div className="mt-4">
            <H3>Email Template</H3>
            <TemplateSourceFields />
            <Field
              id="email-template-greeting"
              name="email-template-greeting"
              component={TextAreaAutoSize}
              label="Customize Greeting"
              onChange={this.handleFieldOnChange}
            />
            <Field
              id="email-template-body"
              name="email-template-body"
              component={TextAreaAutoSize}
              label="Body"
              disabled
            />
            <Field
              id="email-template-closing"
              name="email-template-closing"
              component={TextAreaAutoSize}
              label="Customize Closing"
              onChange={this.handleFieldOnChange}
            />
          </div>
        </form>
      </React.Fragment>
    );
  }

  renderErrorMessage() {
    const modeErrors = {
      remind: 'Unable to send reminder email',
      save: 'Unable to save template',
    };
    const { error } = this.props;
    const { mode } = this.state;

    return (
      <div
        ref={this.errorMessageRef}
        tabIndex="-1"
      >
        <StatusAlert
          alertType="danger"
          iconClassName="fa fa-times-circle"
          title={modeErrors[mode]}
          message={error.length > 1 ? (
            <ul className="m-0 pl-4">
              {error.map(message => <li key={message}>{message}</li>)}
            </ul>
          ) : (
            error[0]
          )}
        />
      </div>
    );
  }

  renderSaveTemplateMessage() {
    return (
      <div
        ref={this.errorMessageRef}
        tabIndex="-1"
      >
        <StatusAlert
          alertType="success"
          iconClassName="fa fa-check"
          message="Template saved successfully"
          dismissible
        />
      </div>
    );
  }

  renderTitle() {
    const { title, data } = this.props;
    return (
      <React.Fragment>
        <span className="d-block">{title}</span>
        <small>
          {data.selectedCodes && data.selectedCodes.length === 0 ? 'Remind All' : 'Assignment Reminder'}
        </small>
      </React.Fragment>
    );
  }

  render() {
    const {
      onClose,
      submitting,
      handleSubmit,
    } = this.props;
    const {
      mode,
    } = this.state;

    return (
      <React.Fragment>
        <Modal
          ref={this.modalRef}
          title={this.renderTitle()}
          body={this.renderBody()}
          buttons={[
            <Button
              key="remind-submit-btn"
              disabled={submitting}
              className="code-remind-save-btn btn-primary"
              onClick={handleSubmit(this.handleModalSubmit)}
            >
              <React.Fragment>
                {mode === 'remind' && submitting && <Icon className="fa fa-spinner fa-spin mr-2" />}
                {'Remind'}
              </React.Fragment>
            </Button>,
            <SaveTemplateButton
              key="save-remind-template-btn"
              templateType="remind"
              setMode={this.setMode}
              handleSubmit={handleSubmit}
              disabled={this.isSaveDisabled()}
            />,
          ]}
          onClose={onClose}
          open
        />
      </React.Fragment>
    );
  }
}

CodeReminderModal.defaultProps = {
  error: null,
  isBulkRemind: false,
  data: {},
  selectedToggle: null,
  couponDetailsTable: {},
};

CodeReminderModal.propTypes = {
  // props From redux-form
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  submitSucceeded: PropTypes.bool.isRequired,
  submitFailed: PropTypes.bool.isRequired,
  error: PropTypes.arrayOf(PropTypes.string),

  // custom props
  couponId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  sendCodeReminder: PropTypes.func.isRequired,
  couponDetailsTable: PropTypes.shape({
    data: PropTypes.shape({
      count: PropTypes.number,
    }),
  }),
  initialValues: PropTypes.shape({}).isRequired,
  isBulkRemind: PropTypes.bool,
  selectedToggle: PropTypes.string,
  data: PropTypes.shape({
    selectedCodes: PropTypes.arrayOf(PropTypes.shape({})),
    code: PropTypes.string,
    email: PropTypes.string,
  }),
};

export default reduxForm({
  form: 'code-reminder-modal-form',
})(CodeReminderModal);
