import { act, renderHook } from '@testing-library/react';

import { useAuditTrailTableState } from '../data';
import { AUDIT_TRAIL_DEFAULT_FILTERS } from '../data/constants';

const defaultTableOptions = {
  filters: AUDIT_TRAIL_DEFAULT_FILTERS,
  pageIndex: 0,
  pageSize: 10,
  sortBy: [{ id: 'timestamp', desc: true }],
};

describe('useAuditTrailTableState', () => {
  it('returns the first page, newest first, with no filters by default', () => {
    const { result } = renderHook(() => useAuditTrailTableState());
    expect(result.current.filters).toEqual(AUDIT_TRAIL_DEFAULT_FILTERS);
    expect(result.current.tableOptions).toEqual(defaultTableOptions);
  });

  it('updates the table options from the DataTable state', () => {
    const { result } = renderHook(() => useAuditTrailTableState());
    act(() => {
      result.current.fetchTableData({
        pageIndex: 2,
        pageSize: 10,
        sortBy: [{ id: 'timestamp', desc: false }],
        filters: [],
      });
    });
    expect(result.current.tableOptions).toEqual({
      ...defaultTableOptions,
      pageIndex: 2,
      sortBy: [{ id: 'timestamp', desc: false }],
    });
  });

  it('does not change the table options when the DataTable state is unchanged', () => {
    const { result } = renderHook(() => useAuditTrailTableState());
    const initialTableOptions = result.current.tableOptions;
    act(() => {
      result.current.fetchTableData({ pageIndex: 0, pageSize: 10, sortBy: [{ id: 'timestamp', desc: true }] });
    });
    expect(result.current.tableOptions).toBe(initialTableOptions);
  });

  it('returns to the first page when the filters change', () => {
    const { result } = renderHook(() => useAuditTrailTableState());
    act(() => {
      result.current.fetchTableData({ pageIndex: 4, pageSize: 10, sortBy: [{ id: 'timestamp', desc: true }] });
    });
    expect(result.current.tableOptions.pageIndex).toEqual(4);
    act(() => {
      result.current.updateFilters({ ...AUDIT_TRAIL_DEFAULT_FILTERS, actionType: 'reminded' });
    });
    expect(result.current.tableOptions).toEqual({
      ...defaultTableOptions,
      filters: { ...AUDIT_TRAIL_DEFAULT_FILTERS, actionType: 'reminded' },
    });
  });
});
