import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logError } from '@edx/frontend-platform/logging';
import { useToggle } from '@openedx/paragon';

import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import { learnerCreditManagementQueryKeys } from '../constants';
import useBudgetId from './useBudgetId';
import { applyFiltersToOptions } from './useBnrSubsidyRequests';

/**
 * Hook for handling bulk remind operations on approved BNR (Browse and Request) subsidy requests.
 * Supports both reminding specific requests by UUID and reminding all requests matching filters.
 *
 * @param {Object} params - The hook parameters
 * @param {string[]} params.subsidyRequestUUIDs - Array of request UUIDs to remind
 * @param {string} params.enterpriseId - The enterprise customer UUID
 * @param {string} params.policyUuid - The subsidy access policy UUID
 * @param {boolean} [params.remindAll=false] - If true, remind all requests matching filters
 * @param {Array} [params.tableFilters=[]] - Table filters to apply when remindAll is true
 * @param {Function} [params.onSuccess] - Callback to execute on successful remind
 * @param {Function} [params.onFailure] - Callback to execute on failed remind
 * @returns {Object} Hook state and functions
 */
const useBulkRemindApprovedRequests = ({
  subsidyRequestUUIDs,
  enterpriseId,
  policyUuid,
  remindAll = false,
  tableFilters = [],
  onSuccess,
  onFailure,
}) => {
  const [isOpen, open, close] = useToggle(false);
  const [remindButtonState, setRemindButtonState] = useState('default');
  const queryClient = useQueryClient();
  const { subsidyAccessPolicyId } = useBudgetId();

  const remindApprovedRequests = useCallback(async () => {
    setRemindButtonState('pending');
    try {
      if (remindAll) {
        const options = {};
        applyFiltersToOptions(tableFilters, options);
        await EnterpriseAccessApiService.remindAllApprovedBnrSubsidyRequests({
          enterpriseId,
          policyUuid,
          options,
        });
      } else {
        await EnterpriseAccessApiService.remindApprovedBnrSubsidyRequests({
          enterpriseId,
          subsidyRequestUUIDs,
        });
      }
      setRemindButtonState('complete');

      if (onSuccess) {
        onSuccess();
      }

      queryClient.invalidateQueries({
        queryKey: learnerCreditManagementQueryKeys.budget(subsidyAccessPolicyId),
      });
    } catch (err) {
      logError(err);
      setRemindButtonState('error');

      if (onFailure) {
        onFailure(err);
      }
    }
  }, [
    subsidyRequestUUIDs,
    enterpriseId,
    policyUuid,
    remindAll,
    tableFilters,
    queryClient,
    subsidyAccessPolicyId,
    onSuccess,
    onFailure,
  ]);

  return {
    remindButtonState,
    remindApprovedRequests,
    close,
    isOpen,
    open,
  };
};

export default useBulkRemindApprovedRequests;
