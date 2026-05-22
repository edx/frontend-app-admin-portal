import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ActionRow, AlertModal, Button, DataTable, Icon, Spinner,
} from '@openedx/paragon';
import { StarFilled, StarOutline } from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { MAX_STARRED_CONTENT_ITEMS_PER_HIGHLIGHT_SET } from './data/constants';
import './Highlights.scss';

const renderTitleHeader = (courseTitleLabel) => (
  <div className="featured-table-header d-flex align-items-center">
    <Icon src={StarOutline} className="featured-table-header-icon mr-2" />
    <span className="featured-table-header-label">{courseTitleLabel}</span>
  </div>
);

const renderLoadingTitleCell = () => (
  <div className="featured-loading-row d-flex align-items-center text-muted" data-testid="featured-loading-row">
    <Spinner animation="border" size="sm" variant="secondary" />
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
    <div className="featured-title-cell d-flex align-items-center">
      <button
        type="button"
        className="featured-title-cell-button"
        aria-label={unstarAriaLabel}
        onClick={() => onUnstar(row.original.contentKey)}
      >
        <Icon src={StarFilled} className="featured-title-cell-icon mr-2" />
      </button>
      <span>{row.original.title}</span>
    </div>
  );
};

const renderPartnerCell = ({ row }) => {
  const orgs = row.original.authoringOrganizations;
  return (
    <div className="featured-partner-cell d-flex align-items-center justify-content-between">
      <span>{orgs.map((org) => org.name).join(', ')}</span>
      <div className="featured-partner-logos d-flex align-items-center">
        {orgs.map((org) => (
          org.logoImageUrl && (
            <img key={org.uuid} className="featured-partner-logo" src={org.logoImageUrl} alt={org.name} />
          )
        ))}
      </div>
    </div>
  );
};

const renderEmptyPlaceholderCell = (emptyPlaceholderLabel) => (
  <div className="featured-empty-cell d-flex align-items-center text-muted">
    <Icon src={StarOutline} className="featured-empty-cell-icon mr-2" />
    <span>{emptyPlaceholderLabel}</span>
  </div>
);

const getFeaturedColumns = ({
  TitleHeader,
  TitleCell,
  educationalPartnerLabel,
}) => ([
  {
    Header: TitleHeader,
    accessor: 'title',
    Cell: TitleCell,
  },
  {
    Header: <span className="featured-table-header-label">{educationalPartnerLabel}</span>,
    accessor: 'authoringOrganizations',
    Cell: renderPartnerCell,
  },
]);

const getEmptyFeaturedColumns = ({
  courseTitleHeader,
  educationalPartnerHeader,
  EmptyTitleCell,
  EmptyPartnerCell,
}) => ([
  {
    Header: courseTitleHeader,
    accessor: 'title',
    Cell: EmptyTitleCell,
  },
  {
    Header: educationalPartnerHeader,
    accessor: 'authoringOrganizations',
    Cell: EmptyPartnerCell,
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
    <p className="small mb-0">
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

  const courseTitleLabel = intl.formatMessage({
    id: 'highlights.featured.table.col.title',
    defaultMessage: 'Course Title',
    description: 'Column header - course title',
  });
  const educationalPartnerLabel = intl.formatMessage({
    id: 'highlights.featured.table.col.partner',
    defaultMessage: 'Educational Partner',
    description: 'Column header - educational partner',
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
        uuid, title, contentKey, authoringOrganizations,
      }) => ({
        uuid,
        title,
        contentKey,
        authoringOrganizations: authoringOrganizations || [],
        isLoading: false,
      }));
    if (loadingContentKey !== null) {
      rows.push({
        uuid: '__loading__', title: '', contentKey: '', authoringOrganizations: [], isLoading: true,
      });
    }
    return rows;
  }, [starredItems, loadingContentKey]);

  const TitleHeader = useCallback(
    () => renderTitleHeader(courseTitleLabel),
    [courseTitleLabel],
  );

  const TitleCell = useCallback(
    ({ row }) => renderTitleCell({ row, onUnstar, getUnstarAriaLabel }),
    [onUnstar, getUnstarAriaLabel],
  );

  const EmptyTitleCell = useCallback(
    () => renderEmptyPlaceholderCell(emptyPlaceholderLabel),
    [emptyPlaceholderLabel],
  );

  const EmptyPartnerCell = useCallback(() => null, []);

  const columns = useMemo(() => getFeaturedColumns({
    TitleHeader,
    TitleCell,
    educationalPartnerLabel,
  }), [TitleHeader, TitleCell, educationalPartnerLabel]);

  const emptyColumns = useMemo(() => getEmptyFeaturedColumns({
    courseTitleHeader: TitleHeader,
    educationalPartnerHeader: educationalPartnerLabel,
    EmptyTitleCell,
    EmptyPartnerCell,
  }), [TitleHeader, educationalPartnerLabel, EmptyTitleCell, EmptyPartnerCell]);

  return (
    <div
      className="featured-courses-section mb-4 p-4 rounded bg-light-200"
      data-testid="featured-courses-section"
    >
      <h4 className="featured-courses-section-title mb-1 font-weight-bold">
        <FormattedMessage
          id="highlights.featured.section.title"
          defaultMessage="Featured courses and programs"
          description="Section title for featured courses"
        />
      </h4>
      <p className="featured-courses-section-subtitle text-muted mb-3">
        <FormattedMessage
          id="highlights.featured.section.subtitle"
          defaultMessage="Selected courses or programs will be displayed at the top of this highlight in the Learner Portal. Star up to {max} courses."
          description="Subtitle for featured courses section"
          values={{ max: MAX_STARRED_CONTENT_ITEMS_PER_HIGHLIGHT_SET }}
        />
      </p>

      {tableData.length > 0 ? (
        <div className="featured-courses-table">
          <DataTable
            data={tableData}
            columns={columns}
            itemCount={tableData.length}
          >
            <DataTable.Table />
          </DataTable>
        </div>
      ) : (
        <div className="featured-courses-table featured-courses-table-empty">
          <DataTable
            data={[{
              uuid: 'empty', title: '', contentKey: '', authoringOrganizations: [], isLoading: false,
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
    authoringOrganizations: PropTypes.arrayOf(PropTypes.shape({
      uuid: PropTypes.string,
      name: PropTypes.string,
      logoImageUrl: PropTypes.string,
    })),
  })).isRequired,
  loadingContentKey: PropTypes.string,
  onUnstar: PropTypes.func.isRequired,
};

FeaturedContentSection.defaultProps = {
  loadingContentKey: null,
};

export { MaxStarredModal, FeaturedContentSection };
