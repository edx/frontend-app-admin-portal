import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';
import { Alert, DataTable } from '@openedx/paragon';
import { Error } from '@openedx/paragon/icons';

import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';
import { i18nFormatTimestamp } from '../../utils';

const defaultPaginationData = {
  itemCount: 0,
  pageCount: 1,
  data: [],
};

const PastWeekPassedLearnersTable = ({ enterpriseId }) => {
  const intl = useIntl();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [ordering, setOrdering] = useState('user_email');
  const [paginationData, setPaginationData] = useState(defaultPaginationData);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    EnterpriseDataApiService.fetchCourseEnrollments(enterpriseId, {
      passedDate: 'last_week',
      page: currentPage + 1,
      ordering,
    })
      .then((response) => {
        if (!isCurrent) {
          return;
        }

        setPaginationData({
          itemCount: response.data.count,
          pageCount: response.data.num_pages || 1,
          data: response.data.results,
        });
      })
      .catch((err) => {
        if (!isCurrent) {
          return;
        }

        logError(err);
        setError(err);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
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
        id: 'admin.portal.lpr.past.week.passed.learners.table.user_email.column.heading',
        defaultMessage: 'Email',
        description: 'Column heading for the user email column in the past week passed learners table',
      }),
      accessor: 'user_email',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.past.week.passed.learners.table.course_title.column.heading',
        defaultMessage: 'Course Title',
        description: 'Column heading for the course title column in the past week passed learners table',
      }),
      accessor: 'course_title',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.past.week.passed.learners.table.passed_date.column.heading',
        defaultMessage: 'Passed Date',
        description: 'Column heading for the passed date column in the past week passed learners table',
      }),
      accessor: 'passed_date',
    },
  ]), [intl]);

  const formattedData = useMemo(() => paginationData.data.map(learner => ({
    ...learner,
    user_email: <span data-hj-suppress>{learner.user_email}</span>,
    passed_date: i18nFormatTimestamp({ intl, timestamp: learner.passed_date }),
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
      className="completed-learners-week"
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

PastWeekPassedLearnersTable.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(PastWeekPassedLearnersTable);
