import { act, renderHook } from '@testing-library/react';

import { useAuditTrailTableState } from '../data';
import { AUDIT_TRAIL_DEFAULT_FILTERS } from '../data/constants';

describe('useAuditTrailTableState', () => {
  it('returns the first page, newest first, with no filters by default', () => {
    const { result } = renderHook(() => useAuditTrailTableState());
    expect(result.current.filters).toEqual(AUDIT_TRAIL_DEFAULT_FILTERS);
    expect(result.current.queryOptions).toEqual({ page: 1, pageSize: 10, ordering: '-created' });
  });

  it('updates the query options from the DataTable state', () => {
    const { result } = renderHook(() => useAuditTrailTableState());
    act(() => {
      result.current.fetchTableData({
        pageIndex: 2,
        pageSize: 10,
        sortBy: [{ id: 'timestamp', desc: false }],
        filters: [],
      });
    });
    expect(result.current.queryOptions).toEqual({ page: 3, pageSize: 10, ordering: 'created' });
  });

  it('does not change the query options when the DataTable state is unchanged', () => {
    const { result } = renderHook(() => useAuditTrailTableState());
    const initialQueryOptions = result.current.queryOptions;
    act(() => {
      result.current.fetchTableData({ pageIndex: 0, pageSize: 10, sortBy: [{ id: 'timestamp', desc: true }] });
    });
    expect(result.current.queryOptions).toBe(initialQueryOptions);
  });

  it('returns to the first page when the filters change', () => {
    const { result } = renderHook(() => useAuditTrailTableState());
    act(() => {
      result.current.fetchTableData({ pageIndex: 4, pageSize: 10, sortBy: [{ id: 'timestamp', desc: true }] });
    });
    expect(result.current.queryOptions.page).toEqual(5);
    act(() => {
      result.current.updateFilters({ ...AUDIT_TRAIL_DEFAULT_FILTERS, actionType: 'reminded' });
    });
    expect(result.current.filters.actionType).toEqual('reminded');
    expect(result.current.queryOptions).toEqual({
      page: 1,
      pageSize: 10,
      ordering: '-created',
      actionType: 'reminded',
    });
  });
});
