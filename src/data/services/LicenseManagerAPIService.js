import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

import { configuration } from '../../config';

class LicenseManagerApiService {
  static licenseManagerBaseUrl = `${configuration.LICENSE_MANAGER_BASE_URL}/api/v1`;

  static apiClient = getAuthenticatedHttpClient;

  static licenseAssign(options, subscriptionUUID) {
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/licenses/assign/`;
    return LicenseManagerApiService.apiClient().post(url, options);
  }

  static licenseBulkRemind(subscriptionUUID, options) {
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/licenses/remind/`;
    return LicenseManagerApiService.apiClient().post(url, options);
  }

  static licenseRemindAll(subscriptionUUID) {
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/licenses/remind-all/`;
    return LicenseManagerApiService.apiClient().post(url);
  }

  static fetchSubscriptions(options) {
    const queryParams = new URLSearchParams(options);
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/?${queryParams.toString()}`;
    return LicenseManagerApiService.apiClient().get(url);
  }

  static fetchSubscriptionUsers(subscriptionUUID, options, pageSize) {
    const queryParams = new URLSearchParams({
      page_size: pageSize,
      ignore_null_emails: 1,
      ...options,
    });

    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/licenses/?${queryParams.toString()}`;
    return LicenseManagerApiService.apiClient().get(url);
  }

  /**
   * Lists the audit history (``LicenseAction`` records, newest first) of a subscription plan, including
   * actions on licenses that have since been deleted. Each action includes its resolved `actor`. `signal` cancels
   * the request (e.g. when the audit trail query is cancelled); the other options are query parameters.
   */
  static fetchSubscriptionAuditHistory(subscriptionUUID, { signal, ...options } = {}) {
    const queryParams = new URLSearchParams({
      page: 1,
      page_size: 100,
      ...options,
    });
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/audit-history/?${queryParams.toString()}`;
    return LicenseManagerApiService.apiClient().get(url, { signal });
  }

  static fetchSubscriptionUsersOverview(subscriptionUUID, options) {
    const queryParams = new URLSearchParams({
      ignore_null_emails: 1,
      ...options,
    });

    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/licenses/overview/?${queryParams.toString()}`;
    return LicenseManagerApiService.apiClient().get(url);
  }

  static fetchSubscriptionLicenseDataCsv(subscriptionUUID) {
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/licenses/csv/`;
    return LicenseManagerApiService.apiClient().get(url);
  }

  static licenseBulkRevoke(subscriptionUUID, options) {
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/licenses/bulk-revoke/`;
    return LicenseManagerApiService.apiClient().post(url, options);
  }

  static licenseRevokeAll(subscriptionUUID) {
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/subscriptions/${subscriptionUUID}/licenses/revoke-all/`;
    return LicenseManagerApiService.apiClient().post(url);
  }

  static licenseBulkEnroll(enterpriseUuid, subscriptionUUID, options) {
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/bulk-license-enrollment/?enterprise_customer_uuid=${enterpriseUuid}&subscription_uuid=${subscriptionUUID}`;
    return LicenseManagerApiService.apiClient().post(url, options);
  }

  static fetchBulkEnrollmentJob(enterpriseUuid, bulkEnrollmentJobUuid) {
    const queryParams = new URLSearchParams();
    if (enterpriseUuid) {
      queryParams.set('enterprise_customer_uuid', enterpriseUuid);
    }
    if (bulkEnrollmentJobUuid) {
      queryParams.set('bulk_enrollment_job_uuid', bulkEnrollmentJobUuid);
    }
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/bulk-license-enrollment/?${queryParams.toString()}`;
    return LicenseManagerApiService.apiClient().get(url);
  }

  /**
   * Fetches the customer agreements matching `options` (query parameters). `signal`, when given, cancels the request.
   */
  static fetchCustomerAgreementData(options, { signal } = {}) {
    const queryParams = new URLSearchParams(options);
    const url = `${LicenseManagerApiService.licenseManagerBaseUrl}/customer-agreement/?${queryParams.toString()}`;
    // Existing callers don't pass a `signal`, so the request is unchanged for them.
    return signal
      ? LicenseManagerApiService.apiClient().get(url, { signal })
      : LicenseManagerApiService.apiClient().get(url);
  }
}

export default LicenseManagerApiService;
