import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ActionRow, AlertModal, Button, Spinner, StatefulButton,
} from '@openedx/paragon';
import { Download } from '@openedx/paragon/icons';
import { logError } from '@edx/frontend-platform/logging';
import { saveAs } from 'file-saver';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';
import EnterpriseAccessApiService from '../../data/services/EnterpriseAccessApiService';
import EVENT_NAMES from '../../eventTracking';
import { getBudgetCsvFileName, getSpentTableSearchQuery } from './data';

const SpentTransactionsCsvDownloadTableAction = ({
  enterpriseUUID,
  subsidyAccessPolicy,
  tableInstance = { itemCount: 0, state: {} },
}) => {
  const intl = useIntl();
  const [downloadState, setDownloadState] = useState('default');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const csvDownloadOnClick = async () => {
    // Apply the table's search filter so the export matches what the admin is looking at.
    const search = getSpentTableSearchQuery(tableInstance.state?.filters);
    // Only track whether a search was applied; the search text may contain learner emails.
    const trackDownload = (properties) => sendEnterpriseTrackEvent(
      enterpriseUUID,
      EVENT_NAMES.LEARNER_CREDIT_MANAGEMENT.BUDGET_DETAILS_SPENT_DATATABLE_CSV_DOWNLOAD,
      {
        subsidyAccessPolicyId: subsidyAccessPolicy.uuid,
        isSearchApplied: !!search,
        ...properties,
      },
    );
    setDownloadState('pending');
    try {
      const response = await EnterpriseAccessApiService.exportSubsidyTransactions({
        enterpriseCustomerUuid: enterpriseUUID,
        subsidyUuid: subsidyAccessPolicy.subsidyUuid,
        subsidyAccessPolicyUuid: subsidyAccessPolicy.uuid,
        search,
      });
      // response.data is already a Blob because the request uses responseType: 'blob'.
      saveAs(response.data, getBudgetCsvFileName(subsidyAccessPolicy.displayName, 'spent'));
      trackDownload({ status: 'success' });
      setDownloadState('default');
    } catch (err) {
      logError(err);
      const httpErrorStatus = err?.customAttributes?.httpErrorStatus;
      trackDownload({ status: 'error', httpErrorStatus });
      setIsRateLimited(httpErrorStatus === 429);
      setIsErrorModalOpen(true);
      setDownloadState('default');
    }
  };

  return (
    <>
      <AlertModal
        title={intl.formatMessage({
          id: 'lcm.budget.detail.page.spent.table.download.error.title',
          defaultMessage: 'Something went wrong',
          description: 'Title of the error modal shown when downloading the spent transactions CSV fails',
        })}
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        footerNode={(
          <ActionRow>
            <Button variant="tertiary" onClick={() => setIsErrorModalOpen(false)}>
              <FormattedMessage
                id="lcm.budget.detail.page.spent.table.download.error.close"
                defaultMessage="Close"
                description="Close button text in the spent transactions CSV download error modal"
              />
            </Button>
          </ActionRow>
        )}
        isOverflowVisible={false}
      >
        <p>
          {isRateLimited ? (
            <FormattedMessage
              id="lcm.budget.detail.page.spent.table.download.error.rate.limited"
              defaultMessage="You've reached the limit for spend report downloads. Please try again later."
              description="Error message when the spent transactions CSV download is rate limited"
            />
          ) : (
            <FormattedMessage
              id="lcm.budget.detail.page.spent.table.download.error.message"
              defaultMessage="We're sorry but something went wrong while downloading your CSV. Please try again later."
              description="Error message when downloading the spent transactions CSV fails"
            />
          )}
        </p>
      </AlertModal>
      <StatefulButton
        state={downloadState}
        onClick={csvDownloadOnClick}
        variant="inverse-primary"
        className="border rounded-0 border-dark-500"
        disabled={tableInstance.itemCount === 0}
        disabledStates={['pending']}
        icons={{
          default: <Download />,
          pending: <Spinner animation="border" variant="primary" size="sm" />,
        }}
        labels={{
          default: intl.formatMessage({
            id: 'lcm.budget.detail.page.spent.table.download',
            defaultMessage: 'Download',
            description: 'Button text to download the spent transactions of a budget as a CSV',
          }),
          pending: intl.formatMessage({
            id: 'lcm.budget.detail.page.spent.table.download.pending',
            defaultMessage: 'Downloading',
            description: 'Button text while the spent transactions CSV is downloading',
          }),
        }}
      />
    </>
  );
};

SpentTransactionsCsvDownloadTableAction.propTypes = {
  enterpriseUUID: PropTypes.string.isRequired,
  subsidyAccessPolicy: PropTypes.shape({
    uuid: PropTypes.string.isRequired,
    subsidyUuid: PropTypes.string.isRequired,
    displayName: PropTypes.string,
  }).isRequired,
  tableInstance: PropTypes.shape({
    itemCount: PropTypes.number,
    state: PropTypes.shape({
      filters: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        value: PropTypes.string,
      })),
    }),
  }),
};

export default SpentTransactionsCsvDownloadTableAction;
