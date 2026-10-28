import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';
import { Alert, DataTable } from '@openedx/paragon';
import { Error } from '@openedx/paragon/icons';

import {
  i18nFormatTimestamp, formatPercentage,
} from '../../utils';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';

const defaultPaginationData = {
  itemCount: 0,
  pageCount: 1,
  data: [],
};

const LearnerActivityTable = ({
  id, activity, intl, enterpriseId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [ordering, setOrdering] = useState('user_email');
  const [paginationData, setPaginationData] = useState(defaultPaginationData);
  const previousReportRef = useRef({ id, activity });

  useEffect(() => {
    const reportChanged = previousReportRef.current.id !== id
      || previousReportRef.current.activity !== activity;

    if (reportChanged) {
      previousReportRef.current = { id, activity };
      setCurrentPage(0);
      setOrdering('user_email');
      setPaginationData(defaultPaginationData);
      setError(null);
      setIsLoading(true);
      return () => {};
    }

    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    EnterpriseDataApiService.fetchCourseEnrollments(
      enterpriseId,
      {
        learnerActivity: activity,
        page: currentPage + 1,
        ordering,
      },
    )
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
  }, [enterpriseId, id, activity, currentPage, ordering]);

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
        id: 'admin.portal.lpr.learner.activity.table.user_email.column.heading',
        defaultMessage: 'Email',
        description: 'Column heading for the user email column in the learner activity table',
      }),
      accessor: 'user_email',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.course_title.column.heading',
        defaultMessage: 'Course Title',
        description: 'Column heading for the course title column in the learner activity table',
      }),
      accessor: 'course_title',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.course_list_price.column.heading',
        defaultMessage: 'Course Price',
        description: 'Column heading for the course price column in the learner activity table',
      }),
      accessor: 'course_list_price',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.course_start_date.column.heading',
        defaultMessage: 'Start Date',
        description: 'Column heading for the course start date column in the learner activity table',
      }),
      accessor: 'course_start_date',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.course_end_date.column.heading',
        defaultMessage: 'End Date',
        description: 'Column heading for the course end date column in the learner activity table',
      }),
      accessor: 'course_end_date',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.course_progress.column.heading',
        defaultMessage: 'Course Progress',
        description: 'Column heading for the course progress column in the learner activity table',
      }),
      accessor: 'course_progress',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.course_passing_grade.column.heading',
        defaultMessage: 'Course Passing Grade',
        description: 'Column heading for the course passing grade column in the learner activity table',
      }),
      accessor: 'course_passing_grade',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.current_grade.column.heading',
        defaultMessage: 'Current Grade',
        description: 'Column heading for the current grade column in the learner activity table',
      }),
      accessor: 'current_grade',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.enrollment_date.column.heading',
        defaultMessage: 'Last Activity Date',
        description: 'Column heading for the last activity date column in the learner activity table',
      }),
      accessor: 'last_activity_date',
    },
  ]), [intl]);

  const formattedData = useMemo(() => paginationData.data.map(enrollment => ({
    ...enrollment,
    user_email: <span data-hj-suppress>{enrollment.user_email}</span>,
    last_activity_date: i18nFormatTimestamp({ intl, timestamp: enrollment.last_activity_date }),
    course_start_date: i18nFormatTimestamp({ intl, timestamp: enrollment.course_start_date }),
    course_end_date: i18nFormatTimestamp({ intl, timestamp: enrollment.course_end_date }),
    enrollment_date: i18nFormatTimestamp({
      intl, timestamp: enrollment.enrollment_date,
    }),
    user_account_creation_date: i18nFormatTimestamp({
      intl, timestamp: enrollment.user_account_creation_date,
    }),
    course_list_price: enrollment.course_list_price ? `$${enrollment.course_list_price}` : '',
    current_grade: formatPercentage({ decimal: enrollment.current_grade }),
    course_progress: formatPercentage({ decimal: enrollment.course_progress }),
    course_passing_grade: formatPercentage({ decimal: enrollment.course_passing_grade }),
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
      key={`${enterpriseId}-${id}-${activity}`}
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

LearnerActivityTable.propTypes = {
  id: PropTypes.string.isRequired,
  activity: PropTypes.string.isRequired,
  enterpriseId: PropTypes.string.isRequired,
  // injected
  intl: intlShape.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(injectIntl(LearnerActivityTable));
