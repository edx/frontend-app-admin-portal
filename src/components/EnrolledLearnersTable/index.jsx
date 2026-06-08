import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { DataTable } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';
import PropTypes from 'prop-types';

import { i18nFormatTimestamp } from '../../utils';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';

const EnrolledLearnersTable = ({ enterpriseId }) => {
  const intl = useIntl();
  const [isLoading, setIsLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  const fetchData = useCallback(
    async (args) => {
      setIsLoading(true);
      try {
        const primarySort = args.sortBy?.[0];
        const ordering = primarySort ? `${primarySort.desc ? '-' : ''}${primarySort.id}` : null;
        const response = await EnterpriseDataApiService.fetchEnrolledLearners(
          enterpriseId,
          {
            page: args.pageIndex + 1,
            page_size: args.pageSize,
            ...(ordering && { ordering }),
          },
        );
        const { results, count, num_pages: numPages } = response.data;
        const formattedRows = (results || []).map(learner => ({
          ...learner,
          user_email: <span data-hj-suppress>{learner.user_email}</span>,
          lms_user_created: i18nFormatTimestamp({ intl, timestamp: learner.lms_user_created }),
        }));
        setTableData(formattedRows);
        setItemCount(count || 0);
        setPageCount(numPages || 0);
      } catch (error) {
        logError(error);
        setTableData([]);
        setItemCount(0);
        setPageCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [enterpriseId, intl],
  );

  const columns = [
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.table.user_email.column.heading',
        defaultMessage: 'Email',
        description: 'Column heading for the user email column in the enrolled learners table',
      }),
      accessor: 'user_email',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.table.lms_user_created.column.heading',
        defaultMessage: 'Account Created',
        description: 'Column heading for the lms user created column in the enrolled learners table',
      }),
      accessor: 'lms_user_created',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.table.enrollment_count.column.heading',
        defaultMessage: 'Total Course Enrollment Count',
        description: 'Column heading for the course enrollment count column in the enrolled learners table',
      }),
      accessor: 'enrollment_count',
    },
  ];

  return (
    <DataTable
      isLoading={isLoading}
      isPaginated
      manualPagination
      isSortable
      manualSortBy
      initialState={{
        pageSize: 50,
        pageIndex: 0,
      }}
      itemCount={itemCount}
      pageCount={pageCount}
      fetchData={fetchData}
      data={tableData}
      columns={columns}
    >
      <DataTable.TableControlBar />
      <DataTable.Table />
      <DataTable.EmptyTable
        content={intl.formatMessage({
          id: 'admin.portal.lpr.enrolled.learners.table.empty',
          defaultMessage: 'There are no results.',
          description: 'Message displayed when the enrolled learners table is empty',
        })}
      />
      <DataTable.TableFooter />
    </DataTable>
  );
};

EnrolledLearnersTable.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(EnrolledLearnersTable);
