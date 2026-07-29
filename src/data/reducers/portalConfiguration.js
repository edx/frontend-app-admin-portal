import {
  FETCH_PORTAL_CONFIGURATION_REQUEST,
  FETCH_PORTAL_CONFIGURATION_SUCCESS,
  FETCH_PORTAL_CONFIGURATION_FAILURE,
  CLEAR_PORTAL_CONFIGURATION,
  UPDATE_PORTAL_CONFIGURATION,
} from '../constants/portalConfiguration';

const initialState = {
  loading: true,
  error: null,
  contactEmail: null,
  enterpriseId: null,
  enterpriseName: null,
  enterpriseSlug: null,
  productType: null,
  enterpriseBranding: null,
  identityProvider: null,
  disableExpiryMessagingForLearnerCredit: false,
  enableCodeManagementScreen: false,
  enableReportingConfigScreen: false,
  enableSubscriptionManagementScreen: false,
  enableSamlConfigurationScreen: false,
  enableLmsConfigurationsScreen: false,
  enableAnalyticsScreen: false,
  enablePeopleManagementScreen: false,
  enableIntegratedCustomerLearnerPortalSearch: false,
  enableLearnerPortal: false,
  enableUniversalLink: false,
  enablePortalLearnerCreditManagementScreen: false,
  enableApiCredentialGeneration: false,
  enableDemoData: false,
  enableAuditDataReporting: false,
  enterpriseFeatures: {},
};

const portalConfiguration = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PORTAL_CONFIGURATION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_PORTAL_CONFIGURATION_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        contactEmail: action.payload.data.contact_email,
        enterpriseId: action.payload.data.uuid,
        enterpriseName: action.payload.data.name,
        enterpriseSlug: action.payload.data.slug,

        // The backend returns `product_type` (snake_case), while some frontend
        // API paths may transform response keys to `productType` (camelCase).
        // Support both formats temporarily for compatibility.
        //
        // TODO: Remove this fallback once all API responses consistently use
        // a single key format.
        productType: action.payload.data.product_type ?? action.payload.data.productType ?? null,
        enterpriseBranding: action.payload.data.branding_configuration,
        identityProvider: action.payload.data.identity_provider,
        disableExpiryMessagingForLearnerCredit: action.payload.data.disable_expiry_messaging_for_learner_credit,
        enableCodeManagementScreen: action.payload.data.enable_portal_code_management_screen || false,
        enableReportingConfigScreen: action.payload.data.enable_portal_reporting_config_screen,
        enableSubscriptionManagementScreen: action.payload.data.enable_portal_subscription_management_screen, // eslint-disable-line max-len
        enableSamlConfigurationScreen: action.payload.data.enable_portal_saml_configuration_screen,
        enableAnalyticsScreen: action.payload.data.enable_analytics_screen,
        enablePeopleManagementScreen: action.payload.data.enable_people_management,
        enableLearnerPortal: action.payload.data.enable_learner_portal,
        enableIntegratedCustomerLearnerPortalSearch: action.payload.data.enable_integrated_customer_learner_portal_search, // eslint-disable-line max-len
        enableLmsConfigurationsScreen: action.payload.data.enable_portal_lms_configurations_screen,
        enableUniversalLink: action.payload.data.enable_universal_link,
        enablePortalLearnerCreditManagementScreen: action.payload.data.enable_portal_learner_credit_management_screen,
        enableApiCredentialGeneration: action.payload.data.enable_generation_of_api_credentials,
        enableDemoData: action.payload.data.enable_demo_data_for_analytics_and_lpr,
        enableAuditDataReporting: action.payload.data.enable_audit_data_reporting,
        enterpriseFeatures: action.payload.enterpriseFeatures,
      };
    case FETCH_PORTAL_CONFIGURATION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        contactEmail: null,
        enterpriseId: null,
        enterpriseName: null,
        enterpriseSlug: null,
        productType: null,
        enterpriseBranding: null,
        identityProvider: null,
        disableExpiryMessagingForLearnerCredit: false,
        enableCodeManagementScreen: false,
        enableReportingConfigScreen: false,
        enableSubscriptionManagementScreen: false,
        enableSamlConfigurationScreen: false,
        enableAnalyticsScreen: false,
        enablePeopleManagementScreen: false,
        enableLearnerPortal: false,
        enableIntegratedCustomerLearnerPortalSearch: false,
        enableLmsConfigurationsScreen: false,
        enableUniversalLink: false,
        enablePortalLearnerCreditManagementScreen: false,
        enableApiCredentialGeneration: false,
        enableDemoData: false,
        enableAuditDataReporting: false,
        enterpriseFeatures: {},
      };
    case CLEAR_PORTAL_CONFIGURATION:
      return {
        ...state,
        contactEmail: null,
        enterpriseId: null,
        enterpriseName: null,
        enterpriseSlug: null,
        productType: null,
        enterpriseBranding: null,
        identityProvider: null,
        disableExpiryMessagingForLearnerCredit: false,
        enableCodeManagementScreen: false,
        enableReportingConfigScreen: false,
        enableSubscriptionManagementScreen: false,
        enableSamlConfigurationScreen: false,
        enableAnalyticsScreen: false,
        enablePeopleManagementScreen: false,
        enableLearnerPortal: false,
        enableIntegratedCustomerLearnerPortalSearch: false,
        enableLmsConfigurationsScreen: false,
        enableUniversalLink: false,
        enablePortalLearnerCreditManagementScreen: false,
        enableApiCredentialGeneration: false,
        enableDemoData: false,
        enableAuditDataReporting: false,
        enterpriseFeatures: {},
      };
    case UPDATE_PORTAL_CONFIGURATION:
      return {
        ...state,
        ...action.payload.data,
      };
    default:
      return state;
  }
};

export default portalConfiguration;
