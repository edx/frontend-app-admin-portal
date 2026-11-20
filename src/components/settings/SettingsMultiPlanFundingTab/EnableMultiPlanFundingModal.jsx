import React from 'react';
import PropTypes from 'prop-types';
import {
  ActionRow, Button, ModalDialog, StatefulButton,
} from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import messages from './messages';

/**
 * Confirms adding a plan to the multi-plan pool (Figma "Add this plan to the multi-plan pool?").
 */
const EnableMultiPlanFundingModal = ({
  isOpen,
  isSaving,
  onCancel,
  onConfirm,
  planName,
}) => {
  const intl = useIntl();
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onCancel}
      title={intl.formatMessage(messages.confirmModalTitle)}
      hasCloseButton={false}
      isOverflowVisible={false}
    >
      <ModalDialog.Header>
        <ModalDialog.Title>
          <FormattedMessage {...messages.confirmModalTitle} />
        </ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <p>
          <FormattedMessage {...messages.confirmModalBody} values={{ planName }} />
        </p>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <Button variant="tertiary" onClick={onCancel} disabled={isSaving}>
            <FormattedMessage {...messages.confirmModalCancel} />
          </Button>
          <StatefulButton
            variant="primary"
            state={isSaving ? 'pending' : 'default'}
            labels={{
              default: intl.formatMessage(messages.confirmModalEnable),
              pending: intl.formatMessage(messages.saving),
            }}
            disabledStates={['pending']}
            onClick={onConfirm}
          />
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

EnableMultiPlanFundingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  planName: PropTypes.string.isRequired,
};

export default EnableMultiPlanFundingModal;
