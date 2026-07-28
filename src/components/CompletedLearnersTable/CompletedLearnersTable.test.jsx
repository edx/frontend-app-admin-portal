import React from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import renderer from 'react-test-renderer';
import configureMockStore from 'redux-mock-store';
import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';
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
import CompletedLearnersTable from '.';
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
    fetchCompletedLearners: jest.fn(),
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

const CompletedLearnersWrapper = props => (
  <MemoryRouter initialEntries={props.initialEntries || ['/']}>
    {props.navigateTo && <NavigationHelper to={props.navigateTo} />}
    <IntlProvider locale="en">
      <Provider store={store}>
        <CompletedLearnersTable
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

describe('CompletedLearnersTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedFetchData = undefined;
    EnterpriseDataApiService.fetchCompletedLearners.mockResolvedValue({
      data: {
        count: 0,
        num_pages: 1,
        results: [],
      },
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CompletedLearnersWrapper />);

    await screen.findByText('There are no results.');
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state correctly', async () => {
    render(<CompletedLearnersWrapper />);

    expect(await screen.findByText('There are no results.')).toBeInTheDocument();
  });

  it('renders empty state snapshot correctly', async () => {
    const { asFragment } = render(<CompletedLearnersWrapper />);

    await screen.findByText('There are no results.');
    expect(asFragment()).toMatchSnapshot();
  });

  it('uses default sort by user_email', async () => {
    render(<CompletedLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalledWith(
        enterpriseId,
        {
          page: 1,
          page_size: 50,
          ordering: 'user_email',
        },
      );
    });
  });

  it('renders completed learners table with correct data', async () => {
    EnterpriseDataApiService.fetchCompletedLearners.mockResolvedValue({
      data: {
        count: 3,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'test_user_1@example.com',
            completed_courses: 2,
          },
          {
            id: 2,
            user_email: 'test_user_2@example.com',
            completed_courses: 5,
          },
          {
            id: 3,
            user_email: 'test_user_3@example.com',
            completed_courses: 4,
          },
        ],
      },
    });

    const columnTitles = ['Email', 'Total Course Completed Count'];
    const rowsData = [
      ['test_user_1@example.com', '2'],
      ['test_user_2@example.com', '5'],
      ['test_user_3@example.com', '4'],
    ];

    const { container } = render((
      <CompletedLearnersWrapper />
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

  it('renders completed learners table snapshot correctly', async () => {
    EnterpriseDataApiService.fetchCompletedLearners.mockResolvedValue({
      data: {
        count: 1,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'test_user_1@example.com',
            completed_courses: 2,
          },
        ],
      },
    });

    let tree;
    await renderer.act(async () => {
      tree = renderer.create((
        <CompletedLearnersWrapper />
      ));
      await Promise.resolve();
    });

    expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalled();

    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('fetches sorted data when sorting changes', async () => {
    EnterpriseDataApiService.fetchCompletedLearners.mockResolvedValue({
      data: {
        count: 1,
        num_pages: 1,
        results: [
          {
            id: 1,
            user_email: 'learner@example.com',
            completed_courses: 1,
          },
        ],
      },
    });

    render(<CompletedLearnersWrapper />);

    await screen.findByText('learner@example.com');
    fireEvent.click(screen.getByRole('columnheader', { name: /Total Course Completed Count/i }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          ordering: expect.stringMatching(/completed_courses/),
        }),
      );
    });

    expect(sendEnterpriseTrackEvent).toHaveBeenCalledWith(
      enterpriseId,
      'edx.ui.enterprise.admin_portal.table.sorted',
      {
        tableId: 'completed-learners',
        column: 'completed_courses',
        direction: 'asc',
      },
    );
  });

  it('updates pageIndex when URL changes to a different page', async () => {
    render(<CompletedLearnersWrapper navigateTo="/?page=3" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1 }),
      );
    });

    EnterpriseDataApiService.fetchCompletedLearners.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 3 }),
      );
    });
  });

  it('updates ordering when URL changes to a different ordering', async () => {
    render(<CompletedLearnersWrapper navigateTo="/?ordering=-completed_courses" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: 'user_email' }),
      );
    });

    EnterpriseDataApiService.fetchCompletedLearners.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: '-completed_courses' }),
      );
    });
  });

  it('ignores fetch response when component unmounts before fetch resolves', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCompletedLearners.mockReturnValue(deferred.promise);

    const { unmount } = render(<CompletedLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      deferred.resolve({ data: { results: [], count: 0, num_pages: 1 } });
    });
  });

  it('ignores fetch error when component unmounts before fetch rejects', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchCompletedLearners.mockReturnValue(deferred.promise);

    const { unmount } = render(<CompletedLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      deferred.reject(new Error('Network error'));
    });
  });

  it('logs and renders generic error when data fetch fails', async () => {
    EnterpriseDataApiService.fetchCompletedLearners.mockRejectedValue(new Error('Bad request'));

    render(<CompletedLearnersWrapper />);

    expect(await screen.findByText('Unable to load data')).toBeInTheDocument();
    expect(screen.getByText('Try refreshing your screen.')).toBeInTheDocument();
    expect(screen.queryByText('Bad request')).not.toBeInTheDocument();
    expect(logError).toHaveBeenCalled();
  });

  it('fetches next page when fetchData is called with pagination only (no sort)', async () => {
    render(<CompletedLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1 }),
      );
    });

    EnterpriseDataApiService.fetchCompletedLearners.mockClear();

    await act(async () => {
      capturedFetchData({ pageIndex: 1, sortBy: [] });
    });

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchCompletedLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 2 }),
      );
    });

    expect(sendEnterpriseTrackEvent).toHaveBeenCalledWith(
      enterpriseId,
      'edx.ui.enterprise.admin_portal.table.paginated',
      {
        tableId: 'completed-learners',
        page: 2,
      },
    );
  });
});
