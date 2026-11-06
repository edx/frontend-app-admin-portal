/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

import LicenseManagerApiService from '../LicenseManagerAPIService';

getAuthenticatedHttpClient.mockReturnValue(axios);
axios.get = jest.fn();

const licenseManagerBaseUrl = `${process.env.LICENSE_MANAGER_BASE_URL}/api/v1`;
const mockSubscriptionPlanUUID = 'test-subscription-plan-uuid';

describe('LicenseManagerApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchCustomerAgreementData fetches the customer agreements matching the given options', () => {
    LicenseManagerApiService.fetchCustomerAgreementData({ enterprise_customer_uuid: 'test-enterprise-uuid' });
    expect(axios.get).toBeCalledWith(
      `${licenseManagerBaseUrl}/customer-agreement/?enterprise_customer_uuid=test-enterprise-uuid`,
    );
  });

  test('fetchCustomerAgreementData passes the given cancellation signal', () => {
    const { signal } = new AbortController();
    LicenseManagerApiService.fetchCustomerAgreementData({ enterprise_customer_uuid: 'test-enterprise-uuid' }, { signal });
    expect(axios.get).toBeCalledWith(
      `${licenseManagerBaseUrl}/customer-agreement/?enterprise_customer_uuid=test-enterprise-uuid`,
      { signal },
    );
  });

  test('fetchSubscriptionAuditHistory fetches the first page of a subscription plan\'s audit history', () => {
    LicenseManagerApiService.fetchSubscriptionAuditHistory(mockSubscriptionPlanUUID);
    expect(axios.get).toBeCalledWith(
      `${licenseManagerBaseUrl}/subscriptions/${mockSubscriptionPlanUUID}/audit-history/?page=1&page_size=100`,
      { signal: undefined },
    );
  });

  test('fetchSubscriptionAuditHistory passes the given query options and cancellation signal', () => {
    const { signal } = new AbortController();
    LicenseManagerApiService.fetchSubscriptionAuditHistory(
      mockSubscriptionPlanUUID,
      { page: 3, page_size: 50, signal },
    );
    expect(axios.get).toBeCalledWith(
      `${licenseManagerBaseUrl}/subscriptions/${mockSubscriptionPlanUUID}/audit-history/?page=3&page_size=50`,
      { signal },
    );
  });
});
