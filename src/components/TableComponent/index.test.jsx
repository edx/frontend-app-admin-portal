import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';
import { updateUrl } from '../../utils';
import TableComponent from './index';
import { accessibilitySettings } from '../../../tests/accessibility-settings';

let capturedDataTableProps;
let capturedFetchData;

jest.mock('@2uinc/frontend-enterprise-utils', () => ({
  sendEnterpriseTrackEvent: jest.fn(),
}));
jest.mock('../../utils', () => ({
  updateUrl: jest.fn(),
}));
jest.mock('@openedx/paragon', () => {
  const ReactMod = jest.requireActual('react');
  const actual = jest.requireActual('@openedx/paragon');
  const CapturingDataTable = ({ fetchData, ...props }) => {
    capturedDataTableProps = props;
    capturedFetchData = fetchData;
    return ReactMod.createElement(actual.DataTable, { fetchData, ...props });
  };
  Object.assign(CapturingDataTable, actual.DataTable);
  return {
    ...actual,
    DataTable: CapturingDataTable,
  };
});

const mockPaginateTable = jest.fn();
const mockSortTable = jest.fn();
const mockClearTable = jest.fn();

const mockDefaultProps = {
  id: 'test-table',
  columns: [],
  formatData: jest.fn(data => data),
  enterpriseId: 'enterprise-id',
  paginateTable: mockPaginateTable,
  sortTable: mockSortTable,
  clearTable: mockClearTable,
  location: { pathname: '/test', search: '' },
  navigate: jest.fn(),
};

const TableComponentWrapper = props => (
  <IntlProvider locale="en">
    <MemoryRouter>
      <TableComponent {...props} />
    </MemoryRouter>
  </IntlProvider>
);

