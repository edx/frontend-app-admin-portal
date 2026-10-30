import { useCallback, useMemo, useState } from 'react';
import { isEqual } from 'lodash-es';

import {
  AUDIT_TRAIL_DEFAULT_FILTERS,
  AUDIT_TRAIL_DEFAULT_SORT_BY,
  AUDIT_TRAIL_PAGE_SIZE,
} from '../constants';
import { getAuditTrailQueryOptions } from '../utils';

/**
 * Holds the filter and `DataTable` (pagination/sorting) state of an audit trail, and derives the query options
 * used to filter, sort and paginate the audit trail rows.
 *
 * The returned `fetchTableData` is passed to `DataTable` as `fetchData`; the returned `queryOptions` are passed
 * to `applyAuditTrailQueryOptions` so that changing any filter, page or sort order shows the matching page of
 * audit trail rows without refetching them.
 */
const useAuditTrailTableState = () => {
  const [filters, setFilters] = useState(AUDIT_TRAIL_DEFAULT_FILTERS);
  const [tableState, setTableState] = useState({
    pageIndex: 0,
    pageSize: AUDIT_TRAIL_PAGE_SIZE,
    sortBy: AUDIT_TRAIL_DEFAULT_SORT_BY,
  });

  const fetchTableData = useCallback(({ pageIndex, pageSize, sortBy }) => {
    setTableState((prevState) => {
      const nextState = { pageIndex, pageSize, sortBy };
      return isEqual(prevState, nextState) ? prevState : nextState;
    });
  }, []);

  // Changing filters always returns to the first page, so a later page of the previous
  // results is never requested with the new filters.
  const updateFilters = useCallback((nextFilters) => {
    setFilters(nextFilters);
    setTableState((prevState) => (prevState.pageIndex === 0 ? prevState : { ...prevState, pageIndex: 0 }));
  }, []);

  const queryOptions = useMemo(
    () => getAuditTrailQueryOptions({ filters, ...tableState }),
    [filters, tableState],
  );

  return {
    filters,
    updateFilters,
    fetchTableData,
    queryOptions,
  };
};

export default useAuditTrailTableState;
