import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import dayjs from 'dayjs';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { logError } from '@edx/frontend-platform/logging';
import { camelCaseObject } from '@edx/frontend-platform/utils';

import LicenseManagerApiService from '../../../data/services/LicenseManagerAPIService';
import {
  NETWORK_ERROR_MESSAGE,
  SELF_SERVICE_PAID,
  SELF_SERVICE_TRIAL,
  STRIPE_EVENT_SUMMARY,
  SUBSCRIPTION_USERS,
  SUBSCRIPTION_USERS_OVERVIEW,
  SUBSCRIPTIONS,
  subscriptionsQueryKeys,
} from './constants';
import EnterpriseAccessApiService from '../../../data/services/EnterpriseAccessApiService';
import {
  fetchPaginatedResults,
  mapWithConcurrencyLimit,
} from '../../AuditTrail/data/utils';
import {
  AUDIT_TRAIL_API_PAGE_SIZE,
  AUDIT_TRAIL_MAX_CONCURRENT_REQUESTS,
  AUDIT_TRAIL_MAX_PAGES_PER_SOURCE,
} from '../../AuditTrail/data/constants';
import { useAuditTrailQuery } from '../../AuditTrail/data/hooks';
import { transformLicenseActionsToAuditTrailRows } from './utils';

const subscriptionInitState = {
  results: [],
  count: 0,
  next: null,
  previous: null,
};
/*
 * This hook provides all customer agreement and subscription data
 * for the authenticated user and given enterprise customer UUID.
 */
