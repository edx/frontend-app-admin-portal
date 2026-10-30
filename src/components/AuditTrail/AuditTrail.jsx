import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Alert, Button, DataTable, DataTableContext, Skeleton,
} from '@openedx/paragon';
import { Error as ErrorIcon } from '@openedx/paragon/icons';
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
}) => {
  const intl = useIntl();
  const { gotoPage } = useContext(DataTableContext);

  const handleFiltersChange = (nextFilters) => {
    gotoPage(0);
    onFiltersChange(nextFilters);
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
          actionTypeOptions={actionTypeOptions}
          sourceOptions={sourceOptions}
        />
        <AuditTrailAppliedFilters filters={filters} onFiltersChange={handleFiltersChange} />
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
};

AuditTrailTableContents.propTypes = auditTrailPropTypes;

/**
 * A read-only, filterable and sortable history of audit actions (who did what, when, from where, and to
 * which learner). This component only renders the current page of results provided by the parent, which is
 * responsible for filtering, sorting and paginating them (see `applyAuditTrailQueryOptions`).
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
