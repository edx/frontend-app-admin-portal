import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { axe } from 'jest-axe';
import TableComponent from './index';
import { accessibilitySettings } from '../../../tests/accessibility-settings';

jest.mock('@2uinc/frontend-enterprise-utils', () => ({
  sendEnterpriseTrackEvent: jest.fn(),
}));
jest.mock('../../utils', () => ({
  updateUrl: jest.fn(),
}));

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
  <MemoryRouter>
    <IntlProvider locale="en">
      <TableComponent {...props} />
    </IntlProvider>
  </MemoryRouter>
);

describe('TableComponent', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
    expect(mockPaginateTable).toHaveBeenCalledWith(1);
  });

  it('calls clearTable on unmount', () => {
    const { unmount } = render(<TableComponentWrapper {...mockDefaultProps} />);
    unmount();
    expect(mockClearTable).toHaveBeenCalled();
  });

  it('does not call sortTable during initial mount when no ordering is provided', () => {
    render(<TableComponentWrapper {...mockDefaultProps} />);
    expect(mockSortTable).not.toHaveBeenCalled();
  });
});
