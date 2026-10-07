import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  ActionRow, AlertModal, Button, StatefulButton,
} from '@openedx/paragon';
import { Download } from '@openedx/paragon/icons';
import { logError } from '@edx/frontend-platform/logging';
import { saveAs } from 'file-saver';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import EnterpriseAccessApiService from '../../data/services/EnterpriseAccessApiService';
import { useBudgetId, useSubsidyAccessPolicy } from './data';

export const getSpentCsvFileName = (displayName) => {
  const titleNoWhitespace = (displayName || 'budget').replace(/\s+/g, '');
  const currentDate = new Date();
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth() + 1;
  const day = currentDate.getUTCDate();
  return `${titleNoWhitespace}-spent-${year}-${month}-${day}.csv`;
};

const SpentTransactionsCsvDownloadTableAction = ({
  enterpriseUUID,
  tableInstance,
}) => {
  const intl = useIntl();
  const [downloadState, setDownloadState] = useState('default');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { subsidyAccessPolicyId } = useBudgetId();
  const { data: subsidyAccessPolicy } = useSubsidyAccessPolicy(subsidyAccessPolicyId);

  const csvDownloadOnClick = async () => {
    // Apply the table's search filter so the export matches what the admin is looking at.
    const search = tableInstance.state?.filters?.find(filter => filter.id === 'enrollmentDetails')?.value;
    setDownloadState('pending');
    try {
      const response = await EnterpriseAccessApiService.exportSubsidyTransactions({
        enterpriseCustomerUuid: enterpriseUUID,
        subsidyUuid: subsidyAccessPolicy.subsidyUuid,
        subsidyAccessPolicyUuid: subsidyAccessPolicyId,
        search,
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      saveAs(blob, getSpentCsvFileName(subsidyAccessPolicy.displayName));
      setDownloadState('default');
    } catch (err) {
      logError(err);
      setIsRateLimited(err?.customAttributes?.httpErrorStatus === 429 || err?.response?.status === 429);
      setIsErrorModalOpen(true);
      setDownloadState('default');
    }
  };

  if (!subsidyAccessPolicy?.subsidyUuid) {
    return null;
  }

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
        icons={{ default: <Download />, pending: <Download /> }}
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

SpentTransactionsCsvDownloadTableAction.defaultProps = {
  tableInstance: {
    itemCount: 0,
    state: {},
  },
};

const mapStateToProps = state => ({
  enterpriseUUID: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(SpentTransactionsCsvDownloadTableAction);
