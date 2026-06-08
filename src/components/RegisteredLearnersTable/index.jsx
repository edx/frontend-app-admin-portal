import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { logError } from '@edx/frontend-platform/logging';
import { Alert, DataTable } from '@openedx/paragon';
import { Error } from '@openedx/paragon/icons';

import { useIntl } from '@edx/frontend-platform/i18n';

import { i18nFormatTimestamp } from '../../utils';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';

const defaultPaginationData = {
  itemCount: 0,
  pageCount: 0,
  data: [],
};

const RegisteredLearnersTable = ({ enterpriseId }) => {
  const intl = useIntl();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [ordering, setOrdering] = useState('user_email');
  const [paginationData, setPaginationData] = useState(defaultPaginationData);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    EnterpriseDataApiService.fetchUnenrolledRegisteredLearners(enterpriseId, {
      page: currentPage + 1,
      ordering,
    })
      .then((response) => {
        setPaginationData({
          itemCount: response.data.count,
          pageCount: response.data.num_pages,
          data: response.data.results,
        });
      })
      .catch((err) => {
        logError(err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [enterpriseId, currentPage, ordering]);

  const fetchData = useCallback(({ pageIndex, sortBy = [] }) => {
    if (pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
    }

    const currentSortBy = sortBy.at(-1);
    if (currentSortBy?.id) {
      const nextOrdering = `${currentSortBy.desc ? '-' : ''}${currentSortBy.id}`;
      if (nextOrdering !== ordering) {
        setOrdering(nextOrdering);
      }
    }
  }, [currentPage, ordering]);

  const tableColumns = useMemo(() => ([
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.registered.learners.table.user_email.column.heading',
        defaultMessage: 'Email',
        description: 'Column heading for the user email column in the registered learners table',
      }),
      accessor: 'user_email',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.registered.learners.table.lms_user_created.column.heading',
        defaultMessage: 'Account Created',
        description: 'Column heading for the lms user created column in the registered learners table',
      }),
      accessor: 'lms_user_created',
    },
  ]), [intl]);

  const formattedData = useMemo(() => paginationData.data.map(learner => ({
    ...learner,
    user_email: <span data-hj-suppress>{learner.user_email}</span>,
    lms_user_created: i18nFormatTimestamp({
      intl,
      timestamp: learner.lms_user_created,
    }),
  })), [paginationData.data, intl]);

  if (error) {
    return (
      <Alert variant="danger" icon={Error}>
        <Alert.Heading>Unable to load data</Alert.Heading>
        <p>Try refreshing your screen {error.message}</p>
      </Alert>
    );
  }

  return (
    <DataTable
      className="registered-unenrolled-learners"
      isLoading={isLoading}
      isPaginated
      manualPagination
      isSortable
      manualSortBy
      itemCount={paginationData.itemCount}
      pageCount={paginationData.pageCount}
      fetchData={fetchData}
      data={formattedData}
      columns={tableColumns}
      initialState={{
        pageSize: 50,
        pageIndex: 0,
        sortBy: [{
          id: 'user_email',
          desc: false,
        }],
      }}
    >
      <DataTable.Table />
      {!isLoading && (
        <DataTable.EmptyTable content="There are no results." />
      )}
      <DataTable.TableFooter />
    </DataTable>
  );
};

RegisteredLearnersTable.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(RegisteredLearnersTable);
