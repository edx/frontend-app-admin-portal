import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm, SubmissionError } from 'redux-form';
import { Button, Icon, Modal } from '@edx/paragon';
import isEmail from 'validator/lib/isEmail';

import H3 from '../H3';
import TextAreaAutoSize from '../TextAreaAutoSize';
import StatusAlert from '../StatusAlert';
import BulkAssignFields from './BulkAssignFields';
import IndividualAssignFields from './IndividualAssignFields';

import emailTemplate from './emailTemplate';

import './CodeAssignmentModal.scss';

class CodeAssignmentModal extends React.Component {
  constructor(props) {
    super(props);

    this.errorMessageRef = React.createRef();
    this.modalRef = React.createRef();

    this.validateFormData = this.validateFormData.bind(this);
    this.handleModalSubmit = this.handleModalSubmit.bind(this);
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

    const errorMessageRef = this.errorMessageRef && this.errorMessageRef.current;

    if (submitSucceeded && submitSucceeded !== prevProps.submitSucceeded) {
      onClose();
    }

    if (submitFailed && error !== prevProps.error && errorMessageRef) {
      // When there is an new error, focus on the error message status alert
      errorMessageRef.focus();
    }
  }

  validateBulkAssign(formData) {
    const {
      data: {
        unassignedCodes,
        selectedCodes,
      },
    } = this.props;

    const textAreaKey = 'email-addresses';
    const csvFileKey = 'csv-email-addresses';

    const textAreaEmails = formData[textAreaKey] && formData[textAreaKey].split('\n');
    const csvEmails = formData[csvFileKey];

    const hasSelectedCodes = selectedCodes.length > 0;

    const getTooManyAssignmentsMessage = ({ isCsv = false, emails, numAvailableCodes }) => (
      `You have ${numAvailableCodes} ${numAvailableCodes > 1 ? 'codes' : 'code'} left, but ${isCsv ? 'your file has' : 'you entered'} ${emails.length} emails. Please try again.`
    );

    const invalidEmailsMessage = 'One or more email addresses is not valid. Please try again.';

    const errors = {
      _error: [],
    };

    /* eslint-disable no-underscore-dangle */
    if (!textAreaEmails && !csvEmails) {
      errors._error.push((
        'No email addresses provided. Either manually enter email addresses or upload a CSV file.'
      ));
    } else if (textAreaEmails && csvEmails) {
      errors._error.push((
        'You uploaded a CSV and manually entered email addresses. Please only use one of these fields.'
      ));
    } else if (textAreaEmails && !textAreaEmails.every(email => isEmail(email))) {
      errors[textAreaKey] = invalidEmailsMessage;
      errors._error.push(invalidEmailsMessage);
    } else if (textAreaEmails && textAreaEmails.length > unassignedCodes) {
      const message = getTooManyAssignmentsMessage({
        emails: textAreaEmails,
        numAvailableCodes: unassignedCodes,
      });

      errors[textAreaKey] = message;
      errors._error.push(message);
    } else if (textAreaEmails && hasSelectedCodes && textAreaEmails.length > selectedCodes.length) {
      const message = getTooManyAssignmentsMessage({
        emails: textAreaEmails,
        numAvailableCodes: selectedCodes.length,
      });

      errors[textAreaKey] = message;
      errors._error.push(message);
    } else if (csvEmails && !csvEmails.every(email => isEmail(email))) {
      errors[csvFileKey] = invalidEmailsMessage;
      errors._error.push(invalidEmailsMessage);
    } else if (csvEmails && csvEmails.length > unassignedCodes) {
      const message = getTooManyAssignmentsMessage({
        isCsv: true,
        emails: csvEmails,
        numAvailableCodes: unassignedCodes,
      });

      errors[csvFileKey] = message;
      errors._error.push(message);
    } else if (csvEmails && hasSelectedCodes && csvEmails.length > selectedCodes.length) {
      const message = getTooManyAssignmentsMessage({
        isCsv: true,
        emails: csvEmails,
        numAvailableCodes: selectedCodes.length,
      });

      errors[csvFileKey] = message;
      errors._error.push(message);
    }
    /* eslint-enable no-underscore-dangle */

    return errors;
  }

  validateIndividualAssign(formData) {
    const inputKey = 'email-address';
    const emailAddress = formData[inputKey];

    const errors = {
      _error: [],
    };

    /* eslint-disable no-underscore-dangle */
    if (!emailAddress) {
      const message = 'No email address provided. Please enter a valid email address.';
      errors[inputKey] = message;
      errors._error.push(message);
    } else if (emailAddress && !isEmail(emailAddress)) {
      const message = 'The email address is not valid. Please try again.';
      errors[inputKey] = message;
      errors._error.push(message);
    }
    /* eslint-enable no-underscore-dangle */

    return errors;
  }

