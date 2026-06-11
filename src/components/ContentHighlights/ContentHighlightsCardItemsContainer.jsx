import React from 'react';
import {
  ActionRow, Alert, Button, CardGrid, Form, useToggle,
} from '@openedx/paragon';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';
import ContentHighlightCardItem from './ContentHighlightCardItem';
import useFeaturedStarring from './data/useFeaturedStarring';
import { FeaturedContentSection, MaxStarredModal } from './FeaturedContentStarring';
import {
  DEFAULT_ERROR_MESSAGE,
  HIGHLIGHTS_CARD_GRID_COLUMN_SIZES,
  MAX_CONTENT_ITEMS_PER_HIGHLIGHT_SET,
} from './data/constants';
import SkeletonContentCardContainer from './SkeletonContentCardContainer';
import { generateAboutPageUrl } from './data/utils';
import EVENT_NAMES from '../../eventTracking';
import { features } from '../../config';
import DeleteArchivedHighlightsDialogs from './DeleteArchivedHighlightsDialogs';
import { isArchivedContent } from '../../utils';

const ContentHighlightsCardItemsContainer = ({
  enterpriseId, enterpriseSlug, isLoading, highlightedContent, highlightTitle, updateHighlightSet,
  isEditing, selectedContentKeys, onToggleSelect, editHighlightsEnabled,
}) => {
  const [isDeleteModalOpen, openDeleteModal, closeDeleteModal] = useToggle(false);
  const { highlightSetUUID } = useParams();

  const {
    starredContentKeys,
    starredItems,
    loadingContentKey,
    isMaxStarredModalOpen,
    closeMaxStarredModal,
    handleToggleStar,
  } = useFeaturedStarring(highlightSetUUID, highlightedContent);

  const {
    FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING,
  } = features;
  if (isLoading) {
    return (
      <SkeletonContentCardContainer itemCount={MAX_CONTENT_ITEMS_PER_HIGHLIGHT_SET} />
    );
  }

  if (!highlightedContent || highlightedContent?.length === 0) {
    return (
      <Alert data-testid="empty-highlighted-content" variant="warning">
        {DEFAULT_ERROR_MESSAGE.EMPTY_HIGHLIGHT_SET}
      </Alert>
    );
  }

  if (isEditing) {
    return (
      <div data-testid="edit-mode-card-grid">
        <CardGrid columnSizes={HIGHLIGHTS_CARD_GRID_COLUMN_SIZES}>
          {highlightedContent.map(({
            uuid, title, contentType, authoringOrganizations, cardImageUrl, contentKey,
          }) => (
            <div
              key={uuid}
              style={{ position: 'relative' }}
              data-testid={`selectable-card-wrapper-${uuid}`}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  zIndex: 1,
                }}
              >
                <Form.Checkbox
                  aria-label={`Select ${title} for removal`}
                  checked={selectedContentKeys.has(contentKey)}
                  onChange={() => onToggleSelect(contentKey)}
                  data-testid={`select-checkbox-${uuid}`}
                />
              </div>
              <ContentHighlightCardItem
                isLoading={isLoading}
                key={uuid}
                cardImageUrl={cardImageUrl}
                title={title}
                archived={false}
                contentType={contentType.toLowerCase()}
                partners={authoringOrganizations}
              />
            </div>
          ))}
        </CardGrid>
      </div>
    );
  }

  const archivedContent = [];
  const activeContent = [];

  if (FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING) {
    for (let i = 0; i < highlightedContent.length; i++) {
      if (isArchivedContent(highlightedContent[i])) {
        archivedContent.push(highlightedContent[i]);
      } else {
        activeContent.push(highlightedContent[i]);
      }
    }
  } else {
    activeContent.push(...highlightedContent);
  }

  const sortedActiveContent = [...activeContent].sort((a, b) => {
    const aStarred = starredContentKeys.has(a.contentKey);
    const bStarred = starredContentKeys.has(b.contentKey);

    if (aStarred === bStarred) {
      return 0;
    }

    return aStarred ? -1 : 1;
  });

  const updateSetWithActiveContent = () => updateHighlightSet(activeContent);

  const archivedContentKeys = archivedContent.map(({ contentKey }) => contentKey);
  const activeContentUuids = activeContent.map(({ uuid }) => uuid);

  const trackClickEvent = ({ aggregationKey }) => {
    const trackInfo = {
      aggregation_key: aggregationKey,
    };
    sendEnterpriseTrackEvent(
      enterpriseId,
      `${EVENT_NAMES.CONTENT_HIGHLIGHTS.HIGHLIGHT_DASHBOARD_SET_ABOUT_PAGE}`,
      trackInfo,
    );
  };
  return (
    <>
      {editHighlightsEnabled && (
        <>
          <MaxStarredModal isOpen={isMaxStarredModalOpen} onClose={closeMaxStarredModal} />
          <FeaturedContentSection
            starredItems={starredItems}
            loadingContentKey={loadingContentKey}
            onUnstar={handleToggleStar}
          />
          <h4 className="mb-3">
            <FormattedMessage
              id="highlights.all.courses.section.heading"
              defaultMessage='All courses and programs in "{highlightTitle}" highlight'
              description="Heading above the full courses grid"
              values={{ highlightTitle }}
            />
          </h4>
        </>
      )}
      <CardGrid columnSizes={HIGHLIGHTS_CARD_GRID_COLUMN_SIZES}>
        {sortedActiveContent.map(({
          uuid, title, contentType, authoringOrganizations, contentKey, cardImageUrl, aggregationKey,
        }) => (
          <ContentHighlightCardItem
            isLoading={isLoading}
            key={uuid}
            uuid={uuid}
            editHighlightsEnabled={editHighlightsEnabled}
            isStarred={starredContentKeys.has(contentKey)}
            onToggleStar={() => handleToggleStar(contentKey)}
            cardImageUrl={cardImageUrl}
            title={title}
            archived={false}
            hyperlinkAttrs={
              {
                href: generateAboutPageUrl({
                  enterpriseSlug,
                  contentType: contentType.toLowerCase(),
                  contentKey,
                }),
                target: '_blank',
                onClick: () => trackClickEvent({ aggregationKey }),
              }
            }
            contentType={contentType.toLowerCase()}
            partners={authoringOrganizations}
          />
        ))}
      </CardGrid>
      {archivedContent.length > 0 && (
        <>
          <DeleteArchivedHighlightsDialogs
            isDeleteModalOpen={isDeleteModalOpen}
            closeDeleteModal={closeDeleteModal}
            archivedContentKeys={archivedContentKeys}
            activeContentUuids={activeContentUuids}
            updateSetWithActiveContent={updateSetWithActiveContent}
          />
          <ActionRow>
            <h3 className="m-0">
              <FormattedMessage
                id="highlights.highlights.tab.archived.courses.section.heading.title"
                defaultMessage="Archived"
                description="Header title for archived courses section on highlights tab."
              />
            </h3>
            <ActionRow.Spacer />
            <Button onClick={openDeleteModal} variant="outline-primary">
              <FormattedMessage
                id="highlights.highlights.tab.archived.courses.delete.button.label"
                defaultMessage="Delete archived courses"
                description="Button label to delete archived courses on highlights tab."
              />
            </Button>
          </ActionRow>
          <div className="mb-4.5">
            <FormattedMessage
              id="highlights.highlights.tab.archived.courses.section.subheading"
              defaultMessage="Learners are no longer able to enroll in archived courses, but past learners can still access course materials."
              description="Subheading for archived courses section on highlights tab."
            />
          </div>
          <CardGrid columnSizes={HIGHLIGHTS_CARD_GRID_COLUMN_SIZES}>
            {archivedContent.map(({
              uuid, title, contentType, authoringOrganizations, contentKey, cardImageUrl, aggregationKey,
            }) => (
              <ContentHighlightCardItem
                isLoading={isLoading}
                key={uuid}
                uuid={uuid}
                editHighlightsEnabled={editHighlightsEnabled}
                isStarred={starredContentKeys.has(contentKey)}
                onToggleStar={() => handleToggleStar(contentKey)}
                cardImageUrl={cardImageUrl}
                title={title}
                archived
                hyperlinkAttrs={
                  {
                    href: generateAboutPageUrl({
                      enterpriseSlug,
                      contentType: contentType.toLowerCase(),
                      contentKey,
                    }),
                    target: '_blank',
                    onClick: () => trackClickEvent({ aggregationKey }),
                  }
                }
                contentType={contentType.toLowerCase()}
                partners={authoringOrganizations}
              />
            ))}
          </CardGrid>
        </>
      )}
    </>
  );
};

