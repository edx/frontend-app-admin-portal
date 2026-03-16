import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ActionRow,
  Button,
  Form,
  ModalDialog,
  StatefulButton,
} from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';
import LmsApiService from '../../data/services/LmsApiService';

const AddAdminModal = ({
  isOpen, onClose, enterpriseId, onSuccess,
}) => {
  const intl = useIntl();
  const [emailInput, setEmailInput] = useState('');
  const [buttonState, setButtonState] = useState('default');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const parseEmails = (input) => input
    .split(/\n+/)
    .map(email => email.trim())
    .filter(email => email.length > 0);

  const handleClose = () => {
    setEmailInput('');
    setButtonState('default');
    setErrorMessage('');
    onClose();
  };

  const handleInvite = async () => {
    const emails = parseEmails(emailInput);

    if (emails.length === 0) {
      setErrorMessage('Please add at least one email address');
      return;
    }

    if (emails.length > 10) {
      setErrorMessage('You can add a maximum of 10 email addresses');
      return;
    }

    // Validate all emails
    const invalidEmails = emails.filter(email => !validateEmail(email));
    if (invalidEmails.length > 0) {
      setErrorMessage(`Invalid email address: ${invalidEmails[0]}`);
      return;
    }

    // Check for duplicates
    const uniqueEmails = new Set(emails);
    if (uniqueEmails.size !== emails.length) {
      setErrorMessage('Duplicate email addresses found');
      return;
    }

    try {
      setButtonState('pending');
      setErrorMessage('');

      // Send invites for all emails
      await Promise.all(
        emails.map(email => LmsApiService.inviteEnterpriseAdmin(enterpriseId, { email })),
      );

      setButtonState('complete');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1000);
    } catch (error) {
      logError(error);
      setButtonState('error');
      setErrorMessage(error.message || 'Failed to invite admins');
    }
  };

  return (
    <ModalDialog
      title="Invite Admins"
      isOpen={isOpen}
      onClose={handleClose}
      hasCloseButton
      size="md"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>
          <FormattedMessage
            id="adminPortal.peopleManagement.addAdmin.modal.title"
            defaultMessage="Invite Admins"
            description="Title for add admin modal"
          />
        </ModalDialog.Title>
      </ModalDialog.Header>

      <ModalDialog.Body>
        <Form.Group>
          <Form.Label>
            <FormattedMessage
              id="adminPortal.peopleManagement.addAdmin.modal.emailLabel"
              defaultMessage="Enter email address"
              description="Label for email input in add admin modal"
            />
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={6}
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setErrorMessage('');
            }}
            placeholder=""
            isInvalid={!!errorMessage}
          />
          {errorMessage && (
            <Form.Control.Feedback type="invalid">
              {errorMessage}
            </Form.Control.Feedback>
          )}
          <Form.Text className="text-muted small mt-2">
            <FormattedMessage
              id="adminPortal.peopleManagement.addAdmin.modal.helperText"
              defaultMessage="Maximum invite at a time: 10 emails. To add more than one member, enter one email address per line."
              description="Helper text for email input"
            />
          </Form.Text>
        </Form.Group>
      </ModalDialog.Body>

      <ModalDialog.Footer>
        <ActionRow>
          <Button variant="tertiary" onClick={handleClose}>
            <FormattedMessage
              id="adminPortal.peopleManagement.addAdmin.modal.cancel"
              defaultMessage="Cancel"
              description="Cancel button text"
            />
          </Button>
          <StatefulButton
            state={buttonState}
            labels={{
              default: intl.formatMessage({
                id: 'adminPortal.peopleManagement.addAdmin.modal.submit',
                defaultMessage: 'Invite',
                description: 'Submit button text',
              }),
              pending: intl.formatMessage({
                id: 'adminPortal.peopleManagement.addAdmin.modal.submitting',
                defaultMessage: 'Inviting...',
                description: 'Submitting button text',
              }),
              complete: intl.formatMessage({
                id: 'adminPortal.peopleManagement.addAdmin.modal.success',
                defaultMessage: 'Invited!',
                description: 'Success button text',
              }),
              error: intl.formatMessage({
                id: 'adminPortal.peopleManagement.addAdmin.modal.error',
                defaultMessage: 'Try again',
                description: 'Error button text',
              }),
            }}
            onClick={handleInvite}
            variant="primary"
          />
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

AddAdminModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  enterpriseId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default AddAdminModal;
