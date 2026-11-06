import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import { useAuditTrailQuery } from '../data';
import { AUDIT_TRAIL_DEFAULT_FILTERS, AUDIT_TRAIL_EMPTY_TABLE_DATA } from '../data/constants';
import { queryClient } from '../../test/testUtils';

const tableOptions = {
  filters: AUDIT_TRAIL_DEFAULT_FILTERS,
  pageIndex: 0,
  pageSize: 1,
  sortBy: [{ id: 'timestamp', desc: true }],
};

const rows = [
  {
    uuid: 'a', timestamp: '2026-10-01T10:00:00Z', actionType: 'allocated', status: 'success', actorType: 'system',
  },
  {
    uuid: 'b', timestamp: '2026-10-02T10:00:00Z', actionType: 'reminded', status: 'success', actorType: 'system',
  },
];

const renderUseAuditTrailQuery = (args) => renderHook(() => useAuditTrailQuery(args), {
  wrapper: ({ children }) => ( // eslint-disable-line react/prop-types
    <QueryClientProvider client={queryClient()}>
      <IntlProvider locale="en">{children}</IntlProvider>
    </QueryClientProvider>
  ),
});

describe('useAuditTrailQuery', () => {
  it('returns empty table data until the audit history has loaded, then the requested page', async () => {
    const queryFn = jest.fn().mockResolvedValue({ rows, isTruncated: false });
    const { result } = renderUseAuditTrailQuery({ queryKey: ['auditTrail', 'test'], queryFn, tableOptions });

    expect(result.current.tableData).toBe(AUDIT_TRAIL_EMPTY_TABLE_DATA);
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.tableData).toEqual({ results: [rows[1]], itemCount: 2, pageCount: 2 });
    expect(result.current.isHistoryTruncated).toEqual(false);
    expect(queryFn).toHaveBeenCalledWith(expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('reports when older history was left out', async () => {
    const queryFn = jest.fn().mockResolvedValue({ rows, isTruncated: true });
    const { result } = renderUseAuditTrailQuery({ queryKey: ['auditTrail', 'test'], queryFn, tableOptions });
    await waitFor(() => expect(result.current.isHistoryTruncated).toEqual(true));
  });

  it('does not fetch when disabled', () => {
    const queryFn = jest.fn();
    const { result } = renderUseAuditTrailQuery({
      queryKey: ['auditTrail', 'test'], queryFn, tableOptions, enabled: false,
    });
    expect(queryFn).not.toHaveBeenCalled();
    expect(result.current.tableData).toBe(AUDIT_TRAIL_EMPTY_TABLE_DATA);
  });
});
