import { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Stack } from '@openedx/paragon';
import { Info } from '@openedx/paragon/icons';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

import { connect } from 'react-redux';
import useBnrSubsidyRequests from './data/hooks/useBnrSubsidyRequests';
import EnterpriseAccessApiService from '../../data/services/EnterpriseAccessApiService';

import RequestsTable from './requests-tab/RequestsTable';
import DeclineBnrSubsidyRequestModal from './requests-tab/DeclineBnrSubsidyRequestModal';
import ApproveBnrSubsidyRequestModal from './requests-tab/ApproveBnrSubsidyRequestModal';
import { BNR_REQUEST_PAGE_SIZE, useBudgetId, useSubsidyAccessPolicy } from './data';

const BudgetDetailRequestsTabContent = ({ enterpriseId }) => {
  const {
    isLoading,
    bnrRequests,
    fetchBnrRequests,
    refreshRequests,
  } = useBnrSubsidyRequests({ enterpriseId });

  const { subsidyAccessPolicyId } = useBudgetId();
  const { data: subsidyAccessPolicy } = useSubsidyAccessPolicy(subsidyAccessPolicyId);
  const isRetiredOrExpired = subsidyAccessPolicy?.isRetiredOrExpired;
  const [selectedRequest, setSelectedRequest] = useState();
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  return (
    <Stack gap={2}>
      <div>
        <h3>Requests</h3>
        <p className="small">Approve or decline requests for learners.</p>
      </div>
      {isRetiredOrExpired && (
        <Alert variant="info" icon={Info}>
          <FormattedMessage
            id="lcm.budget.detail.page.requests.tab.budget.ended.alert"
            defaultMessage="This budget has ended, so requests can no longer be approved. You can still decline pending requests."
            description="Notice shown above the requests table when the budget is retired or expired"
          />
        </Alert>
      )}
      <RequestsTable
        pageCount={bnrRequests.pageCount}
        itemCount={bnrRequests.itemCount}
        data={bnrRequests.results}
        fetchData={fetchBnrRequests}
        tableData={{
          requestStatusCounts: bnrRequests.learnerRequestStateCounts || [],
        }}
        onApprove={(row) => {
          setSelectedRequest(row);
          setIsApproveModalOpen(true);
        }}
        onDecline={(row) => {
          setSelectedRequest(row);
          setIsDeclineModalOpen(true);
        }}
        onRefresh={refreshRequests}
        disableApproveButton={isRetiredOrExpired}
        isLoading={isLoading}
        initialTableOptions={{
          getRowId: row => row.uuid,
        }}
        initialState={{
          pageSize: BNR_REQUEST_PAGE_SIZE,
          pageIndex: 0,
        }}
      />
      {selectedRequest && (
        <>
          {isApproveModalOpen && (
            <ApproveBnrSubsidyRequestModal
              isOpen
              subsidyRequest={selectedRequest}
              enterpriseId={enterpriseId}
              subsidyAccessPolicyId={subsidyAccessPolicyId}
              approveRequestFn={EnterpriseAccessApiService.approveBnrSubsidyRequest}
              onSuccess={() => {
                refreshRequests();
                setIsApproveModalOpen(false);
              }}
              onClose={() => setIsApproveModalOpen(false)}
            />
          )}
          {isDeclineModalOpen && (
            <DeclineBnrSubsidyRequestModal
              isOpen
              subsidyRequest={selectedRequest}
              enterpriseId={enterpriseId}
              declineRequestFn={EnterpriseAccessApiService.declineBnrSubsidyRequest}
              onSuccess={() => {
                refreshRequests();
                setIsDeclineModalOpen(false);
              }}
              onClose={() => setIsDeclineModalOpen(false)}
            />
          )}
        </>
      )}
    </Stack>
  );
};

BudgetDetailRequestsTabContent.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(BudgetDetailRequestsTabContent);
