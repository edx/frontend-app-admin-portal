import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { QueryFunction, QueryKey } from '@tanstack/react-query';
import { useIntl } from '@edx/frontend-platform/i18n';

import { AUDIT_TRAIL_EMPTY_TABLE_DATA } from '../constants';
import messages from '../messages';
import { applyAuditTrailTableOptions, retryAuditTrailQuery } from '../utils';
import type { AuditTrailHistory, AuditTrailTableData, AuditTrailTableOptions } from '../types';

type UseAuditTrailQueryArgs = {
  queryKey: QueryKey;
  /** Loads the audit history; receives react-query's `signal` to cancel its requests. */
  queryFn: QueryFunction<AuditTrailHistory>;
  /** Filters and `DataTable` (pagination/sort) state, from `useAuditTrailTableState`. */
  tableOptions: AuditTrailTableOptions;
  enabled?: boolean;
};

/**
 * Loads an audit trail's history (all of it at once, see `AuditTrailHistory`) and returns the page of rows matching
 * `tableOptions` as `tableData`, filtered, sorted and paginated in the browser, plus whether older history was left
 * out (`isHistoryTruncated`). Also returns the rest of the `useQuery` result (e.g. `isLoading`, `isError`, `refetch`).
 *
 * Each attempt reloads the whole audit history, so failures are retried at most once and never for client errors
 * (see `retryAuditTrailQuery`). The app's default `staleTime` applies, so reopening an audit trail within it reuses
 * the cached history.
 */
const useAuditTrailQuery = ({
  queryKey,
  queryFn,
  tableOptions,
  enabled = true,
}: UseAuditTrailQueryArgs) => {
  const intl = useIntl();
  const { data: auditTrailHistory, ...queryResult } = useQuery({
    queryKey,
    queryFn,
    enabled,
    retry: retryAuditTrailQuery,
  });

  const tableData: AuditTrailTableData = useMemo(() => {
    if (!auditTrailHistory) {
      return AUDIT_TRAIL_EMPTY_TABLE_DATA;
    }
    return applyAuditTrailTableOptions(auditTrailHistory.rows, tableOptions, {
      systemActorLabel: intl.formatMessage(messages.actorSystem),
    });
  }, [auditTrailHistory, tableOptions, intl]);

  return { ...queryResult, tableData, isHistoryTruncated: !!auditTrailHistory?.isTruncated };
};

export default useAuditTrailQuery;
