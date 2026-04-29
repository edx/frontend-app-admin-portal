import { useEffect, useState } from 'react';
import { camelCaseObject } from '@edx/frontend-platform/utils';
import { logError } from '@edx/frontend-platform/logging';
import EnterpriseCatalogApiService from '../../../data/services/EnterpriseCatalogApiService';

/**
 * This hook returns the enterprise's catalogs that contain the given course runs.
 */
export const useApplicableCatalogs = ({
  enterpriseId,
  courseRunIds,
}) => {
  const [applicableCatalogs, setApplicableCatalogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    const fetchApplicableCatalogs = async () => {
      try {
        const resp = await EnterpriseCatalogApiService.fetchApplicableCatalogs({
          enterpriseId,
          courseRunIds,
        });
        const data = camelCaseObject(resp.data);
        const { catalogList } = data;
        setApplicableCatalogs(catalogList);
      } catch (err) {
        logError(err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicableCatalogs();
  }, [enterpriseId, courseRunIds]);

  return {
    applicableCatalogs,
    isLoading,
    error,
  };
};

/**
 * This hook returns available subscriptions that can be applied for the given course runs.
 */
export const useApplicableSubscriptions = ({
  enterpriseId,
  courseRunIds,
  subscriptions,
}) => {
  const {
    applicableCatalogs,
    isLoading,
    error,
  } = useApplicableCatalogs({ enterpriseId, courseRunIds });
  const [applicableSubscriptions, setApplicableSubscriptions] = useState([]);

  useEffect(() => {
    const applicableSubs = subscriptions.results.filter(
      subscription => applicableCatalogs.includes(subscription.enterpriseCatalogUuid)
        && subscription.daysUntilExpiration > 0 && subscription.licenses.unassigned > 0,
    );
    setApplicableSubscriptions(applicableSubs);
  }, [applicableCatalogs, subscriptions]);

  return {
    applicableCatalogs,
    applicableSubscriptions,
    isLoading,
    error,
  };
};
