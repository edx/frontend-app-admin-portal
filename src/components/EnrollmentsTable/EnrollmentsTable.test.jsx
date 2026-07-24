import React from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import renderer from 'react-test-renderer';
import configureMockStore from 'redux-mock-store';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { axe } from 'jest-axe';
import EnrollmentsTable from '.';
import { accessibilitySettings } from '../../../tests/accessibility-settings';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';

let capturedFetchData;
jest.mock('@openedx/paragon', () => {
  const ReactMod = jest.requireActual('react');
  const actual = jest.requireActual('@openedx/paragon');
  const CapturingDataTable = ({ fetchData, ...props }) => {
    capturedFetchData = fetchData;
    return ReactMod.createElement(actual.DataTable, { fetchData, ...props });
  };
  Object.assign(CapturingDataTable, actual.DataTable);
  return { ...actual, DataTable: CapturingDataTable };
});

jest.mock('@2uinc/frontend-enterprise-utils', () => ({
  ...jest.requireActual('@2uinc/frontend-enterprise-utils'),
  sendEnterpriseTrackEvent: jest.fn(),
}));

jest.mock('@edx/frontend-platform/logging', () => ({
  ...jest.requireActual('@edx/frontend-platform/logging'),
  logError: jest.fn(),
}));

jest.mock('../../data/services/EnterpriseDataApiService', () => ({
  __esModule: true,
  default: {
    fetchCourseEnrollments: jest.fn(),
  },
}));

const enterpriseId = 'test-enterprise';
const mockStore = configureMockStore([thunk]);
const store = mockStore({
  portalConfiguration: {
    enterpriseId,
  },
});

const NavigationHelper = ({ to }) => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>navigate</button>
  );
};

