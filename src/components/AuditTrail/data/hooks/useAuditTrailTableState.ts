import { useCallback, useMemo, useState } from 'react';
import { isEqual } from 'lodash-es';

import {
  AUDIT_TRAIL_DEFAULT_FILTERS,
  AUDIT_TRAIL_DEFAULT_SORT_BY,
  AUDIT_TRAIL_PAGE_SIZE,
} from '../constants';
import type { AuditTrailFilters, AuditTrailTableOptions, AuditTrailTableState } from '../types';

/**
 * Holds the filter and `DataTable` (pagination/sorting) state of an audit trail.
 *
 * The returned `fetchTableData` is passed to `DataTable` as `fetchData`; the returned `tableOptions` (filters plus
 * `DataTable` state) are passed to `applyAuditTrailTableOptions`, so that changing any filter, page or sort order
 * shows the matching page of audit trail rows without refetching them.
 */
const useAuditTrailTableState = (): {
  filters: AuditTrailFilters;
  updateFilters: (nextFilters: AuditTrailFilters) => void;
  fetchTableData: (tableState: AuditTrailTableState) => void;
  tableOptions: AuditTrailTableOptions;
} => {
  const [filters, setFilters] = useState<AuditTrailFilters>(AUDIT_TRAIL_DEFAULT_FILTERS);
  const [tableState, setTableState] = useState<AuditTrailTableState>({
    pageIndex: 0,
    pageSize: AUDIT_TRAIL_PAGE_SIZE,
    sortBy: AUDIT_TRAIL_DEFAULT_SORT_BY,
  });

  const fetchTableData = useCallback(({ pageIndex, pageSize, sortBy }: AuditTrailTableState) => {
    setTableState((prevState) => {
      const nextState = { pageIndex, pageSize, sortBy };
      return isEqual(prevState, nextState) ? prevState : nextState;
    });
  }, []);

  // Changing filters returns to the first page. `AuditTrail` also calls `DataTable`'s `gotoPage(0)`, which resets
  // the table's own page state, but `DataTable` only reports that page through `fetchData` in an effect after the
  // next render. Resetting `pageIndex` here too means that render already applies the new filters to the first
  // page, rather than briefly showing a later page of the newly filtered rows (which may be empty).
  const updateFilters = useCallback((nextFilters: AuditTrailFilters) => {
    setFilters(nextFilters);
    setTableState((prevState) => (prevState.pageIndex === 0 ? prevState : { ...prevState, pageIndex: 0 }));
  }, []);

  const tableOptions = useMemo(
    () => ({ filters, ...tableState }),
    [filters, tableState],
  );

  return {
    filters,
    updateFilters,
    fetchTableData,
    tableOptions,
  };
};

export default useAuditTrailTableState;
