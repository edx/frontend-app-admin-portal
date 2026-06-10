import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { axe } from 'jest-axe';
import LearnerActivityTable from '.';
import { accessibilitySettings } from '../../../tests/accessibility-settings';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';

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

const tableMockData = {
  data: {
    count: 2,
    num_pages: 1,
    current_page: 1,
    results: [
      {
        id: 1,
        passed_date: '2018-09-23T16:27:34.690065Z',
        course_title: 'Dive into ReactJS',
        course_key: 'edX/ReactJS',
        user_email: 'awesome.me@example.com',
        course_list_price: '200',
        course_start_date: '2017-10-21T23:47:32.738Z',
        course_end_date: '2018-05-13T12:47:27.534Z',
        current_grade: '0.66',
        course_progress: '0.50',
        course_passing_grade: '0.70',
        progress_status: 'Failed',
        last_activity_date: '2018-09-22T10:59:28.628Z',
      },
      {
        id: 5,
        passed_date: '2018-09-22T16:27:34.690065Z',
        course_title: 'Redux with ReactJS',
        course_key: 'edX/Redux_ReactJS',
        user_email: 'new@example.com',
        course_list_price: '200',
        course_start_date: '2017-10-21T23:47:32.738Z',
        course_end_date: '2018-05-13T12:47:27.534Z',
        current_grade: '0.80',
        course_progress: '0.75',
        course_passing_grade: '0.60',
        progress_status: 'Passed',
        last_activity_date: '2018-09-25T10:59:28.628Z',
      },
    ],
    next: null,
    start: 0,
    previous: null,
  },
};

const LearnerActivityTableWrapper = props => (
  <MemoryRouter>
    <IntlProvider locale="en">
      <Provider store={store}>
        <LearnerActivityTable
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

const renderLearnerActivityTable = async (tableId = 'active-week', activity = 'active_past_week') => {
  render(<LearnerActivityTableWrapper id={tableId} activity={activity} />);
  return screen.findByText('There are no results.');
};

describe('LearnerActivityTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValue({
      data: {
        count: 0,
        num_pages: 0,
        results: [],
      },
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    await screen.findByText('There are no results.');
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state correctly', async () => {
    const { asFragment } = render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    expect(await screen.findByText('There are no results.')).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });

  it.each([
    ['active-week', 'active_past_week'],
    ['inactive-week', 'inactive_past_week'],
    ['inactive-month', 'inactive_past_month'],
  ])('fetches data with learnerActivity=%s', async (tableId, activity) => {
    await renderLearnerActivityTable(tableId, activity);

    expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
      enterpriseId,
      expect.objectContaining({
        learnerActivity: activity,
        page: 1,
        ordering: 'user_email',
      }),
    );
  });

  it('renders learners table with correctly formatted data', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValueOnce(tableMockData);

    render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    expect(await screen.findByText('awesome.me@example.com')).toBeInTheDocument();
    expect(screen.getByText('Dive into ReactJS')).toBeInTheDocument();
    expect(screen.getAllByText('$200')).toHaveLength(2);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('66%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('fetches sorted data when sorting changes', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValueOnce(tableMockData);

    render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    await screen.findByText('awesome.me@example.com');
    fireEvent.click(screen.getByRole('columnheader', { name: /Course Title/i }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          learnerActivity: 'active_past_week',
          ordering: expect.stringMatching(/course_title/),
        }),
      );
    });
  });

  it('fetches next page when pagination changes', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValueOnce({
      data: {
        ...tableMockData.data,
        count: 60,
        num_pages: 2,
      },
    });

    render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    await screen.findByText('awesome.me@example.com');
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          learnerActivity: 'active_past_week',
          page: 2,
        }),
      );
    });
  });

  it('does not render empty state while loading', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCourseEnrollments.mockReturnValue(deferred.promise);

    render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();
    });
    expect(screen.queryByText('There are no results.')).not.toBeInTheDocument();

    deferred.resolve({
      data: {
        count: 0,
        num_pages: 0,
        results: [],
      },
    });

    expect(await screen.findByText('There are no results.')).toBeInTheDocument();
  });

  it('renders error state when data fetch fails', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockRejectedValueOnce(new Error('Bad request'));

    render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    expect(await screen.findByText('Unable to load data')).toBeInTheDocument();
    expect(screen.getByText('Try refreshing your screen Bad request')).toBeInTheDocument();
    expect(screen.queryByText('There are no results.')).not.toBeInTheDocument();
  });

  it('does not update state when component unmounts before fetch resolves', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCourseEnrollments.mockReturnValue(deferred.promise);

    const { unmount } = render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();
    });

    // Unmount sets isCurrent=false; resolving after should hit the early-return guard
    unmount();
    deferred.resolve(tableMockData);
    // No state-update error or unhandled rejection should occur
  });

  it('does not update state when component unmounts before fetch rejects', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCourseEnrollments.mockReturnValue(deferred.promise);

    const { unmount } = render(<LearnerActivityTableWrapper id="active-week" activity="active_past_week" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();
    });

    // Unmount sets isCurrent=false; rejecting after should hit the early-return guard
    unmount();
    deferred.reject(new Error('Network error'));
    // No error state or unhandled rejection should propagate
  });
});
