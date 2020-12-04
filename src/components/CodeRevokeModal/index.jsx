import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm, SubmissionError } from 'redux-form';
import {
  Button, Icon, Input, Modal,
} from '@edx/paragon';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import SaveTemplateButton from '../../containers/SaveTemplateButton';

import TextAreaAutoSize from '../TextAreaAutoSize';
import RenderField from '../RenderField';
import StatusAlert from '../StatusAlert';
import TemplateSourceFields from '../../containers/TemplateSourceFields';
import IconWithTooltip from '../IconWithTooltip';

import { validateEmailTemplateFields } from '../../utils';

class CodeRevokeModal extends React.Component {
  constructor(props) {
    super(props);

    this.errorMessageRef = React.createRef();
    this.modalRef = React.createRef();

    this.state = {
      mode: 'revoke',
      doNotEmail: false,
    };

    this.setMode = this.setMode.bind(this);
    this.setDoNotEmail = this.setDoNotEmail.bind(this);
    this.validateFormData = this.validateFormData.bind(this);
    this.handleModalSubmit = this.handleModalSubmit.bind(this);
    this.doNotEmailField = this.doNotEmailField.bind(this);
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

    if (mode === 'revoke' && submitSucceeded && submitSucceeded !== prevProps.submitSucceeded) {
      onClose();
    }

    if (submitFailed && error !== prevProps.error && errorMessageRef) {
      // When there is an new error, focus on the error message status alert
      errorMessageRef.focus();
    }
  }

  setMode(mode) {
    this.setState({ mode });
  }

  setDoNotEmail(doNotEmail) {
    this.setState({ doNotEmail });
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

  hasIndividualRevokeData() {
    const { data } = this.props;
    return ['code', 'assigned_to'].every(key => key in data);
  }

  handleModalSubmit(formData) {
    const {
      couponId,
      isBulkRevoke,
      data,
      sendCodeRevoke,
    } = this.props;

    const { doNotEmail } = this.state;

    /* eslint-disable no-underscore-dangle */
    const errors = {
      _error: [],
    };

    this.setMode('revoke');

    // Validate form data
    this.validateFormData(formData);

    const options = {
      template: formData['email-template-body'],
      template_subject: formData['email-template-subject'],
      template_greeting: formData['email-template-greeting'],
      template_closing: formData['email-template-closing'],
      do_not_email: doNotEmail,
    };

    if (formData['template-id']) {
      options.template_id = formData['template-id'];
    }

    if (isBulkRevoke) {
      if (!data.selectedCodes.length) {
        errors._error.push('At least one code must be selected.');
        throw new SubmissionError(errors);
      }

      options.assignments = data.selectedCodes.map(code => ({
        email: code.assigned_to,
        code: code.code,
      }));
    } else {
      options.assignments = [{ email: data.assigned_to, code: data.code }];
    }

    return sendCodeRevoke(couponId, options)
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

  doNotEmailField({ input }) {
    const { doNotEmail } = this.state;

    return (
      <div className="do-not-email-wrapper">
        <label className="ml-4">
          <Input
            {...input}
            type="checkbox"
            checked={doNotEmail}
            id="doNotEmailCheckbox"
          />
          Do not email
        </label>
        <IconWithTooltip
          icon={faInfoCircle}
          altText="More information"
          tooltipText="By clicking this box, you can revoke this coupon code without emailing the learner."
        />
      </div>
    );
  }

  renderBody() {
    const {
      data,
      isBulkRevoke,
      submitFailed,
    } = this.props;

    const { doNotEmail } = this.state;

    return (
      <>
        {submitFailed && this.renderErrorMessage()}
        <div className="assignment-details mb-4">
          {isBulkRevoke && (
            <>
              {data.selectedCodes.length > 0 && <p className="bulk-selected-codes">Selected Codes: {data.selectedCodes.length}</p>}
            </>
          )}
          {!isBulkRevoke && this.hasIndividualRevokeData() && (
            <>
              <p className="code">Code: {data.code}</p>
              <p className="email">Email: {data.assigned_to}</p>
            </>
          )}
        </div>
        <form onSubmit={e => e.preventDefault()}>
          <div className="mt-4">
            <h3>Email Template</h3>
            <TemplateSourceFields emailTemplateType="revoke" disabled={doNotEmail} />
            <Field
              id="email-template-subject"
              name="email-template-subject"
              component={RenderField}
              type="text"
              label="Customize Email Subject"
              disabled={doNotEmail}
            />
            <Field
              id="email-template-greeting"
              name="email-template-greeting"
              component={TextAreaAutoSize}
              label="Customize Greeting"
              disabled={doNotEmail}
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
              disabled={doNotEmail}
            />
            <Field
              name="do-not-email"
              component={this.doNotEmailField}
              onChange={(event, newValue) => {
                this.setDoNotEmail(newValue);
              }}
            />

          </div>
        </form>
      </>
    );
  }

  renderErrorMessage() {
    const modeErrors = {
      revoke: 'Unable to revoke code(s)',
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

  renderTitle() {
    return this.props.title;
  }

  render() {
    const {
      onClose,
      submitting,
      handleSubmit,
    } = this.props;
    const {
      mode,
      doNotEmail,
    } = this.state;

    return (
      <>
        <Modal
          ref={this.modalRef}
          dialogClassName="code-revoke"
          title={this.renderTitle()}
          body={this.renderBody()}
          buttons={[
            <Button
              key="revoke-submit-btn"
              disabled={submitting}
              className="code-revoke-save-btn"
              onClick={handleSubmit(this.handleModalSubmit)}
            >
              <>
                {mode === 'revoke' && submitting && <Icon className="fa fa-spinner fa-spin mr-2" />}
                Revoke
              </>
            </Button>,
            <SaveTemplateButton
              key="save-revoke-template-btn"
              templateType="revoke"
              setMode={this.setMode}
              handleSubmit={handleSubmit}
              disabled={doNotEmail}
            />,
          ]}
          onClose={onClose}
          open
        />
      </>
    );
  }
}

CodeRevokeModal.defaultProps = {
  error: null,
  isBulkRevoke: false,
  data: {},
};

CodeRevokeModal.propTypes = {
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
  sendCodeRevoke: PropTypes.func.isRequired,
  isBulkRevoke: PropTypes.bool,
  data: PropTypes.shape({
    selectedCodes: PropTypes.arrayOf(PropTypes.shape({})),
    assigned_to: PropTypes.string,
    code: PropTypes.string,
  }),
  initialValues: PropTypes.shape({}).isRequired,
};

export default reduxForm({
  form: 'code-revoke-modal-form',
})(CodeRevokeModal);
