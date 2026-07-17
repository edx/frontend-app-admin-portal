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
import EnrolledLearnersForInactiveCoursesTable from '.';
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
    fetchEnrolledLearnersForInactiveCourses: jest.fn(),
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

const EnrolledLearnersForInactiveCoursesWrapper = props => (
  <MemoryRouter initialEntries={props.initialEntries || ['/']}>
    {props.navigateTo && <NavigationHelper to={props.navigateTo} />}
    <IntlProvider locale="en">
      <Provider store={store}>
        <EnrolledLearnersForInactiveCoursesTable
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

describe('EnrolledLearnersForInactiveCoursesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedFetchData = undefined;
    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockResolvedValue({
      data: {
        count: 0,
        num_pages: 1,
        results: [],
      },
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<EnrolledLearnersForInactiveCoursesWrapper />);

    await screen.findByText('There are no results.');
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state correctly', async () => {
    render(<EnrolledLearnersForInactiveCoursesWrapper />);

    expect(await screen.findByText('There are no results.')).toBeInTheDocument();
  });

  it('renders empty state snapshot correctly', async () => {
    const { asFragment } = render(<EnrolledLearnersForInactiveCoursesWrapper />);

    await screen.findByText('There are no results.');
    expect(asFragment()).toMatchSnapshot();
  });

  it('uses default sort by user_email', async () => {
    render(<EnrolledLearnersForInactiveCoursesWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalledWith(
        enterpriseId,
        {
          page: 1,
          page_size: 50,
          ordering: 'user_email',
        },
      );
    });
  });

  it('renders enrolled learners for inactive courses table with correct data', async () => {
    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockResolvedValue({
      data: {
        count: 3,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'test_user_1@example.com',
            last_activity_date: '2017-06-23',
            enrollment_count: 2,
            course_completion_count: 1,
          },
          {
            id: 2,
            user_email: 'test_user_2@example.com',
            last_activity_date: '2018-01-15',
            enrollment_count: 5,
            course_completion_count: 5,
          },
          {
            id: 3,
            user_email: 'test_user_3@example.com',
            last_activity_date: '2017-11-18',
            enrollment_count: 6,
            course_completion_count: 4,
          },
        ],
      },
    });

    const columnTitles = [
      'Email', 'Total Course Enrollment Count', 'Total Completed Courses Count', 'Last Activity Date',
    ];
    const rowsData = [
      [
        'test_user_1@example.com',
        '2',
        '1',
        'June 23, 2017',
      ],
      [
        'test_user_2@example.com',
        '5',
        '5',
        'January 15, 2018',
      ],
      [
        'test_user_3@example.com',
        '6',
        '4',
        'November 18, 2017',
      ],
    ];

    const { container } = render((
      <EnrolledLearnersForInactiveCoursesWrapper />
    ));

    await screen.findByText('test_user_1@example.com');

    // Verify expected column titles are present.
    columnTitles.forEach((columnTitle) => {
      expect(container.textContent).toContain(columnTitle);
    });

    // Verify each learner row values are shown.
    rowsData.forEach((rowData) => {
      rowData.forEach((cellValue) => {
        expect(container.textContent).toContain(cellValue);
      });
    });
  });

  it('renders enrolled learners for inactive courses table snapshot correctly', async () => {
    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockResolvedValue({
      data: {
        count: 1,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'test_user_1@example.com',
            last_activity_date: '2017-06-23',
            enrollment_count: 2,
            course_completion_count: 1,
          },
        ],
      },
    });

    let tree;
    await renderer.act(async () => {
      tree = renderer.create((
        <EnrolledLearnersForInactiveCoursesWrapper />
      ));
      await Promise.resolve();
    });

    expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalled();

    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('fetches sorted data when sorting changes', async () => {
    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockResolvedValue({
      data: {
        count: 1,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'learner@example.com',
            last_activity_date: '2024-01-01',
            enrollment_count: 2,
            course_completion_count: 1,
          },
        ],
      },
    });

    render(<EnrolledLearnersForInactiveCoursesWrapper />);

    await screen.findByText('learner@example.com');
    fireEvent.click(screen.getByRole('columnheader', { name: /Last Activity Date/i }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          ordering: expect.stringMatching(/last_activity_date/),
        }),
      );
    });
  });

  it('updates pageIndex when URL changes to a different page', async () => {
    render(<EnrolledLearnersForInactiveCoursesWrapper navigateTo="/?page=3" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1 }),
      );
    });

    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 3 }),
      );
    });
  });

  it('updates ordering when URL changes to a different ordering', async () => {
    render(<EnrolledLearnersForInactiveCoursesWrapper navigateTo="/?ordering=-enrollment_count" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: 'user_email' }),
      );
    });

    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: '-enrollment_count' }),
      );
    });
  });

  it('ignores fetch response when component unmounts before fetch resolves', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockReturnValue(deferred.promise);

    const { unmount } = render(<EnrolledLearnersForInactiveCoursesWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      deferred.resolve({ data: { results: [], count: 0, num_pages: 1 } });
    });
  });

  it('ignores fetch error when component unmounts before fetch rejects', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockReturnValue(deferred.promise);

    const { unmount } = render(<EnrolledLearnersForInactiveCoursesWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      deferred.reject(new Error('Network error'));
    });
  });

  it('logs and renders generic error when data fetch fails', async () => {
    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockRejectedValue(new Error('Bad request'));

    render(<EnrolledLearnersForInactiveCoursesWrapper />);

    expect(await screen.findByText('Unable to load data')).toBeInTheDocument();
    expect(screen.getByText('Try refreshing your screen.')).toBeInTheDocument();
    expect(screen.queryByText('Bad request')).not.toBeInTheDocument();
    expect(logError).toHaveBeenCalled();
  });

  it('fetches next page when fetchData is called with pagination only (no sort)', async () => {
    render(<EnrolledLearnersForInactiveCoursesWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1 }),
      );
    });

    EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses.mockClear();

    await act(async () => {
      capturedFetchData({ pageIndex: 1, sortBy: [] });
    });

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 2 }),
      );
    });
  });
});
