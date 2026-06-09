import React from 'react';
import PropTypes from 'prop-types';
import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';

import { Alert, DataTable } from '@openedx/paragon';
import { Error as ErrorIcon } from '@openedx/paragon/icons';

import 'font-awesome/css/font-awesome.css';

import TableLoadingSkeleton from './TableLoadingSkeleton';
import TableLoadingOverlay from '../TableLoadingOverlay';
import { updateUrl } from '../../utils';
import { withLocation, withNavigate } from '../../hoc';

class TableComponent extends React.Component {
  componentDidMount() {
    // Get initial data for legacy table container consumers.
    this.props.paginateTable(1);
  }

  componentWillUnmount() {
    this.props.clearTable();
  }

  fetchData = ({ pageIndex = 0, sortBy = [] } = {}) => {
    const {
      defaultSortIndex,
      defaultSortType,
      enterpriseId,
      id,
      columns,
      location,
      navigate,
      ordering,
      paginateTable,
      sortTable,
      tableSortable,
    } = this.props;

    const currentPage = pageIndex + 1;
    const sortConfig = sortBy[sortBy.length - 1];

    let nextOrdering = ordering;
    if (tableSortable && sortConfig?.id) {
      nextOrdering = `${sortConfig.desc ? '-' : ''}${sortConfig.id}`;
    } else if (tableSortable && !ordering && defaultSortIndex !== undefined) {
      const defaultColumnKey = columns[defaultSortIndex]?.key;
      if (defaultColumnKey && defaultSortType) {
        nextOrdering = defaultSortType === 'desc' ? `-${defaultColumnKey}` : defaultColumnKey;
      }
    }

    if (tableSortable && nextOrdering !== ordering && nextOrdering) {
      updateUrl(navigate, location.pathname, {
        page: 1,
        ordering: nextOrdering,
      });
      sortTable(nextOrdering);

      const sortDirection = nextOrdering.startsWith('-') ? 'desc' : 'asc';
      const sortColumnKey = nextOrdering.replace('-', '');
      const column = columns.find(col => col.key === sortColumnKey);
      sendEnterpriseTrackEvent(enterpriseId, 'edx.ui.enterprise.admin_portal.table.sorted', {
        tableId: id,
        column: column?.label,
        direction: sortDirection,
      });
      return;
    }

    updateUrl(navigate, location.pathname, {
      page: currentPage,
      ordering: nextOrdering || undefined,
    });
    paginateTable(currentPage);
    sendEnterpriseTrackEvent(enterpriseId, 'edx.ui.enterprise.admin_portal.table.paginated', {
      tableId: id,
      page: currentPage,
    });
  };

  renderTableContent() {
    const {
      className,
      currentPage,
      data,
      defaultSortIndex,
      defaultSortType,
      formatData,
      loading,
      ordering,
      itemCount,
      pageCount,
      tableSortable,
      customEmptyMessage,
    } = this.props;

    const initialSortBy = tableSortable
      ? [{
        id: (ordering && ordering.replace('-', '')) || this.props.columns[defaultSortIndex].key,
        desc: ordering ? ordering.startsWith('-') : defaultSortType === 'desc',
      }]
      : [];

    const columnConfig = this.props.columns.map(column => ({
      Header: column.label,
      accessor: column.key,
      disableSortBy: !column.columnSortable,
    }));

    const emptyStateContent = customEmptyMessage || 'There are no results.';

    return (
      <div className={className}>
        {loading && <TableLoadingOverlay />}
        <DataTable
          isLoading={loading}
          isPaginated
          manualPagination
          isSortable={tableSortable}
          manualSortBy={tableSortable}
          initialState={{
            pageSize: 50,
            pageIndex: Math.max((currentPage || 1) - 1, 0),
            sortBy: initialSortBy,
          }}
          data={formatData(data || [])}
          itemCount={itemCount || 0}
          pageCount={pageCount || 1}
          fetchData={this.fetchData}
          columns={columnConfig}
        >
          <DataTable.TableControlBar />
          <DataTable.Table />
          <DataTable.EmptyTable content={emptyStateContent} />
          <DataTable.TableFooter />
        </DataTable>
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

  render() {
    const { data, loading, error } = this.props;

    return (
      <>
        {error && this.renderErrorMessage()}
        {loading && !data && this.renderLoadingMessage()}
        {!error && data && this.renderTableContent()}
      </>
    );
  }
}

TableComponent.propTypes = {
  // Props expected from consumer
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    columnSortable: PropTypes.bool,
  })).isRequired,
  formatData: PropTypes.func.isRequired,
  tableSortable: PropTypes.bool,
  defaultSortIndex: PropTypes.number,
  defaultSortType: PropTypes.string,
  customEmptyMessage: PropTypes.string,

  // Props expected from TableContainer / redux store
  enterpriseId: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})),
  currentPage: PropTypes.number,
  pageCount: PropTypes.number,
  itemCount: PropTypes.number,
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
  pageCount: undefined,
  itemCount: undefined,
  error: null,
  loading: false,
  customEmptyMessage: null,
};

export default withLocation(withNavigate(TableComponent));