export const useSubscriptions = ({ enterpriseId, setErrors }) => {
  const [subscriptions, setSubscriptions] = useState({ ...subscriptionInitState });

  const [loading, setLoading] = useState(true);

  const loadCustomerAgreementData = useCallback((page = 1) => {
    const fetchData = async () => {
      try {
        const response = await LicenseManagerApiService.fetchCustomerAgreementData({
          enterprise_customer_uuid: enterpriseId,
          page,
        });
        const { data: customerAgreementData } = camelCaseObject(response);
        const subscriptionsData = { ...subscriptionInitState };
        // Reshape the Customer Agreement API response into the flatter format for the app to use:
        if (customerAgreementData.results && customerAgreementData.count) {
          // Only look at customer agreements with subs:
          customerAgreementData.results.filter(result => (result.subscriptions && result.subscriptions.length))
            .forEach(customerAgreement => {
              // Push information about whether a particular subscription
              // should have expiration notices displayed for it down into
              // that subscription.
              const flattenedSubscriptionResults = customerAgreement.subscriptions.map(subscription => ({
                ...subscription,
                showExpirationNotifications: !(customerAgreement.disableExpirationNotifications || false),
                agreementNetDaysUntilExpiration: customerAgreement.netDaysUntilExpiration,
              }));
              subscriptionsData.results = subscriptionsData.results.concat(flattenedSubscriptionResults);
            });
          subscriptionsData.count = subscriptionsData.results.length;
        }
        setSubscriptions(subscriptionsData);
      } catch (err) {
        logError(err);
        setErrors(s => ({
          ...s,
          [SUBSCRIPTIONS]: NETWORK_ERROR_MESSAGE,
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [enterpriseId, setErrors]);

  const forceRefresh = useCallback(() => {
    loadCustomerAgreementData();
  }, [loadCustomerAgreementData]);

  useEffect(loadCustomerAgreementData, [loadCustomerAgreementData]);

  return {
    subscriptions,
    forceRefresh,
    loading,
  };
};

const initialSubscriptionUsersOverview = {
  all: 0,
  activated: 0,
  assigned: 0,
  revoked: 0,
};

/*
 * This hook provides an object which outlines the number of users for each license state given a subscription UUID.
 * It is also dependent on the search query state provided by SubscriptionDetailContext.
 */
export const useSubscriptionUsersOverview = ({
  subscriptionUUID,
  search,
  setErrors,
  isDisabled = false,
}) => {
  const [subscriptionUsersOverview, setSubscriptionUsersOverview] = useState(initialSubscriptionUsersOverview);

  const loadSubscriptionUsersOverview = useCallback(() => {
    const fetchOverview = async () => {
      const options = {};
      if (search) {
        options.search = search;
      }
      if (subscriptionUUID) {
        try {
          const response = await LicenseManagerApiService.fetchSubscriptionUsersOverview(subscriptionUUID, options);
          const subscriptionUsersOverviewData = response.data.reduce((accumulator, currentValue) => ({
            ...accumulator, [currentValue.status]: currentValue.count,
          }), initialSubscriptionUsersOverview);
          subscriptionUsersOverviewData.all = response.data.reduce(
            (accumulator, currentValue) => accumulator + +currentValue.count,
            0,
          );
          setSubscriptionUsersOverview(camelCaseObject(subscriptionUsersOverviewData));
        } catch (err) {
          logError(err);
          setErrors(s => ({
            ...s,
            [SUBSCRIPTION_USERS_OVERVIEW]: NETWORK_ERROR_MESSAGE,
          }));
        }
      }
    };
    fetchOverview();
  }, [search, setErrors, subscriptionUUID]);

  const forceRefresh = useCallback(() => {
    loadSubscriptionUsersOverview();
  }, [loadSubscriptionUsersOverview]);

  useEffect(
    () => {
      if (!isDisabled) {
        loadSubscriptionUsersOverview();
      }
    },
    [isDisabled, loadSubscriptionUsersOverview],
  );

  return [subscriptionUsersOverview, forceRefresh];
};

/**
 * This hook provides a list of users for a given subscription UUID.
 * It is also dependent on state from SubscriptionDetailContext.
 */
export const useSubscriptionUsers = ({
  currentPage,
  sortBy,
  searchQuery,
  subscriptionUUID,
  setErrors,
  userStatusFilter,
  isDisabled = false,
  pageSize,
}) => {
  const [subscriptionUsers, setSubscriptionUsers] = useState({ ...subscriptionInitState });
  const [loadingUsers, setLoadingUsers] = useState(true);

  const loadSubscriptionUsers = useCallback(() => {
    if (!subscriptionUUID) {
      return;
    }
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const options = {
        status: userStatusFilter,
        page: currentPage,
        ordering: sortBy,
      };
      if (searchQuery) {
        options.search = searchQuery;
      }
      try {
        const response = await LicenseManagerApiService.fetchSubscriptionUsers(subscriptionUUID, options, pageSize);
        setSubscriptionUsers(camelCaseObject(response.data));
        setLoadingUsers(false);
      } catch (err) {
        logError(err);
        setErrors(s => ({
          ...s,
          [SUBSCRIPTION_USERS]: NETWORK_ERROR_MESSAGE,
        }));
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [
    currentPage,
    sortBy,
    searchQuery,
    setErrors,
    subscriptionUUID,
    userStatusFilter,
    pageSize,
  ]);

  const forceRefresh = useCallback(() => {
    loadSubscriptionUsers();
  }, [loadSubscriptionUsers]);

  useEffect(
    () => {
      if (isDisabled) { return; }
      loadSubscriptionUsers();
    },
    [isDisabled, loadSubscriptionUsers],
  );

  return [subscriptionUsers, forceRefresh, loadingUsers];
};

/**
 * Normalizes raw camelCased Stripe API data into a consistent shape for consumers.
 * Converts upcomingInvoiceAmountDue from cents to dollars as invoiceAmountDue.
 */
const normalizeStripeInfo = (data) => {
  if (!data) { return data; }
  const { upcomingInvoiceAmountDue, ...rest } = data;
  return {
    ...rest,
    invoiceAmountDue: upcomingInvoiceAmountDue != null ? upcomingInvoiceAmountDue / 100 : null,
  };
};

/**
 * Fetches Stripe payment event for each self-service subscription simultaneously.
 * Builds a lookup table mapping each subscription UUID to its Stripe data, or null if
 * the plan has no Stripe data (sales-provisioned plans, 404s) or the request failed.
 * Returns that lookup table and a loading flag.
 * @param {Object} subscriptions - The subscriptions object with a `results` array.
 * @param {boolean} subscriptionsLoading - Whether the subscriptions fetch is still in-flight.
 *   Keeping loadingStripeInfo=true while subscriptions are loading prevents a brief combined
 *   loading=false flash between when subscriptions resolve and when this effect re-runs.
 * @param {Function} setErrors - Error setter from SubscriptionContext.
 */
export const useStripeEventsBySubscription = ({ subscriptions, subscriptionsLoading, setErrors }) => {
  const [stripeInfoByUuid, setStripeInfoByUuid] = useState({});
  const [loadingStripeInfo, setLoadingStripeInfo] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (subscriptionsLoading) {
      return undefined;
    }
    if (!subscriptions?.results?.length) {
      setStripeInfoByUuid(prev => (Object.keys(prev).length > 0 ? {} : prev));
      setLoadingStripeInfo(false);
      return undefined;
    }
    setLoadingStripeInfo(true);
    const fetchAll = async () => {
      // Only self-service plans are purchased through Stripe; sales-provisioned plans never have Stripe data.
      const uuids = subscriptions.results
        .filter(s => [SELF_SERVICE_PAID, SELF_SERVICE_TRIAL].includes(s.planType))
        .map(s => s.uuid);
      const settled = await Promise.allSettled(
        uuids.map(uuid => EnterpriseAccessApiService.fetchStripeEvent(uuid)),
      );
      if (cancelled) { return; }
      const infoMap = Object.fromEntries(subscriptions.results.map(s => [s.uuid, null]));
      let hasError = false;
      // A 404 means the plan has no Stripe data, so it stays null without being reported as an error.
      settled.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value?.data) {
          infoMap[uuids[idx]] = normalizeStripeInfo(camelCaseObject(result.value.data));
        } else if (result.status === 'rejected' && result.reason?.customAttributes?.httpErrorStatus !== 404) {
          logError(result.reason);
          hasError = true;
        }
      });
      if (hasError) {
        setErrors(s => ({ ...s, [STRIPE_EVENT_SUMMARY]: NETWORK_ERROR_MESSAGE }));
      }
      setStripeInfoByUuid(infoMap);
      setLoadingStripeInfo(false);
    };
    fetchAll().catch(err => {
      if (cancelled) { return; }
      logError(err);
      setErrors(s => ({ ...s, [STRIPE_EVENT_SUMMARY]: NETWORK_ERROR_MESSAGE }));
      setStripeInfoByUuid(Object.fromEntries(subscriptions.results.map(s => [s.uuid, null])));
      setLoadingStripeInfo(false);
    });
    return () => { cancelled = true; };
  }, [subscriptions, subscriptionsLoading, setErrors]);

  return { stripeInfoByUuid, loadingStripeInfo };
};

/*
 * This hook provides top level subscription data and customer agreement data for the given enterprise customer UUID.
 * It also provides an error state to be used by all subscription and license components.
*/
export const useSubscriptionData = ({ enterpriseId }) => {
  const [errors, setErrors] = useState({});
  const {
    subscriptions,
    forceRefresh,
    loading,
  } = useSubscriptions({ enterpriseId, setErrors });
  const { stripeInfoByUuid, loadingStripeInfo } = useStripeEventsBySubscription({
    subscriptions,
    subscriptionsLoading: loading,
    setErrors,
  });

  // Builds the set of subscription UUIDs that should be hidden from the UI.
  // A renewed (paid) plan is suppressed only while the trial plan that points to it is
  // still within its active window. Once the trial has expired the paid plan is the live
  // plan and must remain visible even if a cancellation has been scheduled on it.
  const suppressedSubscriptionUuids = useMemo(() => {
    const suppressed = new Set();
    if (!subscriptions?.results) {
      return suppressed;
    }
    Object.entries(stripeInfoByUuid).forEach(([uuid, info]) => {
      if (info?.renewedSubscriptionPlanUuid) {
        const ownerPlan = subscriptions.results.find(s => s.uuid === uuid);
        const ownerStillActive = ownerPlan?.expirationDate && dayjs(ownerPlan.expirationDate).isAfter(dayjs());
        const futureCancellation = info.canceledDate && dayjs(info.canceledDate).isAfter(dayjs());
        if (ownerStillActive && (info.isCanceled || futureCancellation)) {
          suppressed.add(info.renewedSubscriptionPlanUuid);
        }
      }
    });
    return suppressed;
  }, [stripeInfoByUuid, subscriptions]);

  return {
    subscriptions,
    errors,
    setErrors,
    forceRefresh,
    loading: loading || loadingStripeInfo,
    stripeInfoByUuid,
    suppressedSubscriptionUuids,
  };
};

/**
 * This hook fetches information about a Stripe trial SubscriptionPlan
 * @param {string} subPlanUuid - The UUID of the SubscriptionPlan.
 * @param {Function} setErrors - Function from SubscriptionContext that updates error state via a state update callback.
*/
export const useStripeSubscriptionPlanInfo = ({ subPlanUuid, setErrors }) => {
  const [loadingStripeSummary, setLoadingStripeSummary] = useState(true);
  const [invoiceAmount, setInvoiceAmount] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [canceledDate, setCanceledDate] = useState(null);
  const [isCanceled, setIsCanceled] = useState(false);
  const [renewedSubscriptionPlanUuid, setRenewedSubscriptionPlanUuid] = useState(null);
  useEffect(() => {
    const fetchStripeEvent = async () => {
      try {
        const response = await EnterpriseAccessApiService.fetchStripeEvent(subPlanUuid);
        if (response.status === 404) {
          setLoadingStripeSummary(false);
          return;
        }
        const results = camelCaseObject(response.data);
        if (results.upcomingInvoiceAmountDue !== null) {
          setInvoiceAmount(results.upcomingInvoiceAmountDue / 100);
        } else {
          setInvoiceAmount(null);
        }
        setCurrency(results.currency);
        setCanceledDate(results.canceledDate);
        setIsCanceled(results.isCanceled ?? false);
        setRenewedSubscriptionPlanUuid(results.renewedSubscriptionPlanUuid ?? null);
      } catch (error) {
        logError(error);
        setErrors(s => ({
          ...s,
          [STRIPE_EVENT_SUMMARY]: NETWORK_ERROR_MESSAGE,
        }));
      } finally {
        setLoadingStripeSummary(false);
      }
    };
    fetchStripeEvent();
  }, [setErrors, subPlanUuid]);

  return {
    invoiceAmount,
    currency,
    canceledDate,
    isCanceled,
    renewedSubscriptionPlanUuid,
    loadingStripeSummary,
  };
};

/**
 * Retrieves the audit trail actions (``LicenseAction`` records) of all subscription plans of the given enterprise
 * customer. Inactive plans are included, so that the history of expired plans is still shown.
 *
 * Loading is bounded per plan: at most `AUDIT_TRAIL_MAX_PAGES_PER_SOURCE` pages of its most recent actions are
 * fetched (the API returns them newest first), for at most `AUDIT_TRAIL_MAX_CONCURRENT_REQUESTS` plans at a time.
 * `isTruncated` is true when older actions were left out. `signal` cancels the requests when the query is cancelled.
 */
const getLicenseAuditTrailHistory = async (enterpriseId, signal) => {
  const { results: customerAgreements } = await fetchPaginatedResults(
    page => LicenseManagerApiService.fetchCustomerAgreementData({
      enterprise_customer_uuid: enterpriseId,
      active_plans_only: false,
      page,
    }, { signal }),
  );
  const subscriptionPlanUUIDs = customerAgreements.flatMap(
    customerAgreement => (customerAgreement.subscriptions || []).map(subscription => subscription.uuid),
  );
  const actionsByPlan = await mapWithConcurrencyLimit(
    subscriptionPlanUUIDs,
    AUDIT_TRAIL_MAX_CONCURRENT_REQUESTS,
    subscriptionUUID => fetchPaginatedResults(
      page => LicenseManagerApiService.fetchSubscriptionAuditHistory(
        subscriptionUUID,
        { page, page_size: AUDIT_TRAIL_API_PAGE_SIZE, signal },
      ),
      { maxPages: AUDIT_TRAIL_MAX_PAGES_PER_SOURCE },
    ),
  );
  return {
    rows: transformLicenseActionsToAuditTrailRows(
      actionsByPlan.flatMap(({ results }) => results),
      getAuthenticatedUser(),
    ),
    isTruncated: actionsByPlan.some(({ isTruncated }) => isTruncated),
  };
};

/**
 * Returns a page of subscription license audit trail actions for the given enterprise customer (`tableData`), and
 * whether older history was left out (`isHistoryTruncated`); see `useAuditTrailQuery`.
 *
 * The license-manager audit history API is per subscription plan, so the actions of every plan are fetched once
 * (see `getLicenseAuditTrailHistory`) and then filtered, sorted and paginated in the browser using `tableOptions`.
 *
 * @param {string} enterpriseId The enterprise customer UUID.
 * @param {object} tableOptions Filters and `DataTable` (pagination/sort) state from `useAuditTrailTableState`.
 */
export const useLicenseAuditTrail = ({ enterpriseId, tableOptions }) => useAuditTrailQuery({
  queryKey: subscriptionsQueryKeys.auditTrail(enterpriseId),
  queryFn: ({ signal }) => getLicenseAuditTrailHistory(enterpriseId, signal),
  enabled: !!enterpriseId,
  tableOptions,
});
