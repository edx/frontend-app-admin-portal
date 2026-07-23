import React,
{ useState, useCallback, useEffect } from 'react';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import PropTypes from 'prop-types';
import {
  DataTable, Icon, StatefulButton, Spinner, Toast, useToggle,
} from '@openedx/paragon';
import { Download, Check } from '@openedx/paragon/icons';
import { saveAs } from 'file-saver';
import { logError } from '@edx/frontend-platform/logging';
import { analyticsDataTableKeys, COURSE_TYPES, ALL_COURSES } from '../data/constants';

import { useEnterpriseAnalyticsData, usePaginatedData } from '../data/hooks';
import EnterpriseDataApiService from '../../../data/services/EnterpriseDataApiService';
import { createUtf8CsvBlob } from '../../../utils';

const AnalyticsTable = ({
  name,
  tableColumns,
  tableTitle,
  tableSubtitle,
  csvButtonText,
  entityId,
  startDate,
  endDate,
  enterpriseId,
  groupUUID,
  budgetUUID,
  courseType,
  course,
  trackCsvDownloadClick,
}) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(0);
  const [csvButtonState, setCsvButtonState] = useState('default');
  const [isToastShowing, showToast, hideToast] = useToggle(false);
  const pageSize = 10;

  const {
    isFetching, data,
  } = useEnterpriseAnalyticsData({
    enterpriseCustomerUUID: enterpriseId,
    key: analyticsDataTableKeys[name],
    startDate,
    endDate,
    groupUUID,
    budgetUUID,
    // pages index from 1 in backend, frontend components index from 0
    currentPage: currentPage + 1,
    pageSize,
    courseType,
    course,
  });

  // Once the underlying filters change and the table reloads new data, the CSV
  // button's previous "CSV Downloaded" / "Error" state no longer describes what's
  // on screen -- reset it so the admin isn't misled into thinking the new range
  // was already exported.
  useEffect(() => {
    setCsvButtonState('default');
  }, [startDate, endDate, groupUUID, budgetUUID, courseType, course]);

  const csvDownloadOptions = {
    start_date: startDate,
    end_date: endDate,
  };

  if (courseType && courseType !== COURSE_TYPES.ALL_COURSE_TYPES) {
    csvDownloadOptions.course_type = courseType;
  }

  if (course?.value && course?.value !== ALL_COURSES.value) {
    csvDownloadOptions.course_key = course.value;
  }

  if (budgetUUID) {
    csvDownloadOptions.budget_uuid = budgetUUID;
  }

  if (groupUUID) {
    csvDownloadOptions.group_uuid = groupUUID;
  }

  const downloadCSV = async () => {
    hideToast();
    setCsvButtonState('pending');
    trackCsvDownloadClick?.(entityId);
    try {
      const response = await EnterpriseDataApiService.fetchAnalyticsCSV(
        analyticsDataTableKeys[name],
        enterpriseId,
        csvDownloadOptions,
      );
      const blob = createUtf8CsvBlob(response.data);
      saveAs(blob, `${name}.csv`);
      showToast();
      setCsvButtonState('complete');
    } catch (error) {
      logError(error);
      setCsvButtonState('error');
    }
  };

  const fetchData = useCallback(
    (args) => {
      if (args.pageIndex !== currentPage) {
        setCurrentPage(args.pageIndex);
      }
    },
    [currentPage],
  );

  const paginatedData = usePaginatedData(data);

  const defaultCsvButtonLabel = csvButtonText || (
    <FormattedMessage
      id="adminPortal.analytics.downloadCSV.button"
      defaultMessage="Download {respectiveTableName} CSV"
      description="Button to download CSV for respective table"
      values={{ respectiveTableName: name.charAt(0).toUpperCase() + name.slice(1) }}
    />
  );

  return (
    <div className="analytics-data-table mt-4">
      <div className="analytics-datatable-container">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h2 className="analytics-header-title mb-0">{tableTitle}</h2>
          {isToastShowing && (
            <Toast onClose={hideToast} show={isToastShowing}>
              {intl.formatMessage({
                id: 'adminPortal.analytics.downloadCSV.toast',
                defaultMessage: 'CSV Downloaded',
                description: 'Toast message shown after an analytics table CSV finishes downloading.',
              })}
            </Toast>
          )}
          <StatefulButton
            className="rounded-0"
            variant={csvButtonState === 'error' ? 'danger' : 'primary'}
            size="sm"
            state={!data?.results?.length ? 'disabled' : csvButtonState}
            disabledStates={['disabled', 'pending']}
            labels={{
              default: defaultCsvButtonLabel,
              disabled: defaultCsvButtonLabel,
              pending: intl.formatMessage({
                id: 'adminPortal.analytics.downloadCSV.button.pending',
                defaultMessage: 'Downloading CSV',
                description: 'Label for the analytics table download button while the CSV is downloading.',
              }),
              complete: intl.formatMessage({
                id: 'adminPortal.analytics.downloadCSV.button.complete',
                defaultMessage: 'CSV Downloaded',
                description: 'Label for the analytics table download button once the CSV has downloaded.',
              }),
              error: intl.formatMessage({
                id: 'adminPortal.analytics.downloadCSV.button.error',
                defaultMessage: 'Error',
                description: 'Label for the analytics table download button when the CSV download fails.',
              }),
            }}
            icons={{
              default: <Icon src={Download} className="me-2" />,
              disabled: <Icon src={Download} className="me-2" />,
              pending: <Spinner animation="border" variant="light" size="sm" className="me-2" />,
              complete: <Icon src={Check} className="me-2" />,
            }}
            onClick={downloadCSV}
          />
        </div>

        {tableSubtitle && (
        <p className="analytics-header-subtitle mb-3">{tableSubtitle}</p>
        )}

        <DataTable
          isLoading={isFetching}
          isPaginated
          manualPagination
          initialState={{
            pageSize,
            pageIndex: 0,
          }}
          itemCount={paginatedData.itemCount}
          pageCount={paginatedData.pageCount}
          fetchData={fetchData}
          data={paginatedData.data}
          columns={tableColumns}
        >
          <DataTable.TableControlBar />
          <DataTable.Table />
          <DataTable.EmptyTable
            content={intl.formatMessage({
              id: 'advance.analytics.table.empty.label',
              defaultMessage: 'No results found.',
              description: 'Message displayed when the table has no data.',
            })}
          />
          <DataTable.TableFooter />
        </DataTable>
      </div>
    </div>
  );
};

AnalyticsTable.defaultProps = {
  groupUUID: undefined,
  courseType: undefined,
  course: undefined,
  csvButtonText: undefined,
};

AnalyticsTable.propTypes = {
  name: PropTypes.string.isRequired,
  tableColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  tableTitle: PropTypes.string.isRequired,
  tableSubtitle: PropTypes.string.isRequired,
  csvButtonText: PropTypes.node,
  entityId: PropTypes.string.isRequired,
  enterpriseId: PropTypes.string.isRequired,
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  groupUUID: PropTypes.string,
  budgetUUID: PropTypes.string,
  courseType: PropTypes.string,
  course: PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }),
  trackCsvDownloadClick: PropTypes.func,
};

export default AnalyticsTable;
