import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';

import { axe } from 'jest-axe';
import PastWeekPassedLearnersTable from '.';
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
      },
      {
        id: 5,
        passed_date: '2018-09-22T16:27:34.690065Z',
        course_title: 'Redux with ReactJS',
        course_key: 'edX/Redux_ReactJS',
        user_email: 'new@example.com',
      },
    ],
    next: null,
    start: 0,
    previous: null,
  },
};

const PastWeekPassedLearnersWrapper = props => (
  <MemoryRouter>
    <IntlProvider locale="en">
      <Provider store={store}>
        <PastWeekPassedLearnersTable
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

describe('PastWeekPassedLearnersTable', () => {
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
    const { container } = render(<PastWeekPassedLearnersWrapper />);

    await screen.findByText('There are no results.');
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders table correctly', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValueOnce(tableMockData);

    const { asFragment } = render((
      <PastWeekPassedLearnersWrapper />
    ));

    await screen.findByText('awesome.me@example.com');
    expect(asFragment()).toMatchSnapshot();
  });

  it('fetches past week passed learners and renders formatted data', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValueOnce(tableMockData);

    render((
      <PastWeekPassedLearnersWrapper />
    ));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          passedDate: 'last_week',
          page: 1,
          ordering: 'user_email',
        }),
      );
    });

    expect(screen.getByRole('columnheader', { name: /Email/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Course Title/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Passed Date/i })).toBeInTheDocument();

    expect(await screen.findByText('awesome.me@example.com')).toBeInTheDocument();
    expect(screen.getByText('Dive into ReactJS')).toBeInTheDocument();
    expect(screen.getByText('September 23, 2018')).toBeInTheDocument();
  });

  it('fetches sorted data when sorting changes', async () => {
    EnterpriseDataApiService.fetchCourseEnrollments.mockResolvedValue(tableMockData);

    render(<PastWeekPassedLearnersWrapper />);

    await screen.findByText('awesome.me@example.com');
    fireEvent.click(screen.getByRole('columnheader', { name: /Course Title/i }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          passedDate: 'last_week',
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

    render(<PastWeekPassedLearnersWrapper />);

    await screen.findByText('awesome.me@example.com');
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          passedDate: 'last_week',
          page: 2,
        }),
      );
    });
  });

  it('does not update state when component unmounts before fetch resolves', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCourseEnrollments.mockReturnValue(deferred.promise);

    const { unmount } = render(<PastWeekPassedLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();
    });

    unmount();
    deferred.resolve(tableMockData);
  });

  it('does not update state when component unmounts before fetch rejects', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCourseEnrollments.mockReturnValue(deferred.promise);

    const { unmount } = render(<PastWeekPassedLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();
    });

    unmount();
    deferred.reject(new Error('Network error'));
  });
});
