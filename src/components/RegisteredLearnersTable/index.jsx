import React from 'react';

import TableContainer from '../../containers/TableContainer';

import { formatTimestamp } from '../../utils';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';

const RegisteredLearnersTable = () => {
  const tableColumns = [
    {
      label: 'Email',
      key: 'user_email',
    },
    {
      label: 'Account Created',
      key: 'user_account_creation_timestamp',
    },
  ];

  const formatLearnerData = learners => learners.map(learner => ({
    ...learner,
    user_account_creation_timestamp: formatTimestamp({
      timestamp: learner.user_account_creation_timestamp,
    }),
  }));

  return (
    <TableContainer
      id="unenrolled-registered-learners"
      className="unenrolled-registered-learners"
      fetchMethod={EnterpriseDataApiService.fetchUnerolledRegisteredLearners}
      columns={tableColumns}
      formatData={formatLearnerData}
    />
  );
};

export default RegisteredLearnersTable;
