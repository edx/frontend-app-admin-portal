import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import {
  ActionRow, AlertModal, Button, DataTable, Icon, Spinner,
} from '@openedx/paragon';
import { StarFilled, StarOutline } from '@openedx/paragon/icons';
import './highlights.scss';

const { MAX_STARRED_CONTENT_ITEMS_PER_HIGHLIGHT_SET = 4 } = getConfig();

const renderTitleHeader = (titleLabel) => (
  <div className="d-flex align-items-center">
    <Icon src={StarOutline} className="mr-2 text-muted" />
    <span className="font-weight-bold text-dark">{titleLabel}</span>
  </div>
);

const renderLoadingTitleCell = () => (
  <div className="d-flex align-items-center text-muted" data-testid="featured-loading-row">
    <Spinner animation="border" size="sm" variant="secondary" className="mr-2" />
    <span className="small">
      <FormattedMessage
        id="highlights.featured.table.loading"
        defaultMessage="Loading your selection"
        description="Loading text shown while a starred course is being added"
      />
    </span>
  </div>
);

const renderTitleCell = ({ row, onUnstar, getUnstarAriaLabel }) => {
  if (row.original.isLoading) {
    return renderLoadingTitleCell();
  }

  const unstarAriaLabel = getUnstarAriaLabel(row.original.title);
  return (
    <div className="d-flex align-items-center">
      <Button
        variant="none"
        className="p-0 mr-2 border-0 bg-transparent shadow-none"
        aria-label={unstarAriaLabel}
        onClick={() => onUnstar(row.original.contentKey)}
      >
        <Icon src={StarFilled} />
      </Button>
      <span>{row.original.title}</span>
    </div>
  );
};

const renderPartnerCell = ({ row }) => (
  <span>{row.original.authoringOrganizations.map((org) => org.name).join(', ')}</span>
);

const renderContentTypeCell = ({ row, formattedContentTypes }) => (
  <span>{formattedContentTypes[row.original.contentType?.toLowerCase()] ?? ''}</span>
);

const renderEmptyPlaceholderCell = (emptyPlaceholderLabel) => (
  <div className="d-flex align-items-center text-muted">
    <Icon src={StarOutline} className="mr-2" />
    <span>{emptyPlaceholderLabel}</span>
  </div>
);

const getFeaturedColumns = ({
  TitleHeader,
  TitleCell,
  educationalPartnerLabel,
  contentTypeLabel,
  ContentTypeCell,
}) => ([
  {
    Header: TitleHeader,
    accessor: 'title',
    Cell: TitleCell,
  },
  {
    Header: <span className="font-weight-bold text-dark">{educationalPartnerLabel}</span>,
    accessor: 'authoringOrganizations',
    Cell: renderPartnerCell,
  },
  {
    Header: <span className="font-weight-bold text-dark">{contentTypeLabel}</span>,
    accessor: 'contentType',
    Cell: ContentTypeCell,
  },
]);

const getEmptyFeaturedColumns = ({
  titleHeader,
  educationalPartnerHeader,
  contentTypeHeader,
  EmptyTitleCell,
  EmptyCell,
}) => ([
  {
    Header: titleHeader,
    accessor: 'title',
    Cell: EmptyTitleCell,
  },
  {
    Header: educationalPartnerHeader,
    accessor: 'authoringOrganizations',
    Cell: EmptyCell,
  },
  {
    Header: contentTypeHeader,
    accessor: 'contentType',
    Cell: EmptyCell,
  },
]);

// MaxStarredModal
const MaxStarredModal = ({ isOpen, onClose }) => (
  <AlertModal
    title={(
      <FormattedMessage
        id="highlights.max.starred.modal.title"
        defaultMessage="Unstar a selection to continue"
        description="Title for max starred items modal"
      />
    )}
    isOpen={isOpen}
    onClose={onClose}
    footerNode={(
      <ActionRow>
        <ActionRow.Spacer />
        <Button variant="primary" onClick={onClose}>
          <FormattedMessage
            id="highlights.max.starred.modal.close.btn"
            defaultMessage="Close"
            description="Close button label for max starred modal"
          />
        </Button>
      </ActionRow>
    )}
  >
    <p className="mb-0">
      <FormattedMessage
        id="highlights.max.starred.modal.body"
        defaultMessage="Only {max} courses or programs can be featured in a highlight. Unstar a selection to continue."
        description="Body text for max starred modal"
        values={{ max: MAX_STARRED_CONTENT_ITEMS_PER_HIGHLIGHT_SET }}
      />
    </p>
  </AlertModal>
);

MaxStarredModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

