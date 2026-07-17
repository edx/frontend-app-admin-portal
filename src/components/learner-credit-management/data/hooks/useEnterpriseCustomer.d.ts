import type { UseQueryResult } from '@tanstack/react-query';

export type EnterpriseCustomer = {
  productType?: string | null;
  [key: string]: unknown;
};

declare const useEnterpriseCustomer: (
  enterpriseCustomerUuid: string,
  options?: {
    queryOptions?: Record<string, unknown>;
  },
) => UseQueryResult<EnterpriseCustomer, unknown>;

export default useEnterpriseCustomer;
