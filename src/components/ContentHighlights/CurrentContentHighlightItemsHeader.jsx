import React from 'react';
import {
  ActionRow, Breadcrumb, Button, Icon, IconButton, Skeleton, StatefulButton, useToggle,
} from '@openedx/paragon';
import { Edit } from '@openedx/paragon/icons';
import { useIntl, FormattedMessage } from '@edx/frontend-platform/i18n';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import ContentHighlightHelmet from './ContentHighlightHelmet';
import DeleteHighlightSet from './DeleteHighlightSet';
import EditHighlightTitleModal from './EditHighlightTitleModal';
import { ROUTE_NAMES } from '../EnterpriseApp/data/constants';

export const renderHighlightsBreadcrumb = ({ intl, enterpriseSlug, activeLabel }) => (
  <div className="small mb-3">
    <Breadcrumb
      ariaLabel="Highlights breadcrumb navigation"
      links={[{
        label: intl.formatMessage({
          id: 'highlights.detail.breadcrumb.highlights',
          defaultMessage: 'Highlights',
          description: 'Breadcrumb label linking back to highlights dashboard from highlight detail page.',
        }),
        to: `/${enterpriseSlug}/admin/${ROUTE_NAMES.contentHighlights}`,
      }]}
      linkAs={Link}
      activeLabel={activeLabel}
    />
  </div>
);

const CurrentContentHighlightItemsHeader = ({
  isLoading,
  highlightTitle,
  onSaveTitle,
  isEditing,
  onEditClick,
  onCancelClick,
  onRemoveSelectedContent,
  onAddContentClick,
  selectedCount,
  isRemoving,
  editHighlightsEnabled,
  existingHighlightTitles,
}) => {
  const intl = useIntl();
  const { enterpriseSlug } = useParams();
  const [isEditModalOpen, openEditModal, closeEditModal] = useToggle(false);

  const breadcrumb = renderHighlightsBreadcrumb({ intl, enterpriseSlug, activeLabel: highlightTitle });

  if (isLoading) {
    return (
      <ActionRow data-testid="header-skeleton">
        <h2><Skeleton /></h2>
        <ActionRow.Spacer />
        <Skeleton />
      </ActionRow>
    );
  }

  if (isEditing) {
    return (
      <>
        <ContentHighlightHelmet title={`Manage ${highlightTitle} - Highlights`} />
        {breadcrumb}
        <h2 className="mb-1" data-testid="manage-highlight-title">
          <FormattedMessage
            id="highlights.edit.manage.title"
            defaultMessage='Manage "{highlightTitle}"'
            description="Title shown when admin is managing a highlight's content."
            values={{ highlightTitle }}
          />
        </h2>
        <p className="small text-muted mb-4" data-testid="manage-highlight-subtitle">
          <FormattedMessage
            id="highlights.edit.manage.subtitle"
            defaultMessage='Select the courses you want to remove from "{highlightTitle}" then click Remove Content.'
            description="Subtitle instructing admin how to remove courses from a highlight."
            values={{ highlightTitle }}
          />
        </p>
        <ActionRow className="mb-4">
          <ActionRow.Spacer />
          <StatefulButton
            labels={{
              default: 'Remove content',
              pending: 'Removing...',
            }}
            state={isRemoving ? 'pending' : 'default'}
            variant="outline-primary"
            onClick={onRemoveSelectedContent}
            disabled={selectedCount === 0 || isRemoving}
            data-testid="remove-content-button"
          />
          <Button
            onClick={onAddContentClick}
            data-testid="add-content-button"
          >
            <FormattedMessage
              id="highlights.edit.add.content.button.text"
              defaultMessage="Add content"
              description="Button to open add content stepper from edit mode."
            />
          </Button>
          <Button
            variant="tertiary"
            onClick={onCancelClick}
            data-testid="cancel-edit-button"
          >
            <FormattedMessage
              id="highlights.edit.cancel.button.text"
              defaultMessage="Cancel"
              description="Button to cancel editing a highlight."
            />
          </Button>
        </ActionRow>
      </>
    );
  }

  return (
    <>
      <ContentHighlightHelmet title={`${highlightTitle} - Highlights`} />
      {breadcrumb}
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
        {editHighlightsEnabled && (
        <Button
          variant="outline-primary"
          onClick={onEditClick}
          data-testid="edit-content-button"
        >
          <FormattedMessage
            id="highlights.edit.content.button.text"
            defaultMessage="Edit content"
            description="Button to enter edit mode for a highlight."
          />
        </Button>
        )}
        <DeleteHighlightSet />
      </ActionRow>
      {onSaveTitle && (
      <EditHighlightTitleModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        currentTitle={highlightTitle}
        onSave={onSaveTitle}
        existingHighlightTitles={existingHighlightTitles}
      />
      )}
    </>
  );
};

CurrentContentHighlightItemsHeader.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  highlightTitle: PropTypes.string,
  isEditing: PropTypes.bool,
  onEditClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  onRemoveSelectedContent: PropTypes.func,
  onAddContentClick: PropTypes.func,
  selectedCount: PropTypes.number,
  isRemoving: PropTypes.bool,
  onSaveTitle: PropTypes.func,
  editHighlightsEnabled: PropTypes.bool,
  existingHighlightTitles: PropTypes.arrayOf(PropTypes.string),
};

CurrentContentHighlightItemsHeader.defaultProps = {
  highlightTitle: '',
  isEditing: false,
  onEditClick: () => {},
  onCancelClick: () => {},
  onRemoveSelectedContent: () => {},
  onAddContentClick: () => {},
  selectedCount: 0,
  isRemoving: false,
  editHighlightsEnabled: false,
  onSaveTitle: null,
  existingHighlightTitles: [],
};

export default CurrentContentHighlightItemsHeader;