// FeaturedContentSection
const FeaturedContentSection = ({ starredItems, loadingContentKey, onUnstar }) => {
  const intl = useIntl();

  // Keyed by the lowercased `contentType` returned by the catalog API.
  const formattedContentTypes = useMemo(() => ({
    course: intl.formatMessage({
      id: 'highlights.highlights.tab.content.type.course.label',
      defaultMessage: 'Course',
      description: 'Label for course content type in the highlight content card',
    }),
    program: intl.formatMessage({
      id: 'highlights.highlights.tab.content.type.program.label',
      defaultMessage: 'Program',
      description: 'Label for program content type in the highlight content card',
    }),
    learnerpathway: intl.formatMessage({
      id: 'highlights.highlights.tab.content.type.pathway.label',
      defaultMessage: 'Pathway',
      description: 'Label for pathway content type in the highlight content card',
    }),
  }), [intl]);

  const titleLabel = intl.formatMessage({
    id: 'highlights.featured.table.col.title',
    defaultMessage: 'Title',
    description: 'Column header - content title',
  });
  const educationalPartnerLabel = intl.formatMessage({
    id: 'highlights.featured.table.col.partner',
    defaultMessage: 'Educational Partner',
    description: 'Column header - educational partner',
  });
  const contentTypeLabel = intl.formatMessage({
    id: 'highlights.featured.table.col.content.type',
    defaultMessage: 'Content Type',
    description: 'Column header - content type',
  });
  const emptyPlaceholderLabel = intl.formatMessage({
    id: 'highlights.featured.table.empty.placeholder',
    defaultMessage: 'Starred courses will appear here',
    description: 'Placeholder shown when no courses are starred yet',
  });
  const getUnstarAriaLabel = useCallback((title) => intl.formatMessage(
    {
      id: 'highlights.table.unstar.aria.label',
      defaultMessage: 'Unstar {title}',
      description: 'Unstar row aria label',
    },
    { title },
  ), [intl]);

  const tableData = useMemo(() => {
    const rows = starredItems
      .filter(({ contentKey }) => contentKey !== loadingContentKey)
      .map(({
        uuid, title, contentKey, authoringOrganizations, contentType,
      }) => ({
        uuid,
        title,
        contentKey,
        authoringOrganizations: authoringOrganizations || [],
        contentType,
        isLoading: false,
      }));
    if (loadingContentKey !== null) {
      rows.push({
        uuid: '__loading__',
        title: '',
        contentKey: '',
        authoringOrganizations: [],
        contentType: '',
        isLoading: true,
      });
    }
    return rows;
  }, [starredItems, loadingContentKey]);

  const TitleHeader = useCallback(
    () => renderTitleHeader(titleLabel),
    [titleLabel],
  );

  const TitleCell = useCallback(
    ({ row }) => renderTitleCell({ row, onUnstar, getUnstarAriaLabel }),
    [onUnstar, getUnstarAriaLabel],
  );

  const ContentTypeCell = useCallback(
    ({ row }) => renderContentTypeCell({ row, formattedContentTypes }),
    [formattedContentTypes],
  );

  const EmptyTitleCell = useCallback(
    () => renderEmptyPlaceholderCell(emptyPlaceholderLabel),
    [emptyPlaceholderLabel],
  );

  const EmptyCell = useCallback(() => null, []);

  const columns = useMemo(() => getFeaturedColumns({
    TitleHeader,
    TitleCell,
    educationalPartnerLabel,
    contentTypeLabel,
    ContentTypeCell,
  }), [TitleHeader, TitleCell, educationalPartnerLabel, contentTypeLabel, ContentTypeCell]);

  const emptyColumns = useMemo(() => getEmptyFeaturedColumns({
    titleHeader: TitleHeader,
    educationalPartnerHeader: educationalPartnerLabel,
    contentTypeHeader: contentTypeLabel,
    EmptyTitleCell,
    EmptyCell,
  }), [TitleHeader, educationalPartnerLabel, contentTypeLabel, EmptyTitleCell, EmptyCell]);

  return (
    <div
      className="featured-courses-section mb-4 p-4 rounded"
      data-testid="featured-courses-section"
    >
      <h4 className="mb-1 font-weight-bold">
        <FormattedMessage
          id="highlights.featured.section.title"
          defaultMessage="Featured courses and programs"
          description="Section title for featured courses"
        />
      </h4>
      <p className="mb-3">
        <FormattedMessage
          id="highlights.featured.section.subtitle"
          defaultMessage="Selected courses or programs will be displayed at the top of this highlight in the Learner Portal. Star up to {max} courses."
          description="Subtitle for featured courses section"
          values={{ max: MAX_STARRED_CONTENT_ITEMS_PER_HIGHLIGHT_SET }}
        />
      </p>

      {tableData.length > 0 ? (
        <div className="w-100">
          <DataTable
            className="featured-courses-table"
            data={tableData}
            columns={columns}
            itemCount={tableData.length}
          >
            <DataTable.Table />
          </DataTable>
        </div>
      ) : (
        <div className="w-100">
          <DataTable
            className="featured-courses-table"
            data={[{
              uuid: 'empty',
              title: '',
              contentKey: '',
              authoringOrganizations: [],
              contentType: '',
              isLoading: false,
            }]}
            columns={emptyColumns}
            itemCount={1}
          >
            <DataTable.Table />
          </DataTable>
        </div>
      )}
    </div>
  );
};

FeaturedContentSection.propTypes = {
  starredItems: PropTypes.arrayOf(PropTypes.shape({
    uuid: PropTypes.string,
    title: PropTypes.string,
    contentKey: PropTypes.string,
    contentType: PropTypes.string,
    authoringOrganizations: PropTypes.arrayOf(PropTypes.shape({
      uuid: PropTypes.string,
      name: PropTypes.string,
    })),
  })).isRequired,
  loadingContentKey: PropTypes.string,
  onUnstar: PropTypes.func.isRequired,
};

FeaturedContentSection.defaultProps = {
  loadingContentKey: null,
};

export { MaxStarredModal, FeaturedContentSection };
