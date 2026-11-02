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

  test('fetchSubscriptionAuditHistory fetches the first page of a subscription plan\'s audit history', () => {
    LicenseManagerApiService.fetchSubscriptionAuditHistory(mockSubscriptionPlanUUID);
    expect(axios.get).toBeCalledWith(
      `${licenseManagerBaseUrl}/subscriptions/${mockSubscriptionPlanUUID}/audit-history/?page=1&page_size=100`,
    );
  });

  test('fetchSubscriptionAuditHistory passes the given query options', () => {
    LicenseManagerApiService.fetchSubscriptionAuditHistory(mockSubscriptionPlanUUID, { page: 3 });
    expect(axios.get).toBeCalledWith(
      `${licenseManagerBaseUrl}/subscriptions/${mockSubscriptionPlanUUID}/audit-history/?page=3&page_size=100`,
    );
  });
});
