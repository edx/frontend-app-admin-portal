import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm, SubmissionError } from 'redux-form';
import { Button, Icon, Modal } from '@edx/paragon';

import StatusAlert from '../StatusAlert';

import NewRelicService from '../../data/services/NewRelicService';

class LicenseRevokeModal extends React.Component {
  constructor(props) {
    super(props);

    this.errorMessageRef = React.createRef();
    this.modalRef = React.createRef();

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

  handleModalSubmit() {
    const {
      user,
      sendLicenseRevoke,
      fetchSubscriptionDetails,
      fetchSubscriptionUsers,
      searchQuery,
    } = this.props;
    const options = { userId: user.userId };

    return sendLicenseRevoke(options)
      .then(async (response) => {
        try {
          await fetchSubscriptionDetails();
          await fetchSubscriptionUsers({ searchQuery });
          this.props.onSuccess(response);
        } catch (error) {
          NewRelicService.logAPIErrorResponse(error);
        }
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
      user,
      submitFailed,
    } = this.props;

    return (
      <React.Fragment>
        {submitFailed && this.renderErrorMessage()}
        <div className="license-details mb-4">
          <React.Fragment>
            <p className="message" >Revoking a license will remove access to the subscription catalog
              for {user.emailAddress}. To re-enable access, you can assign this user to another
              license.
            </p>
          </React.Fragment>
        </div>
      </React.Fragment>
    );
  }

  renderErrorMessage() {
    const modalErrors = {
      revoke: 'Unable to revoke license',
    };
    const { error } = this.props;

    return (
      <div
        ref={this.errorMessageRef}
        tabIndex="-1"
      >
        <StatusAlert
          alertType="danger"
          iconClassName="fa fa-times-circle"
          title={modalErrors.revoke}
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
    return <small>Are you sure you want to revoke access?</small>;
  }

  render() {
    const {
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
              key="revoke-submit-btn"
              disabled={submitting}
              className="license-revoke-save-btn btn-primary"
              onClick={handleSubmit(this.handleModalSubmit)}
            >
              <React.Fragment>
                {submitting && <Icon className="fa fa-spinner fa-spin mr-2" />}
                {'Revoke Access'}
              </React.Fragment>
            </Button>,
          ]}
          closeText="Cancel"
          onClose={onClose}
          open
        />
      </React.Fragment>
    );
  }
}

LicenseRevokeModal.defaultProps = {
  error: null,
  searchQuery: null,
};

LicenseRevokeModal.propTypes = {
  // props From redux-form
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  submitSucceeded: PropTypes.bool.isRequired,
  submitFailed: PropTypes.bool.isRequired,
  error: PropTypes.arrayOf(PropTypes.string),

  // custom props
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  sendLicenseRevoke: PropTypes.func.isRequired,
  user: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    emailAddress: PropTypes.string.isRequired,
    licenseStatus: PropTypes.string.isRequired,
  }).isRequired,
  fetchSubscriptionDetails: PropTypes.func.isRequired,
  fetchSubscriptionUsers: PropTypes.func.isRequired,
  searchQuery: PropTypes.string,
};

export default reduxForm({
  form: 'license-revoke-modal-form',
})(LicenseRevokeModal);
