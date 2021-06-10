import React, {
  useContext, useState, useMemo, useCallback, useEffect, useRef,
} from 'react';
import PropTypes from 'prop-types';
import {
  Alert, DataTable, TextFilter,
} from '@edx/paragon';
import { camelCaseObject } from '@edx/frontend-platform/utils';
import { logError } from '@edx/frontend-platform/logging';

import { Link } from 'react-router-dom';
import { BulkEnrollContext } from '../BulkEnrollmentContext';
import { ADD_LEARNERS_TITLE } from './constants';
import { convertToSelectedRowsObject } from '../helpers';
import TableLoadingSkeleton from '../../TableComponent/TableLoadingSkeleton';
import { BaseSelectWithContext, BaseSelectWithContextHeader } from '../table/BulkEnrollSelect';
import BaseSelectionStatus from '../table/BaseSelectionStatus';
import { ROUTE_NAMES } from '../../EnterpriseApp/constants';
import LicenseManagerApiService from '../../../data/services/LicenseManagerAPIService';

export const TABLE_HEADERS = {
  email: 'Email',
};

export const LINK_TEXT = 'Subscription management';

const AddLearnersSelectionStatus = (props) => {
  const { emails: [selectedEmails, dispatch] } = useContext(BulkEnrollContext);

  return <BaseSelectionStatus selectedRows={selectedEmails} dispatch={dispatch} {...props} />;
};

const SelectWithContext = (props) => <BaseSelectWithContext contextKey="emails" {...props} />;

const SelectWithContextHeader = (props) => <BaseSelectWithContextHeader contextKey="emails" {...props} />;

const selectColumn = {
  id: 'selection',
  Header: SelectWithContextHeader,
  Cell: SelectWithContext,
  disableSortBy: true,
};

const tableColumns = [
  selectColumn,
  {
    Header: TABLE_HEADERS.email,
    accessor: 'userEmail',
    Filter: TextFilter,
  },
];

const INITIAL_PAGE_INDEX = 0;
export const LEARNERS_PAGE_SIZE = 25;

const useIsMounted = () => {
  const componentIsMounted = useRef(true);
  useEffect(() => () => { componentIsMounted.current = false; }, []);
  return componentIsMounted;
};

const AddLearnersStep = ({
  subscriptionUUID,
  enterpriseSlug,
}) => {
  const [errors, setErrors] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ results: [], count: 0, numPages: 1 });
  const { emails: [selectedEmails] } = useContext(BulkEnrollContext);
  const { results, count, numPages } = data;
  const isMounted = useIsMounted();

  const fetchData = useCallback((tableInstance = {}) => {
    const pageIndex = tableInstance.pageIndex || INITIAL_PAGE_INDEX;
    let options = { active_only: 1, page_size: LEARNERS_PAGE_SIZE, page: pageIndex + 1 };

    const { filters } = tableInstance;
    const emailFilter = filters.find(item => item.id === 'userEmail');
    if (emailFilter) {
      options = { ...options, search: emailFilter.value };
    }
    LicenseManagerApiService.fetchSubscriptionUsers(
      subscriptionUUID,
      options,
    ).then((response) => {
      if (isMounted.current) {
        setData(camelCaseObject(response.data));
        setErrors('');
      }
    }).catch((err) => {
      logError(err);
      if (isMounted.current) {
        setErrors(err.message);
      }
    }).finally(() => {
      if (isMounted.current) {
        setLoading(false);
      }
    });
  }, [subscriptionUUID, enterpriseSlug]);

  const selectedRowIds = useMemo(() => convertToSelectedRowsObject(selectedEmails), [selectedEmails]);

  const initialState = useMemo(() => ({
    pageSize: LEARNERS_PAGE_SIZE,
    pageIndex: 0,
    selectedRowIds,
  }), []);

  const initialTableOptions = useMemo(() => ({
    getRowId: (row, relativeIndex, parent) => row?.uuid || (parent ? [parent.id, relativeIndex].join('.') : relativeIndex),
  }), []);

  return (
    <>
      <p>
        Select learners to enroll from the list of all learners with an active or pending subscription license below.
        If you wish to enroll additional learners not shown, please first invite them under{' '}
        <Link to={`/${enterpriseSlug}/admin/${ROUTE_NAMES.subscriptionManagement}/${subscriptionUUID}`}>{LINK_TEXT}</Link>
      </p>
      <h2>{ADD_LEARNERS_TITLE}</h2>
      {errors && <Alert variant="danger">There was an error retrieving email data. Please try again later.</Alert>}
      <DataTable
        isFilterable
        manualFilters
        columns={tableColumns}
        data={results}
        itemCount={count}
        isPaginated
        pageCount={numPages}
        manualPagination
        fetchData={fetchData}
        SelectionStatusComponent={AddLearnersSelectionStatus}
        initialState={initialState}
        initialTableOptions={initialTableOptions}
        selectedFlatRows={selectedEmails}
      >
        {loading && <TableLoadingSkeleton data-testid="skelly" />}
        {!loading
          && (
          <>
            <DataTable.TableControlBar />
            <DataTable.Table />
            <DataTable.TableFooter />
          </>
          )}
      </DataTable>
    </>
  );
};

AddLearnersStep.propTypes = {
  subscriptionUUID: PropTypes.string.isRequired,
  enterpriseSlug: PropTypes.string.isRequired,
};

export default AddLearnersStep;
