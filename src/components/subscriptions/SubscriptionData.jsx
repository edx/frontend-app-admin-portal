import React, { createContext, useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import {
  fetchSubscriptionDetails,
  fetchSubscriptionUsersOverview,
  fetchSubscriptionUsers,
} from './data/service';

import {
  TAB_ALL_USERS,
  TAB_LICENSED_USERS,
  TAB_PENDING_USERS,
  TAB_DEACTIVATED_USERS,
} from './constants';

export const SubscriptionContext = createContext();
export const SubscriptionConsumer = SubscriptionContext.Consumer;

export default function SubscriptionData({ children }) {
  const [activeTab, setActiveTab] = useState(TAB_ALL_USERS);
  const [details, setDetails] = useState();
  const [overview, setOverview] = useState();
  const [users, setUsers] = useState();
  const [searchQuery, setSearchQuery] = useState();

  useEffect(
    () => {
      Promise.all([
        fetchSubscriptionDetails(),
        fetchSubscriptionUsersOverview(),
        fetchSubscriptionUsers(),
      ])
        .then((responses) => {
          setDetails(responses[0]);
          setOverview(responses[1]);
          setUsers(responses[2]);
        })
        // eslint-disable-next-line no-console
        .catch(error => console.log(error));
    },
    [],
  );

  const value = useMemo(
    () => ({
      details,
      overview,
      users,
      searchQuery,
      activeTab,
      setActiveTab,
      fetchSubscriptionUsers: (options = {}) => {
        const licenseStatusByTab = {
          [TAB_LICENSED_USERS]: 'active',
          [TAB_PENDING_USERS]: 'assigned',
          [TAB_DEACTIVATED_USERS]: 'deactivated',
        };

        setSearchQuery(options.searchQuery);

        Promise.all([
          fetchSubscriptionUsersOverview(options),
          fetchSubscriptionUsers({
            statusFilter: licenseStatusByTab[activeTab],
            ...options,
          }),
        ])
          .then((responses) => {
            setOverview(responses[0]);
            setUsers(responses[1]);
          })
          // eslint-disable-next-line no-console
          .catch(error => console.log(error));
      },
    }),
    [details, users, activeTab, setActiveTab],
  );

  const hasInitialData = useMemo(
    () => !!(details && overview && users),
    [details, overview, users],
  );

  if (hasInitialData) {
    return (
      <SubscriptionContext.Provider value={value}>
        {children}
      </SubscriptionContext.Provider>
    );
  }

  return null;
}

SubscriptionData.propTypes = {
  children: PropTypes.node.isRequired,
};
