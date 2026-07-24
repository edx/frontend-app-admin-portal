import { useQuery } from '@tanstack/react-query';
import { camelCaseObject } from '@edx/frontend-platform/utils';

import { learnerCreditManagementQueryKeys } from '../constants';
import LmsApiService from '../../../../data/services/LmsApiService';

/**
 * @typedef {{ productType?: string | null } & Record<string, unknown>} EnterpriseCustomer
 */

/**
 * Retrieves an enterprise customer by UUID from the API.
 *
 * @param {string} enterpriseCustomerUuid The enterprise customer UUID.
 * @returns {Promise<EnterpriseCustomer>} The enterprise customer object
 */
const getEnterpriseCustomer = async (enterpriseCustomerUuid) => {
  const response = await LmsApiService.fetchEnterpriseCustomer(enterpriseCustomerUuid);
  const { product_type: productType, ...enterpriseCustomerData } = response.data;
  return {
    // spread after productType so a camelCase productType from the API can't silently overwrite it
    productType,
    ...camelCaseObject(enterpriseCustomerData),
  };
};

/**
 * Retrieves an enterprise customer query result.
 *
 * @param {string} enterpriseCustomerUuid The enterprise customer UUID.
 * @param {{ queryOptions?: Record<string, unknown> }} [options]
 * @returns {import('@tanstack/react-query').UseQueryResult<EnterpriseCustomer, unknown>}
 */
const useEnterpriseCustomer = (enterpriseCustomerUuid, { queryOptions } = {}) => useQuery({
  queryKey: learnerCreditManagementQueryKeys.enterpriseCustomer(enterpriseCustomerUuid),
  queryFn: () => getEnterpriseCustomer(enterpriseCustomerUuid),
  ...queryOptions,
});

export default useEnterpriseCustomer;
