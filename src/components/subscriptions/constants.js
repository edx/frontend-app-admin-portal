export const TAB_ALL_USERS = 'TAB_ALL_USERS';
export const TAB_LICENSED_USERS = 'TAB_LICENSED_USERS';
export const TAB_PENDING_USERS = 'TAB_PENDING_USERS';
export const TAB_REVOKED_USERS = 'TAB_REVOKED_USERS';

export const PAGE_SIZE = 20;

// Subscription license statuses as defined on the backend
export const ACTIVATED = 'activated';
export const ASSIGNED = 'assigned';
export const REVOKED = 'revoked';
export const ALL_USERS = 'assigned,activated,revoked';

export const SUBSCRIPTIONS = 'Subscriptions';
export const SUBSCRIPTION_OVERVIEW = 'Subscription Overview';
export const SUBSCRIPTION_USERS = 'Subscription Users';
export const SUBSCRIPTION_USERS_OVERVIEW = 'Subscription Users Overview';

export const NETWORK_ERROR_MESSAGE = 'Error occurred while loading the data.';
export const DEFAULT_PAGE = 1;

// used to determine whether to show the revocation cap messaging in the license revoke modal
export const SHOW_REVOCATION_CAP_PERCENT = 80;

// Subscription expiration
// Days until expiration threshold constants
export const SUBSCRIPTION_EXPIRATION_FIRST_THRESHOLD = 120;
export const SUBSCRIPTION_EXPIRATION_SECOND_THRESHOLD = 60;
export const SUBSCRIPTION_EXPIRATION_THIRD_THRESHOLD = 30;
// Prefix for cookies that determine if the user has seen the modal for that threshold of expiration
export const SEEN_SUBSCRIPTION_EXPIRATION_MODAL_COOKIE_PREFIX = 'seen-expiration-modal-';
