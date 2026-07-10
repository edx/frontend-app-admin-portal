import React from 'react';

import { logError } from '@edx/frontend-platform/logging';

const getExtraOptionsKey = (extraOptions) => {
  try {
    return JSON.stringify(extraOptions || {});
  } catch (err) {
    logError(err);
    // Fall back to reference-based tracking so option changes still trigger refetch.
    return extraOptions;
  }
};

const usePaginatedLearnerTableData = ({
  enterpriseId,
  pageIndex,
  ordering,
  pageSize,
  fetchMethod,
  extraOptions,
}) => {
  const [data, setData] = React.useState([]);
  const [itemCount, setItemCount] = React.useState(0);
  const [pageCount, setPageCount] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const extraOptionsRef = React.useRef(extraOptions);
  const extraOptionsKey = React.useMemo(
    () => getExtraOptionsKey(extraOptions),
    [extraOptions],
  );

  React.useEffect(() => {
    extraOptionsRef.current = extraOptions;
  }, [extraOptions]);

  React.useEffect(() => {
    let isCurrent = true;

    const options = {
      page: pageIndex + 1,
      page_size: pageSize,
      ...(ordering ? { ordering } : {}),
      ...(extraOptionsRef.current || {}),
    };

    setIsLoading(true);
    setError(null);

    fetchMethod(enterpriseId, options)
      .then((response) => {
        if (!isCurrent) {
          return;
        }

        const responseData = response?.data || {};
        const results = responseData.results || [];

        setData(results);
        setItemCount(responseData.count ?? results.length);
        setPageCount(responseData.num_pages || 1);
      })
      .catch((err) => {
        if (!isCurrent) {
          return;
        }

        logError(err);
        setError(err);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [enterpriseId, extraOptionsKey, fetchMethod, ordering, pageIndex, pageSize]);

  return {
    data,
    itemCount,
    pageCount,
    isLoading,
    error,
  };
};

export default usePaginatedLearnerTableData;
