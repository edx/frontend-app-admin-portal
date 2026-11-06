import React, {
  useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash-es';
import {
  Alert, Button, DataTable, DataTableContext, Skeleton,
} from '@openedx/paragon';
import { Error as ErrorIcon, Info } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import AuditTrailFilters from './AuditTrailFilters';
import AuditTrailAppliedFilters from './AuditTrailAppliedFilters';
import AuditTrailSortToggle from './AuditTrailSortToggle';
import AuditTrailTimestampCell from './AuditTrailTimestampCell';
import AuditTrailActionTypeCell from './AuditTrailActionTypeCell';
import AuditTrailStatusCell from './AuditTrailStatusCell';
import AuditTrailActorCell from './AuditTrailActorCell';
import AuditTrailSourceCell from './AuditTrailSourceCell';
import AuditTrailLearnerCell from './AuditTrailLearnerCell';
import messages from './data/messages';
import { auditTrailFiltersPropType } from './data/propTypes';
import {
  AUDIT_TRAIL_ACTOR_SEARCH_DEBOUNCE_MS,
  AUDIT_TRAIL_DEFAULT_SORT_BY,
  AUDIT_TRAIL_PAGE_SIZE,
  AUDIT_TRAIL_TIMESTAMP_COLUMN,
} from './data/constants';
import { getLocalTimeZoneName, hasActiveAuditTrailFilters } from './data/utils';

/**
 * Renders the contents of the audit trail `DataTable`. Rendered as `DataTable` children so the header,
 * filters and sort toggle can use the `DataTable` state (e.g. to return to the first page when filters change).
 */
const AuditTrailTableContents = ({
  description,
  filters,
  onFiltersChange,
  actionTypeOptions,
  sourceOptions,
  isLoading,
  isError,
  onRetry,
  historyNotice = '',
}) => {
  const intl = useIntl();
  const { gotoPage } = useContext(DataTableContext);

  // Changing filters returns to the first page: `gotoPage(0)` resets the `DataTable`'s own page state, and the
  // parent's table state resets its page in the same render (see `useAuditTrailTableState`'s `updateFilters`).
  const handleFiltersChange = (nextFilters) => {
    gotoPage(0);
    onFiltersChange(nextFilters);
  };

  // The actor search is applied after the admin stops typing. The debounced update reads the latest filters
  // from a ref, so it's created once and a pending search survives other filter changes and re-renders.
  const [actorSearchInput, setActorSearchInput] = useState(filters.actorSearch);
  const latestFiltersRef = useRef({ filters, handleFiltersChange });
  useEffect(() => {
    latestFiltersRef.current = { filters, handleFiltersChange };
  });
  const debouncedApplyActorSearch = useMemo(() => debounce((actorSearch) => {
    const { filters: latestFilters, handleFiltersChange: applyFilters } = latestFiltersRef.current;
    applyFilters({ ...latestFilters, actorSearch });
  }, AUDIT_TRAIL_ACTOR_SEARCH_DEBOUNCE_MS), []);
  useEffect(() => () => debouncedApplyActorSearch.cancel(), [debouncedApplyActorSearch]);

  const handleActorSearchChange = (actorSearch) => {
    setActorSearchInput(actorSearch);
    debouncedApplyActorSearch(actorSearch);
  };

  // Removing applied filters (a chip, or "Clear all"). Clearing the actor search also discards a pending search,
  // so it can't re-apply a search the admin just removed.
  const handleClearFilters = (clearedFilters) => {
    if ('actorSearch' in clearedFilters) {
      debouncedApplyActorSearch.cancel();
      setActorSearchInput(clearedFilters.actorSearch);
    }
    handleFiltersChange({ ...filters, ...clearedFilters });
  };

  const renderTableBody = () => {
    if (isError) {
      return (
        <div className="px-3 pb-3">
          <Alert
            variant="danger"
            icon={ErrorIcon}
            actions={[
              <Button onClick={onRetry}>{intl.formatMessage(messages.errorRetry)}</Button>,
            ]}
          >
            <Alert.Heading>{intl.formatMessage(messages.errorHeading)}</Alert.Heading>
            <p>{intl.formatMessage(messages.errorDescription)}</p>
          </Alert>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="px-3 pb-3" data-testid="audit-trail-loading">
          <Skeleton count={5} height={40} className="mb-2" />
          <span className="sr-only">{intl.formatMessage(messages.loading)}</span>
        </div>
      );
    }
    return (
      <>
        {historyNotice && (
          <div className="px-3">
            <Alert variant="info" icon={Info}>{historyNotice}</Alert>
          </div>
        )}
        <DataTable.Table />
        <DataTable.EmptyTable
          content={intl.formatMessage(
            hasActiveAuditTrailFilters(filters) ? messages.emptyNoFilterResults : messages.emptyNoHistory,
          )}
        />
        <DataTable.TableFooter />
      </>
    );
  };

  return (
    <>
      <div className="px-3 pt-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
          <div className="mr-3">
            <h3>{intl.formatMessage(messages.heading)}</h3>
            <p className="small mb-0">
              {description}{' '}
              {intl.formatMessage(messages.timeZoneNote, { timeZone: getLocalTimeZoneName() })}
            </p>
          </div>
          <AuditTrailSortToggle disabled={isLoading || isError} />
        </div>
        <AuditTrailFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          actorSearch={actorSearchInput}
          onActorSearchChange={handleActorSearchChange}
          actionTypeOptions={actionTypeOptions}
          sourceOptions={sourceOptions}
        />
        <AuditTrailAppliedFilters filters={filters} onClearFilters={handleClearFilters} />
      </div>
      {renderTableBody()}
    </>
  );
};

const auditTrailPropTypes = {
  /** Describes which audit history is shown (e.g. "...across all of your budgets."). */
  description: PropTypes.string.isRequired,
  filters: auditTrailFiltersPropType.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  /** Action type values shown in the "Action" filter. */
  actionTypeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Source values shown in the "Source" filter. */
  sourceOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** True while the first page of audit trail data is loading. */
  isLoading: PropTypes.bool.isRequired,
  isError: PropTypes.bool.isRequired,
  onRetry: PropTypes.func.isRequired,
  /** Notice shown above the table, e.g. describing which part of the audit history was loaded. */
  historyNotice: PropTypes.string,
};

AuditTrailTableContents.propTypes = auditTrailPropTypes;

/**
 * A read-only, filterable and sortable history of audit actions (who did what, when, from where, and to
 * which learner). This component only renders the current page of results provided by the parent, which is
 * responsible for filtering, sorting and paginating them (see `applyAuditTrailTableOptions`).
 */
const AuditTrail = ({
  tableData,
  fetchTableData,
  isFetching,
  ...rest
}) => {
  const intl = useIntl();
  const columns = useMemo(() => [
    {
      Header: intl.formatMessage(messages.columnTimestamp),
      accessor: AUDIT_TRAIL_TIMESTAMP_COLUMN,
      Cell: AuditTrailTimestampCell,
    },
    {
      Header: intl.formatMessage(messages.columnActionType),
      accessor: 'actionType',
      Cell: AuditTrailActionTypeCell,
      disableSortBy: true,
    },
    {
      Header: intl.formatMessage(messages.columnStatus),
      accessor: 'status',
      Cell: AuditTrailStatusCell,
      disableSortBy: true,
    },
    {
      Header: intl.formatMessage(messages.columnActor),
      accessor: 'actorName',
      Cell: AuditTrailActorCell,
      disableSortBy: true,
    },
    {
      Header: intl.formatMessage(messages.columnSource),
      accessor: 'source',
      Cell: AuditTrailSourceCell,
      disableSortBy: true,
    },
    {
      Header: intl.formatMessage(messages.columnAffectedLearner),
      accessor: 'learnerEmail',
      Cell: AuditTrailLearnerCell,
      disableSortBy: true,
    },
  ], [intl]);

  return (
    <DataTable
      isSortable
      manualSortBy
      isPaginated
      manualPagination
      isLoading={isFetching}
      columns={columns}
      data={tableData.results}
      itemCount={tableData.itemCount}
      pageCount={tableData.pageCount}
      fetchData={fetchTableData}
      initialTableOptions={{
        getRowId: row => row?.uuid?.toString(),
        // The timestamp column is always sorted, either newest first or oldest first.
        disableSortRemove: true,
        disableMultiSort: true,
      }}
      initialState={{
        pageSize: AUDIT_TRAIL_PAGE_SIZE,
        pageIndex: 0,
        sortBy: AUDIT_TRAIL_DEFAULT_SORT_BY,
      }}
    >
      <AuditTrailTableContents {...rest} />
    </DataTable>
  );
};

AuditTrail.propTypes = {
  ...auditTrailPropTypes,
  tableData: PropTypes.shape({
    results: PropTypes.arrayOf(PropTypes.shape({
      uuid: PropTypes.string,
      timestamp: PropTypes.string,
      actionType: PropTypes.string,
    })).isRequired,
    itemCount: PropTypes.number.isRequired,
    pageCount: PropTypes.number.isRequired,
  }).isRequired,
  /** Passed to `DataTable` as `fetchData`; called with the current page index, page size and sort order. */
  fetchTableData: PropTypes.func.isRequired,
  /** True while any page of audit trail data is being fetched. */
  isFetching: PropTypes.bool.isRequired,
};

export default AuditTrail;