describe('TableComponent', () => {
  afterEach(() => {
    jest.clearAllMocks();
    capturedDataTableProps = undefined;
    capturedFetchData = undefined;
  });

  it('builds sort state from fallback column and default sort type', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: true,
      defaultSortType: 'desc',
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.initialState.sortBy).toEqual([{ id: 'user_email', desc: true }]);
  });

  it('falls back to first column when defaultSortIndex is out of range', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      defaultSortIndex: 3,
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: true,
      defaultSortType: 'asc',
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.initialState.sortBy).toEqual([{ id: 'user_email', desc: false }]);
  });

  it('builds sort state from ordering when default sort type is not provided', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: true,
      ordering: '-user_email',
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.initialState.sortBy).toEqual([{ id: 'user_email', desc: true }]);
  });

  it('returns empty sort state when active ordering cannot be derived', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: '', label: 'Broken Column', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: true,
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.initialState.sortBy).toEqual([]);
  });

  it('returns empty sort state when table is sortable but columns are empty', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: true,
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.initialState.sortBy).toEqual([]);
  });

  it('updates URL and tracks event on sort change from DataTable fetchData', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [
        { key: 'user_email', label: 'Email', columnSortable: true },
        { key: 'course_title', label: 'Course Title', columnSortable: true },
      ],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: true,
      ordering: 'user_email',
      location: { pathname: '/test', search: '' },
    };

    render(<TableComponentWrapper {...props} />);
    capturedFetchData({ pageIndex: 0, sortBy: [{ id: 'course_title', desc: true }] });

    expect(updateUrl).toHaveBeenCalledWith(expect.any(Function), '/test', {
      page: 1,
      ordering: '-course_title',
    });
    expect(sendEnterpriseTrackEvent).toHaveBeenCalledWith(
      props.enterpriseId,
      'edx.ui.enterprise.admin_portal.table.sorted',
      {
        tableId: props.id,
        column: 'Course Title',
        direction: 'desc',
      },
    );
  });

  it('tracks sort event with undefined column label when sort key is not found', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: true,
      ordering: 'user_email',
      location: { pathname: '/test', search: '' },
    };

    render(<TableComponentWrapper {...props} />);
    capturedFetchData({ pageIndex: 0, sortBy: [{ id: 'missing_key', desc: false }] });

    expect(sendEnterpriseTrackEvent).toHaveBeenCalledWith(
      props.enterpriseId,
      'edx.ui.enterprise.admin_portal.table.sorted',
      {
        tableId: props.id,
        column: undefined,
        direction: 'asc',
      },
    );
  });

  it('updates URL and tracks event on pagination change from DataTable fetchData', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 3,
      itemCount: 3,
      tableSortable: true,
      ordering: 'user_email',
      location: { pathname: '/test', search: '' },
    };

    render(<TableComponentWrapper {...props} />);
    capturedFetchData({ pageIndex: 2, sortBy: [{ id: 'user_email', desc: false }] });

    expect(updateUrl).toHaveBeenCalledWith(expect.any(Function), '/test', { page: 3 });
    expect(sendEnterpriseTrackEvent).toHaveBeenCalledWith(
      props.enterpriseId,
      'edx.ui.enterprise.admin_portal.table.paginated',
      {
        tableId: props.id,
        page: 3,
      },
    );
  });

  it('does not update URL or track when fetchData is a no-op', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: true,
      ordering: 'user_email',
      location: { pathname: '/test', search: '' },
    };

    render(<TableComponentWrapper {...props} />);
    capturedFetchData({ pageIndex: 0, sortBy: [{ id: 'user_email', desc: false }] });

    expect(updateUrl).not.toHaveBeenCalled();
    expect(sendEnterpriseTrackEvent).not.toHaveBeenCalled();
  });

  it('uses fetchData default args without triggering updates', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
      tableSortable: false,
      location: { pathname: '/test', search: '' },
    };

    render(<TableComponentWrapper {...props} />);
    capturedFetchData();

    expect(updateUrl).not.toHaveBeenCalled();
    expect(sendEnterpriseTrackEvent).not.toHaveBeenCalled();
  });

  it('uses page_size from URL for DataTable initial state', () => {
    const props = {
      ...mockDefaultProps,
      location: { pathname: '/test', search: '?page_size=25' },
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.initialState.pageSize).toEqual(25);
  });

  it('uses default page size when URL page_size is missing', () => {
    const props = {
      ...mockDefaultProps,
      location: { pathname: '/test', search: '' },
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 1,
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.initialState.pageSize).toEqual(50);
  });

  it('ensures itemCount is at least data length', () => {
    const props = {
      ...mockDefaultProps,
      data: [
        { user_email: 'user1@example.com' },
        { user_email: 'user2@example.com' },
      ],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: 1,
      itemCount: 0,
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.itemCount).toEqual(2);
  });

  it('uses pageCount fallback of 1 when pageCount is undefined', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: 1,
      pageCount: undefined,
      itemCount: 1,
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.pageCount).toEqual(1);
  });

  it('uses fallback key fragments and page index when current page and ordering are undefined', () => {
    const props = {
      ...mockDefaultProps,
      data: [{ user_email: 'user@example.com' }],
      columns: [{ key: 'user_email', label: 'Email', columnSortable: true }],
      currentPage: undefined,
      ordering: undefined,
      pageCount: 1,
      itemCount: 1,
    };

    render(<TableComponentWrapper {...props} />);

    expect(capturedDataTableProps.initialState.pageIndex).toEqual(0);
  });

  it('renders the loading message when loading and no data is available', () => {
    const defaultProps = {
      ...mockDefaultProps,
      loading: true,
      data: undefined,
    };

    render(<TableComponentWrapper {...defaultProps} />);

    expect(screen.getByText('Loading...'));
  });

  it('has no accessibility violations', async () => {
    const defaultProps = {
      ...mockDefaultProps,
      loading: true,
      data: undefined,
    };
    const { container } = render(<TableComponentWrapper {...defaultProps} />);
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders the error message when there is an error', () => {
    const errorProps = { ...mockDefaultProps, error: new Error('Test Error') };
    render(<TableComponentWrapper {...errorProps} />);
    expect(screen.getByText('Unable to load data'));
    expect(screen.getByText('Try refreshing your screen Test Error'));
  });

  it('renders the empty data message when no data is available', () => {
    render(<TableComponentWrapper {...mockDefaultProps} data={[]} />);
    expect(screen.getByText('There are no results.'));
  });

  it('renders custom empty data message when provided', () => {
    render(<TableComponentWrapper {...mockDefaultProps} data={[]} customEmptyMessage="No rows found" />);
    expect(screen.getByText('No rows found')).toBeTruthy();
  });

  it('renders the table content when data is available', () => {
    const dataProps = {
      ...mockDefaultProps,
      data: [
        {
          user_email: 'testuser1@gmail.com',
          enrollment_id: 6066,
          enrollment_date: '2024-12-30',
          course_key: 'TEFLx+GRA.30.1x',
          courserun_key: 'course-v1:TEFLx+GRA.30.1x+3T2024',
          course_title: '30-hour Grammar and Language Awareness',
          passed_date: '2025-01-04',
          current_grade: 0.98,
        },
        {
          user_email: 'testuser2@gmail.com',
          enrollment_id: 5055,
          enrollment_date: '2024-07-13',
          course_key: 'FEFRx+GIA.30.1x',
          courserun_key: 'course-v1:FEFRx+GIA.30.1x+3T2024',
          course_title: 'Project Management Professional',
          passed_date: '2025-03-01',
          current_grade: 0.88,
        },
      ],
      columns: [
        { key: 'user_email', label: 'Email', columnSortable: true },
        { key: 'course_title', label: 'Course Title', columnSortable: false },
        { key: 'current_grade', label: 'Current Grade', columnSortable: true },
      ],
      currentPage: 1,
      pageCount: 1,
      ordering: 'current_grade',
      loading: false,
      error: undefined,
    };

    render(<TableComponentWrapper {...dataProps} />);

    expect(screen.getByText('Email'));
    expect(screen.getByText('Course Title'));
    expect(screen.getByText('Current Grade'));

    expect(screen.getByText('testuser1@gmail.com'));
    expect(screen.getByText('30-hour Grammar and Language Awareness'));
    expect(screen.getByText('0.98'));

    expect(screen.getByText('testuser2@gmail.com'));
    expect(screen.getByText('Project Management Professional'));
    expect(screen.getByText('0.88'));
  });

  it('calls paginateTable on mount', () => {
    render(<TableComponentWrapper {...mockDefaultProps} />);

    expect(mockPaginateTable).toHaveBeenCalled();
  });

  it('calls clearTable on unmount', () => {
    const { unmount } = render(<TableComponentWrapper {...mockDefaultProps} />);
    unmount();
    expect(mockClearTable).toHaveBeenCalled();
  });

  it('calls sortTable when ordering changes', () => {
    const defaultProps = {
      ...mockDefaultProps,
      location: { search: '?ordering=current_grade&page=1' },
      sortTable: mockSortTable,
      paginateTable: mockPaginateTable,
    };

    const { rerender } = render(<TableComponentWrapper {...defaultProps} />);

    // Simulate a change in the query params, causing componentDidUpdate to be triggered
    const newLocation = { search: '?ordering=-current_grade&page=2' };

    rerender(<TableComponentWrapper {...defaultProps} location={newLocation} />);

    expect(mockSortTable).toHaveBeenCalledWith('-current_grade');
  });

  it('does not call sortTable when ordering is null or undefined', () => {
    const defaultProps = {
      ...mockDefaultProps,
      location: { search: '?ordering=null&page=1' }, // Set ordering to null in query params
      sortTable: mockSortTable,
      paginateTable: mockPaginateTable,
    };

    const { rerender } = render(<TableComponentWrapper {...defaultProps} />);

    // Simulate a change where ordering is undefined in the query params
    const newLocation = { search: '?ordering=&page=2' }; // ordering is undefined in query params

    rerender(<TableComponentWrapper {...defaultProps} location={newLocation} />);

    expect(mockSortTable).not.toHaveBeenCalled();
  });

  it('does nothing when location.search does not change in componentDidUpdate', () => {
    const defaultProps = {
      ...mockDefaultProps,
      location: { search: '?ordering=user_email&page=1' },
      sortTable: mockSortTable,
      paginateTable: mockPaginateTable,
    };

    const { rerender } = render(<TableComponentWrapper {...defaultProps} />);
    mockSortTable.mockClear();
    mockPaginateTable.mockClear();

    rerender(<TableComponentWrapper {...defaultProps} />);

    expect(mockSortTable).not.toHaveBeenCalled();
    expect(mockPaginateTable).not.toHaveBeenCalled();
  });

  it('does nothing when search changes but neither ordering nor page changes', () => {
    const defaultProps = {
      ...mockDefaultProps,
      location: { search: '?foo=1' },
      sortTable: mockSortTable,
      paginateTable: mockPaginateTable,
    };

    const { rerender } = render(<TableComponentWrapper {...defaultProps} />);
    mockSortTable.mockClear();
    mockPaginateTable.mockClear();

    const newLocation = { search: '?foo=2' };
    rerender(<TableComponentWrapper {...defaultProps} location={newLocation} />);

    expect(mockSortTable).not.toHaveBeenCalled();
    expect(mockPaginateTable).not.toHaveBeenCalled();
  });
});
