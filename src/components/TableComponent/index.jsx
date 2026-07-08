import React from 'react';
import PropTypes from 'prop-types';
import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';

import { Alert, DataTable } from '@openedx/paragon';
import { Error as ErrorIcon } from '@openedx/paragon/icons';

import 'font-awesome/css/font-awesome.css';

import TableLoadingSkeleton from './TableLoadingSkeleton';
import { updateUrl } from '../../utils';
import { withLocation, withNavigate } from '../../hoc';

const DEFAULT_PAGE_SIZE = 50;

class TableComponent extends React.Component {
  componentDidMount() {
    // Get initial data
    this.props.paginateTable();
  }

  componentDidUpdate(prevProps) {
    const { location } = this.props;

    // Handle the case where the query params have changed. This is used when sorting & paging, but
    // also when the back button is used. We need to determine if this is a pagination or sorting
    // request as we handle these as slightly different actions in the action handlers.
    if (location.search !== prevProps.location.search) {
      const prevQueryParams = new URLSearchParams(prevProps.location.search);
      const prevPage = prevQueryParams.get('page');
      const prevOrdering = prevQueryParams.get('ordering');
      const currentQueryParams = new URLSearchParams(location.search);
      const page = currentQueryParams.get('page');
      const ordering = currentQueryParams.get('ordering');
      if (ordering && ordering !== prevOrdering) {
        this.props.sortTable(ordering);
      } else if (page !== prevPage) {
        this.props.paginateTable(parseInt(page, 10));
      }
    }
  }

  componentWillUnmount() {
    this.props.clearTable();
  }

  getSortState(columns) {
    const {
      defaultSortIndex,
      defaultSortType,
      ordering,
      tableSortable,
    } = this.props;

    if (!tableSortable || !columns.length) {
      return [];
    }

    const fallbackColumnKey = columns[defaultSortIndex]?.accessor || columns[0]?.accessor;
    const activeOrdering = ordering || fallbackColumnKey;

    if (!activeOrdering) {
      return [];
    }

    return [{
      id: activeOrdering.replace('-', ''),
      desc: defaultSortType
        ? defaultSortType === 'desc'
        : activeOrdering.startsWith('-'),
    }];
  }

  handleFetchData = ({ pageIndex = 0, sortBy = [] } = {}) => {
    const {
      columns,
      currentPage,
      enterpriseId,
      id,
      location,
      navigate,
      ordering,
      tableSortable,
    } = this.props;

    const latestSort = sortBy[sortBy.length - 1];
    if (tableSortable && latestSort?.id) {
      const nextOrdering = `${latestSort.desc ? '-' : ''}${latestSort.id}`;
      if (nextOrdering !== ordering) {
        const column = columns.find(({ key }) => key === latestSort.id);
        updateUrl(navigate, location.pathname, {
          page: 1,
          ordering: nextOrdering,
        });
        sendEnterpriseTrackEvent(enterpriseId, 'edx.ui.enterprise.admin_portal.table.sorted', {
          tableId: id,
          column: column?.label,
          direction: latestSort.desc ? 'desc' : 'asc',
        });
        return;
      }
    }

    const nextPage = pageIndex + 1;
    if (nextPage !== currentPage) {
      updateUrl(navigate, location.pathname, { page: nextPage });
      sendEnterpriseTrackEvent(enterpriseId, 'edx.ui.enterprise.admin_portal.table.paginated', {
        tableId: id,
        page: nextPage,
      });
    }
  };

  renderTableContent() {
    const {
      className,
      currentPage,
      data,
      formatData,
      id,
      itemCount,
      loading,
      pageCount,
      tableSortable,
    } = this.props;

    const formattedData = formatData(data);
    const columnConfig = this.props.columns.map(column => ({
      Header: column.label,
      accessor: column.key,
      disableSortBy: !column.columnSortable,
    }));

    return (
      <div className={className}>
        <div className="row">
          <div className="col">
            <DataTable
              key={`${id}-${currentPage || 1}-${this.props.ordering || 'default'}`}
              className="table-sm table-striped"
              isLoading={loading}
              isPaginated
              manualPagination
              isSortable={tableSortable}
              manualSortBy={tableSortable}
              itemCount={itemCount}
              pageCount={pageCount || 1}
              fetchData={this.handleFetchData}
              data={formattedData}
              columns={columnConfig}
              initialState={{
                pageSize: DEFAULT_PAGE_SIZE,
                pageIndex: (currentPage || 1) - 1,
                sortBy: this.getSortState(columnConfig),
              }}
            >
              <DataTable.Table />
              <DataTable.TableFooter />
            </DataTable>
          </div>
        </div>
      </div>
    );
  }

  renderLoadingMessage() {
    return <TableLoadingSkeleton />;
  }

  renderErrorMessage() {
    return (
      <Alert variant="danger" icon={ErrorIcon}>
        <Alert.Heading>Unable to load data</Alert.Heading>
        <p>Try refreshing your screen {this.props.error.message}</p>
      </Alert>
    );
  }

  renderEmptyDataMessage() {
    const { customEmptyMessage } = this.props;
    return (
      <Alert variant="warning" icon={ErrorIcon}>
        {!customEmptyMessage ? 'There are no results.' : customEmptyMessage}
      </Alert>
    );
  }

  render() {
    const { data, loading, error } = this.props;

    return (
      <>
        {error && this.renderErrorMessage()}
        {loading && !data && this.renderLoadingMessage()}
        {!loading && !error && data && data.length === 0
          && this.renderEmptyDataMessage()}
        {data && data.length > 0 && this.renderTableContent()}
      </>
    );
  }
}

TableComponent.propTypes = {
  // Props expected from consumer
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  formatData: PropTypes.func.isRequired,
  tableSortable: PropTypes.bool,
  defaultSortIndex: PropTypes.number,
  defaultSortType: PropTypes.string,
  customEmptyMessage: PropTypes.string,

  // Props expected from TableContainer / redux store
  enterpriseId: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})),
  currentPage: PropTypes.number,
  itemCount: PropTypes.number,
  pageCount: PropTypes.number,
  ordering: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(global.Error),
  paginateTable: PropTypes.func.isRequired,
  sortTable: PropTypes.func.isRequired,
  clearTable: PropTypes.func.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
  navigate: PropTypes.func,
};

TableComponent.defaultProps = {
  className: null,
  defaultSortIndex: 0,
  defaultSortType: undefined,
  tableSortable: false,
  data: undefined,
  ordering: undefined,
  currentPage: undefined,
  itemCount: 0,
  pageCount: undefined,
  error: null,
  loading: false,
  customEmptyMessage: null,
};

export default withLocation(withNavigate(TableComponent));
