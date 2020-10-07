import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm, SubmissionError } from 'redux-form';
import { Button, Icon, Modal } from '@edx/paragon';

import StatusAlert from '../StatusAlert';

import NewRelicService from '../../data/services/NewRelicService';

import './LicenseRevokeModal.scss';

class LicenseRevokeModal extends React.Component {
  constructor(props) {
    super(props);

    this.errorMessageRef = React.createRef();

    this.handleModalSubmit = this.handleModalSubmit.bind(this);
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
      currentPage,
      subscriptionPlan,
    } = this.props;
    const options = { user_email: user.userEmail };

    return sendLicenseRevoke(subscriptionPlan.uuid, options)
      .then(async (response) => {
        try {
          await fetchSubscriptionDetails();
          await fetchSubscriptionUsers({ searchQuery, currentPage });
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
      subscriptionPlan,
      licenseOverview,
    } = this.props;

    const { revocations } = subscriptionPlan;

    return (
      <React.Fragment>
        <StatusAlert
          alertType="warning"
          message={
            <p className="m-0">
              You have already revoked {revocations.applied} licenses. You
              have {revocations.remaining} left on your plan.
            </p>
          }
        />
        <div className="license-details">
          <React.Fragment>
            {submitFailed && this.renderErrorMessage()}
            <p>
              Revoking a license will remove access to the subscription catalog
              for <strong>{user.userEmail}</strong>. They will still be able to
              access their courses in the audit track and their certificates.
            </p>
            <p>
              This action cannot be undone. To re-enable access, you can
              assign <strong>{user.userEmail}</strong> to another license, but they
              will need to re-enroll in any course after being assigned a new license.
            </p>
            <p>
              You have <strong>{licenseOverview.assigned}</strong> licenses that are
              in pending status that could be removed or re-assigned.
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
          ) : error[0]}
        />
      </div>
    );
  }

  renderTitle() {
    return <small>Are you sure you want to revoke license?</small>;
  }

  render() {
    const {
      onClose,
      submitting,
      handleSubmit,
    } = this.props;

    return (
      <Modal
        dialogClassName="license-revoke"
        renderHeaderCloseButton={false}
        title={this.renderTitle()}
        body={this.renderBody()}
        buttons={[
          <Button
            key="revoke-submit-btn"
            disabled={submitting}
            className="license-revoke-save-btn"
            onClick={handleSubmit(this.handleModalSubmit)}
          >
            <React.Fragment>
              {submitting && <Icon className="fa fa-spinner fa-spin mr-2" />}
              Revoke license
            </React.Fragment>
          </Button>,
        ]}
        closeText="Cancel"
        onClose={onClose}
        open
      />
    );
  }
}

LicenseRevokeModal.defaultProps = {
  error: null,
  searchQuery: null,
  currentPage: null,
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
    userEmail: PropTypes.string.isRequired,
  }).isRequired,
  fetchSubscriptionDetails: PropTypes.func.isRequired,
  fetchSubscriptionUsers: PropTypes.func.isRequired,
  searchQuery: PropTypes.string,
  currentPage: PropTypes.number,
  subscriptionPlan: PropTypes.shape({
    uuid: PropTypes.string.isRequired,
    revocations: PropTypes.shape({
      applied: PropTypes.number,
      remaining: PropTypes.number,
    }).isRequired,
  }).isRequired,
  licenseOverview: PropTypes.shape({
    assigned: PropTypes.number.isRequired,
  }).isRequired,
};

export default reduxForm({
  form: 'license-revoke-modal-form',
})(LicenseRevokeModal);