const EnrollmentsWrapper = props => (
  <MemoryRouter initialEntries={props.initialEntries || ['/']}>
    {props.navigateTo && <NavigationHelper to={props.navigateTo} />}
    <IntlProvider locale="en">
      <Provider store={store}>
        <EnrollmentsTable
          {...props}
        />
      </Provider>
    </IntlProvider>
  </MemoryRouter>
);

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('EnrollmentsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedFetchData = undefined;
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValue({
      data: {
        count: 0,
        num_pages: 1,
        results: [],
      },
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<EnrollmentsWrapper />);

    await screen.findByText('There are no results.');
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state correctly', async () => {
    render(<EnrollmentsWrapper />);

    expect(await screen.findByText('There are no results.')).toBeInTheDocument();
  });

  it('renders empty state snapshot correctly', async () => {
    const { asFragment } = render(<EnrollmentsWrapper />);

    await screen.findByText('There are no results.');
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders a group-specific no results warning message when the filter is applied', async () => {
    render(<EnrollmentsWrapper initialEntries={['/?group_uuid=test_uuid123']} />);

    const emptyMessage = 'We are currently processing the latest updates. The data is refreshed twice a day. Thank you for your patience, and please check back soon.';
    expect(await screen.findByText(emptyMessage)).toBeInTheDocument();
  });

  it('uses default sort by current_grade descending', async () => {
    render(<EnrollmentsWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        {
          page: 1,
          page_size: 50,
          ordering: '-current_grade',
        },
      );
    });
  });

  it('renders enrollments table with correct data', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValue({
      data: {
        count: 1,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'test_user_1@example.com',
            user_first_name: 'Test',
            user_last_name: 'User',
            course_title: 'Demo Course',
            course_list_price: 100,
            course_start_date: '2017-06-23',
            course_end_date: '2017-12-23',
            course_progress: 0.5,
            course_passing_grade: 0.6,
            current_grade: 0.77,
            last_activity_date: '2018-01-15',
          },
        ],
      },
    });

    const columnTitles = [
      'Email', 'First Name', 'Last Name', 'Course Title', 'Course Price', 'Start Date', 'End Date',
      'Course Progress', 'Course Passing Grade', 'Current Grade', 'Last Activity Date',
    ];
    const rowValues = [
      'test_user_1@example.com', 'Test', 'User', 'Demo Course', '$100', 'June 23, 2017', 'December 23, 2017',
      '50%', '60%', '77%', 'January 15, 2018',
    ];

    const { container } = render(<EnrollmentsWrapper />);

    await screen.findByText('test_user_1@example.com');

    columnTitles.forEach((columnTitle) => {
      expect(container.textContent).toContain(columnTitle);
    });

    rowValues.forEach((value) => {
      expect(container.textContent).toContain(value);
    });
  });

  it('renders enrollments table snapshot correctly', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValue({
      data: {
        count: 1,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'test_user_1@example.com',
            user_first_name: 'Test',
            user_last_name: 'User',
            course_title: 'Demo Course',
            course_list_price: 100,
            course_start_date: '2017-06-23',
            course_end_date: '2017-12-23',
            course_progress: 0.5,
            course_passing_grade: 0.6,
            current_grade: 0.77,
            last_activity_date: '2018-01-15',
          },
        ],
      },
    });

    let tree;
    await renderer.act(async () => {
      tree = renderer.create((
        <EnrollmentsWrapper />
      ));
      await Promise.resolve();
    });

    expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();

    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('fetches sorted data when sorting changes', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValue({
      data: {
        count: 1,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'learner@example.com',
          },
        ],
      },
    });

    render(<EnrollmentsWrapper />);

    await screen.findByText('learner@example.com');
    fireEvent.click(screen.getByRole('columnheader', { name: /Email/i }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          ordering: expect.stringMatching(/user_email/),
        }),
      );
    });
  });

  it('updates pageIndex when URL changes to a different page', async () => {
    render(<EnrollmentsWrapper navigateTo="/?page=3" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1 }),
      );
    });

    EnterpriseDataApiService.fetchCourseEnrollments.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 3 }),
      );
    });
  });

  it('updates ordering when URL changes to a different ordering', async () => {
    render(<EnrollmentsWrapper navigateTo="/?ordering=user_email" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: '-current_grade' }),
      );
    });

    EnterpriseDataApiService.fetchCourseEnrollments.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: 'user_email' }),
      );
    });
  });

  it('re-fetches with active filter query params when the URL filters change', async () => {
    render(<EnrollmentsWrapper navigateTo="/?search_course=Demo+Course&budget_uuid=budget-1&group_uuid=group-1&search_start_date=2020-01-01&search_enrollment=enrolled&search=jane" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1, page_size: 50, ordering: '-current_grade' }),
      );
    });

    EnterpriseDataApiService.fetchCourseEnrollments.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          search_course: 'Demo Course',
          budget_uuid: 'budget-1',
          group_uuid: 'group-1',
          search_start_date: '2020-01-01',
          search_enrollment: 'enrolled',
          search: 'jane',
        }),
      );
    });
  });

  it('ignores fetch response when component unmounts before fetch resolves', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCourseEnrollments.mockReturnValue(deferred.promise);

    const { unmount } = render(<EnrollmentsWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      deferred.resolve({ data: { results: [], count: 0, num_pages: 1 } });
    });
  });

  it('ignores fetch error when component unmounts before fetch rejects', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCourseEnrollments.mockReturnValue(deferred.promise);

    const { unmount } = render(<EnrollmentsWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      deferred.reject(new Error('Network error'));
    });
  });

  it('logs and renders generic error when data fetch fails', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockRejectedValue(new Error('Bad request'));

    render(<EnrollmentsWrapper />);

    expect(await screen.findByText('Unable to load data')).toBeInTheDocument();
    expect(screen.getByText('Try refreshing your screen.')).toBeInTheDocument();
    expect(screen.queryByText('Bad request')).not.toBeInTheDocument();
    expect(logError).toHaveBeenCalled();
  });

  it('fetches next page when fetchData is called with pagination only (no sort)', async () => {
    render(<EnrollmentsWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1 }),
      );
    });

    EnterpriseDataApiService.fetchCourseEnrollments.mockClear();

    await act(async () => {
      capturedFetchData({ pageIndex: 1, sortBy: [] });
    });

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 2 }),
      );
    });
  });
});
