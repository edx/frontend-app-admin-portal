import { useQuery } from '@tanstack/react-query';
import { camelCaseObject } from '@edx/frontend-platform/utils';

import { learnerCreditManagementQueryKeys } from '../constants';
import LmsApiService from '../../../../data/services/LmsApiService';

/**
 * @typedef {{ productType?: string | null } & Record<string, unknown>} EnterpriseCustomer
 */

/**
 * Retrieves a enterprise customer by UUID from the API.
 *
 * @param {*} queryKey The queryKey from the associated `useQuery` call.
 * @returns {Promise<EnterpriseCustomer>} The enterprise customer object
 */
const getEnterpriseCustomer = async (enterpriseCustomerUuid) => {
  const response = await LmsApiService.fetchEnterpriseCustomer(enterpriseCustomerUuid);
  const { product_type: productType, ...enterpriseCustomerData } = response.data;
  return {
    ...camelCaseObject(enterpriseCustomerData),
    productType,
  };
};

const useEnterpriseCustomer = (enterpriseCustomerUuid, { queryOptions } = {}) => useQuery({
  queryKey: learnerCreditManagementQueryKeys.enterpriseCustomer(enterpriseCustomerUuid),
  queryFn: () => getEnterpriseCustomer(enterpriseCustomerUuid),
  ...queryOptions,
});

export default useEnterpriseCustomer;
