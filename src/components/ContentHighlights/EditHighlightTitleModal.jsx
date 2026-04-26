import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ActionRow,
  Alert,
  Button,
  Form,
  ModalDialog,
  StatefulButton,
} from '@openedx/paragon';
import { Info } from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';

import { MAX_HIGHLIGHT_TITLE_LENGTH } from './data/constants';

const EditHighlightTitleModal = ({
  isOpen,
  onClose,
  currentTitle,
  onSave,
}) => {
  const intl = useIntl();
  const [title, setTitle] = useState(currentTitle);
  const [saveState, setSaveState] = useState('default');
  const [saveError, setSaveError] = useState(null);

  const isInvalid = title.length > MAX_HIGHLIGHT_TITLE_LENGTH;
  const isEmpty = title.trim().length === 0;
  const isUnchanged = title === currentTitle;
  const isSaveDisabled = isInvalid || isEmpty || isUnchanged || saveState === 'pending';

  const handleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleClose = () => {
    setTitle(currentTitle);
    setSaveError(null);
    setSaveState('default');
    onClose();
  };

  const handleSave = async () => {
    if (isSaveDisabled) {
      return;
    }
    setSaveState('pending');
    try {
      await onSave(title.trim());
      setSaveState('default');
      onClose();
    } catch (error) {
      logError(error);
      setSaveError(error);
      setSaveState('default');
    }
  };

  return (
    <ModalDialog
      title={intl.formatMessage({
        id: 'highlights.edit.highlight.name.modal.title',
        defaultMessage: 'Edit highlight name',
        description: 'Title of the modal for editing a highlight set name.',
      })}
      isOpen={isOpen}
      onClose={handleClose}
      hasCloseButton
      isFullscreenOnMobile={false}
      data-testid="edit-highlight-title-modal"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>
          <FormattedMessage
            id="highlights.edit.highlight.name.modal.title"
            defaultMessage="Edit highlight name"
            description="Title of the modal for editing a highlight set name."
          />
        </ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <Alert
          show={!!saveError}
          onClose={() => setSaveError(null)}
          variant="danger"
          dismissible
          closeLabel={intl.formatMessage({
            id: 'highlights.edit.highlight.name.modal.error.dismiss',
            defaultMessage: 'Dismiss',
            description: 'Dismiss button label for the error alert in the edit highlight name modal.',
          })}
          icon={Info}
        >
          <p>
            <FormattedMessage
              id="highlights.edit.highlight.name.modal.error.message"
              defaultMessage="An error occurred while saving the highlight name. Please try again."
              description="Error message shown when saving the highlight name fails."
            />
          </p>
        </Alert>
        <Form.Group isInvalid={isInvalid}>
          <Form.Control
            data-testid="edit-highlight-title-input"
            value={title}
            onChange={handleChange}
            floatingLabel={intl.formatMessage({
              id: 'highlights.edit.highlight.name.modal.input.label',
              defaultMessage: 'Highlight name',
              description: 'Label for the highlight name input in the edit modal.',
            })}
            autoComplete="off"
          />
          <Form.Control.Feedback type={isInvalid ? 'invalid' : undefined}>
            {title.length}/{MAX_HIGHLIGHT_TITLE_LENGTH}
          </Form.Control.Feedback>
        </Form.Group>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <Button variant="tertiary" onClick={handleClose}>
            <FormattedMessage
              id="highlights.edit.highlight.name.modal.cancel.button"
              defaultMessage="Cancel"
              description="Cancel button text in the edit highlight name modal."
            />
          </Button>
          <StatefulButton
            labels={{
              default: intl.formatMessage({
                id: 'highlights.edit.highlight.name.modal.save.button',
                defaultMessage: 'Save',
                description: 'Save button text in the edit highlight name modal.',
              }),
              pending: intl.formatMessage({
                id: 'highlights.edit.highlight.name.modal.save.in.progress.button',
                defaultMessage: 'Saving...',
                description: 'Save button text when saving is in progress in the edit highlight name modal.',
              }),
            }}
            variant="primary"
            state={saveState}
            disabled={isSaveDisabled}
            onClick={handleSave}
            data-testid="edit-highlight-title-save-button"
          />
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

EditHighlightTitleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentTitle: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default EditHighlightTitleModal;
