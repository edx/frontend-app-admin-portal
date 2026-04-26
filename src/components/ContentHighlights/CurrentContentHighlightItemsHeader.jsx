import React from 'react';
import {
  ActionRow, Icon, IconButton, Skeleton, useToggle,
} from '@openedx/paragon';
import { Edit } from '@openedx/paragon/icons';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import ContentHighlightHelmet from './ContentHighlightHelmet';
import DeleteHighlightSet from './DeleteHighlightSet';
import EditHighlightTitleModal from './EditHighlightTitleModal';

const CurrentContentHighlightItemsHeader = ({ isLoading, highlightTitle, onSaveTitle }) => {
  const intl = useIntl();
  const [isEditModalOpen, openEditModal, closeEditModal] = useToggle(false);

  if (isLoading) {
    return (
      <ActionRow data-testid="header-skeleton">
        <h2><Skeleton /></h2>
        <ActionRow.Spacer />
        <Skeleton />
      </ActionRow>
    );
  }
  return (
    <>
      <ContentHighlightHelmet title={`${highlightTitle} - Highlights`} />
      <ActionRow className="mb-4.5">
        <h2 className="m-0">
          {highlightTitle}
        </h2>
        {onSaveTitle && (
          <IconButton
            src={Edit}
            iconAs={Icon}
            alt={intl.formatMessage({
              id: 'highlights.edit.highlight.name.button.alt',
              defaultMessage: 'Edit highlight name',
              description: 'Alt text for the edit highlight name icon button.',
            })}
            onClick={openEditModal}
            data-testid="edit-highlight-title-button"
          />
        )}
        <ActionRow.Spacer />
        <DeleteHighlightSet />
      </ActionRow>
      {onSaveTitle && (
        <EditHighlightTitleModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          currentTitle={highlightTitle}
          onSave={onSaveTitle}
        />
      )}
    </>
  );
};

CurrentContentHighlightItemsHeader.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  highlightTitle: PropTypes.string.isRequired,
  onSaveTitle: PropTypes.func,
};

CurrentContentHighlightItemsHeader.defaultProps = {
  onSaveTitle: null,
};

export default CurrentContentHighlightItemsHeader;