ContentHighlightsCardItemsContainer.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
  enterpriseSlug: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  highlightedContent: PropTypes.arrayOf(PropTypes.shape({
    uuid: PropTypes.string,
    contentKey: PropTypes.string,
    contentType: PropTypes.oneOf(['course', 'program', 'learnerpathway']),
    title: PropTypes.string,
    cardImageUrl: PropTypes.string,
    authoringOrganizations: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      logoImageUrl: PropTypes.string,
      uuid: PropTypes.string,
    })),
    courseRunStatuses: PropTypes.arrayOf(PropTypes.string),
  })).isRequired,
  highlightTitle: PropTypes.string,
  updateHighlightSet: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  selectedContentKeys: PropTypes.instanceOf(Set),
  onToggleSelect: PropTypes.func,
  editHighlightsEnabled: PropTypes.bool,
};

ContentHighlightsCardItemsContainer.defaultProps = {
  highlightTitle: '',
  isEditing: false,
  selectedContentKeys: new Set(),
  onToggleSelect: () => {},
  editHighlightsEnabled: false,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
  enterpriseSlug: state.portalConfiguration.enterpriseSlug,
  editHighlightsEnabled: state.portalConfiguration.enterpriseFeatures?.enterpriseEditHighlightsEnabled ?? false,
});

export default connect(mapStateToProps)(ContentHighlightsCardItemsContainer);