  validateFormData(formData) {
    const { isBulkAssign } = this.props;
    const emailTemplateKey = 'email-template';

    let errors;

    if (isBulkAssign) {
      errors = this.validateBulkAssign(formData);
    } else {
      errors = this.validateIndividualAssign(formData);
    }

    /* eslint-disable no-underscore-dangle */
    if (!formData[emailTemplateKey]) {
      const message = 'An email template is required.';
      errors[emailTemplateKey] = message;
      errors._error.push(message);
    }

    if (Object.keys(errors) > 1 || errors._error.length > 0) {
      throw new SubmissionError(errors);
    }
    /* eslint-enable no-underscore-dangle */
  }

  hasIndividualAssignData() {
    const { data } = this.props;
    return ['code', 'remainingUses'].every(key => key in data);
  }

  handleModalSubmit(formData) {
    const {
      isBulkAssign,
      data,
      sendCodeAssignment,
    } = this.props;

    // Validate form data
    this.validateFormData(formData);

    // Configure the options to send to the assignment API endpoint
    const options = {
      template: formData['email-template'],
    };

    if (isBulkAssign) {
      const hasTextAreaEmails = !!formData['email-addresses'];
      options.emails = hasTextAreaEmails ? formData['email-addresses'].split('\n') : formData['csv-email-addresses'];

      // TODO get selected codes OR ignore this key if assigning all available codes
      options.codes = data.selectedCodes;
    } else {
      options.emails = [formData['email-address']];
      options.codes = [data.code];
    }

    return sendCodeAssignment(options)
      .then((response) => {
        this.props.onSuccess(response);
      })
      .catch((error) => {
        throw new SubmissionError({
          _error: [error.message],
        });
      });
  }

  renderBody() {
    const {
      data,
      isBulkAssign,
      submitFailed,
    } = this.props;

    return (
      <React.Fragment>
        {submitFailed && this.renderErrorMessage()}
        <div className="assignment-details mb-4">
          {isBulkAssign && data.unassignedCodes && (
            <React.Fragment>
              <p>Unassigned Codes: {data.unassignedCodes}</p>
              {data.selectedCodes.length > 0 && <p>Selected Codes: {data.selectedCodes.length}</p>}
            </React.Fragment>
          )}
          {!isBulkAssign && this.hasIndividualAssignData() && (
            <React.Fragment>
              <p>Code: {data.code}</p>
              <p>Remaining Uses: {data.remainingUses}</p>
            </React.Fragment>
          )}
        </div>
        <form onSubmit={e => e.preventDefault()}>
          {isBulkAssign && <BulkAssignFields />}
          {!isBulkAssign && <IndividualAssignFields />}

          <div className="mt-4">
            <H3>Email Template</H3>
            <Field
              id="email-template"
              name="email-template"
              component={TextAreaAutoSize}
              label={
                <React.Fragment>
                  Customize Message
                  <span className="required">*</span>
                </React.Fragment>
              }
              required
            />
          </div>
        </form>
      </React.Fragment>
    );
  }

  renderErrorMessage() {
    const { error } = this.props;

    return (
      <div
        ref={this.errorMessageRef}
        tabIndex="-1"
      >
        <StatusAlert
          alertType="danger"
          iconClassNames={['fa', 'fa-times-circle']}
          title="Unable to assign codes"
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

  renderTitle() {
    const { title } = this.props;

    return (
      <React.Fragment>
        <span className="d-block">{title}</span>
        <small>Code Assignment</small>
      </React.Fragment>
    );
  }

  render() {
    const {
      isBulkAssign,
      onClose,
      submitting,
      handleSubmit,
    } = this.props;

    return (
      <React.Fragment>
        <Modal
          ref={this.modalRef}
          title={this.renderTitle()}
          body={this.renderBody()}
          buttons={[
            <Button
              label={
                <React.Fragment>
                  {submitting && <Icon className={['fa', 'fa-spinner', 'fa-spin', 'mr-2']} />}
                  {`Assign ${isBulkAssign ? 'Codes' : 'Code'}`}
                </React.Fragment>
              }
              disabled={submitting}
              buttonType="primary"
              onClick={handleSubmit(this.handleModalSubmit)}
            />,
          ]}
          onClose={onClose}
          open
        />
      </React.Fragment>
    );
  }
}

CodeAssignmentModal.defaultProps = {
  error: null,
  isBulkAssign: false,
  data: {},
};

CodeAssignmentModal.propTypes = {
  // props From redux-form
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  submitSucceeded: PropTypes.bool.isRequired,
  submitFailed: PropTypes.bool.isRequired,
  error: PropTypes.arrayOf(PropTypes.string),

  // custom props
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  sendCodeAssignment: PropTypes.func.isRequired,
  isBulkAssign: PropTypes.bool,
  data: PropTypes.shape({}),
};

export default reduxForm({
  form: 'code-assignment-modal-form',
  initialValues: {
    'email-template': emailTemplate,
  },

})(CodeAssignmentModal);
