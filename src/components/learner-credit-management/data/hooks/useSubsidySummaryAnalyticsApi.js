import { useEffect, useState } from 'react';
import { camelCaseObject } from '@edx/frontend-platform/utils';
import { logError } from '@edx/frontend-platform/logging';

import EnterpriseDataApiService from '../../../../data/services/EnterpriseDataApiService';
import { transformSubsidySummary } from '../utils';
import { BUDGET_TYPES } from '../../../EnterpriseApp/data/constants';

const useSubsidySummaryAnalyticsApi = (enterpriseUUID, budgetId, budgetSource) => {
  const [isLoading, setIsLoading] = useState(true);
  const [subsidySummary, setSubsidySummary] = useState();

  useEffect(() => {
    // Only fetch for subsidy-type budgets (not policies, which have their own aggregates)
    if (budgetSource !== BUDGET_TYPES.subsidy) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await EnterpriseDataApiService.fetchEnterpriseOfferSummary(
          enterpriseUUID,
          budgetId,
        );
        const data = camelCaseObject(response.data);
        const transformedSubsidySummary = transformSubsidySummary(data);
        setSubsidySummary(transformedSubsidySummary);
      } catch (error) {
        logError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [enterpriseUUID, budgetId, budgetSource]);

  return {
    isLoading,
    subsidySummary,
  };
};

export default useSubsidySummaryAnalyticsApi;
