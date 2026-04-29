import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

import dashboardAnalytics from './dashboardAnalytics';
import portalConfiguration from './portalConfiguration';
import table from './table';
import csv from './csv';
import sidebar from './sidebar';
import licenseRevoke from './licenseRevoke';
import emailTemplate from './emailTemplate';
import licenseRemind from './licenseRemind';
import userSubscription from './userSubscription';
import dashboardInsights from './dashboardInsights';
import enterpriseBudgets from './enterpriseBudgets';
import enterpriseGroups from './enterpriseGroups';
import enterpriseCustomerAdmin from './enterpriseCustomerAdmin';

const identityReducer = (state) => {
  const newState = { ...state };
  return newState;
};

const rootReducer = combineReducers({
  // The authentication state is added as initialState when
  // creating the store in data/store.js.
  authentication: identityReducer,
  form: formReducer,
  dashboardAnalytics,
  portalConfiguration,
  table,
  csv,
  sidebar,
  licenseRevoke,
  emailTemplate,
  licenseRemind,
  userSubscription,
  dashboardInsights,
  enterpriseBudgets,
  enterpriseCustomerAdmin,
  enterpriseGroups,
});

export default rootReducer;
