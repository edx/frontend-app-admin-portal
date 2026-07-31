import { logError } from '@edx/frontend-platform/logging';
import { getConfig } from '@edx/frontend-platform/config';
import { saveAs } from 'file-saver/FileSaver';

import {
  FETCH_CSV_REQUEST,
  FETCH_CSV_SUCCESS,
  FETCH_CSV_FAILURE,
  CLEAR_CSV,
} from '../constants/csv';
import store from '../store';
import { removeCsvColumn, isEnterpriseCustomerInUuidAllowlist } from '../../utils';

// Hides the course_progress column for the enterprise customer configured via
// DISABLE_COURSE_PROGRESS_COLUMN_FOR_ENTERPRISE_CUSTOMER, scoped to report types known to include it.
const COURSE_PROGRESS_CSV_HEADER = 'course_progress';
const CSV_IDS_WITH_COURSE_PROGRESS_COLUMN = [
  'enrollments',
  'learners-active-week',
  'learners-inactive-week',
  'learners-inactive-month',
  'completed-learners-week',
];

const fetchCsvRequest = csvId => ({
  type: FETCH_CSV_REQUEST,
  payload: { csvId },
});
const fetchCsvSuccess = csvId => ({
  type: FETCH_CSV_SUCCESS,
  payload: { csvId },
});
const fetchCsvFailure = (csvId, error) => ({
  type: FETCH_CSV_FAILURE,
  payload: {
    csvId,
    error,
  },
});

const fetchCsv = (csvId, fetchMethod) => (
  (dispatch) => {
    const { enterpriseId } = store.getState().portalConfiguration;
    dispatch(fetchCsvRequest(csvId));
    return fetchMethod(enterpriseId)
      .then((response) => {
        let csvData = response.data;
        const disabledFor = getConfig().DISABLE_COURSE_PROGRESS_COLUMN_FOR_ENTERPRISE_CUSTOMER;
        if (
          CSV_IDS_WITH_COURSE_PROGRESS_COLUMN.includes(csvId)
          && isEnterpriseCustomerInUuidAllowlist(enterpriseId, disabledFor)
        ) {
          csvData = removeCsvColumn(csvData, COURSE_PROGRESS_CSV_HEADER);
        }
        // Create blob with explicit MIME type
        const blob = new Blob([csvData], {
          type: 'text/csv;charset=utf-8;',
        });
        saveAs(blob, `${enterpriseId}_progress_report.csv`);
        dispatch(fetchCsvSuccess(csvId));
      })
      .catch((error) => {
        logError(error);
        dispatch(fetchCsvFailure(csvId, error));
      });
  }
);

const clearCsv = csvId => dispatch => (dispatch({
  type: CLEAR_CSV,
  payload: {
    csvId,
  },
}));

export {
  fetchCsv,
  clearCsv,
};
