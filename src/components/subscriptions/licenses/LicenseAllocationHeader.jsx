import React, { useContext } from 'react';
import SearchBar from '../../SearchBar';
import { ToastsContext } from '../../Toasts';
import AddUsersButton from '../buttons/AddUsersButton';
import { TAB_PENDING_USERS } from '../data/constants';
import { SubscriptionContext } from '../SubscriptionData';
import { SubscriptionDetailContext } from '../SubscriptionDetailContextProvider';

const LicenseAllocationHeader = () => {
  const { forceRefresh } = useContext(SubscriptionContext);
  const { setActiveTab, setSearchQuery, subscription } = useContext(SubscriptionDetailContext);
  const { addToast } = useContext(ToastsContext);

  return (
    <>
      <h2 className="mb-2">License Allocation</h2>
      <p className="lead">
        {subscription.licenses.allocated}
        {' of '}
        {subscription.licenses.total} licenses allocated
      </p>
      <div className="my-3 row">
        <div className="col-12 col-md-5 mb-3 mb-md-0">
          <SearchBar
            placeholder="Search by email..."
            onSearch={searchQuery => setSearchQuery({ searchQuery })}
            onClear={() => setSearchQuery({})}
          />
        </div>
        <div className="col-12 col-md-7">
          <AddUsersButton
            onSuccess={({ numAlreadyAssociated, numSuccessfulAssignments }) => {
              forceRefresh();
              addToast(`${numAlreadyAssociated} email addresses were previously assigned. ${numSuccessfulAssignments} email addresses were successfully added.`);
              setActiveTab(TAB_PENDING_USERS);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default LicenseAllocationHeader;
