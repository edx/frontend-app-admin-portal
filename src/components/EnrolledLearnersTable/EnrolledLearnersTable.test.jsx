import React from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { axe } from 'jest-axe';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import EnrolledLearnersTable from '.';
import { accessibilitySettings } from '../../../tests/accessibility-settings';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';

// Capture the fetchData callback passed to DataTable so pagination-only calls
// (sortBy: []) can be invoked directly, covering the branch in fetchData that
// the Paragon DataTable never reaches because it always passes a sortBy.
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

jest.mock('../../data/services/EnterpriseDataApiService', () => ({
  __esModule: true,
  default: {
    fetchEnrolledLearners: jest.fn(),
  },
}));

const mockStore = configureMockStore([thunk]);
const enterpriseId = 'test-enterprise';
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

const EnrolledLearnersWrapper = ({ initialEntries = ['/'], navigateTo, ...props }) => (
  <MemoryRouter initialEntries={initialEntries}>
    {navigateTo && <NavigationHelper to={navigateTo} />}
    <IntlProvider locale="en">
      <Provider store={store}>
        <EnrolledLearnersTable
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

describe('EnrolledLearnersTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedFetchData = undefined;
    EnterpriseDataApiService.fetchEnrolledLearners.mockResolvedValue({
      data: {
        results: [],
        count: 0,
        num_pages: 1,
      },
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<EnrolledLearnersWrapper />);

    await screen.findByText('There are no results.');
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state correctly', async () => {
    render(<EnrolledLearnersWrapper />);

    expect(await screen.findByText('There are no results.')).toBeInTheDocument();
  });

  it('uses default sort by user_email', async () => {
    render(<EnrolledLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        {
          page: 1,
          page_size: 50,
          ordering: 'user_email',
        },
      );
    });
  });

  it('fetches sorted data when sorting changes', async () => {
    EnterpriseDataApiService.fetchEnrolledLearners.mockResolvedValue({
      data: {
        count: 1,
        num_pages: 2,
        results: [
          {
            user_email: 'learner@example.com',
            lms_user_created: '2024-01-01T00:00:00Z',
            enrollment_count: 2,
          },
        ],
      },
    });

    render(<EnrolledLearnersWrapper />);

    await screen.findByText('learner@example.com');
    fireEvent.click(screen.getByRole('columnheader', { name: /Account Created/i }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({
          ordering: expect.stringMatching(/lms_user_created/),
        }),
      );
    });
  });

  it('updates to the next page when pagination changes', async () => {
    EnterpriseDataApiService.fetchEnrolledLearners.mockResolvedValue({
      data: {
        count: 60,
        num_pages: 2,
        results: [
          {
            user_email: 'learner@example.com',
            lms_user_created: '2024-01-01T00:00:00Z',
            enrollment_count: 2,
          },
        ],
      },
    });

    render(<EnrolledLearnersWrapper />);

    await screen.findByText('learner@example.com');
    fireEvent.click(screen.getByRole('button', { name: /Next, Page 2/i }));

    const pageStatusMatches = await screen.findAllByText('Showing 51 - 51 of 60.');
    expect(pageStatusMatches.length).toBeGreaterThan(0);
  });

  it('fetches using page and ordering from the URL', async () => {
    render(
      <EnrolledLearnersWrapper
        initialEntries={['/?page=3&ordering=-enrollment_count']}
      />,
    );

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        {
          page: 3,
          page_size: 50,
          ordering: '-enrollment_count',
        },
      );
    });
  });

  it('does not render empty state while loading', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchEnrolledLearners.mockReturnValue(deferred.promise);

    render(<EnrolledLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalled();
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
    EnterpriseDataApiService.fetchEnrolledLearners.mockRejectedValue(new Error('Bad request'));

    render(<EnrolledLearnersWrapper />);

    expect(await screen.findByText('Unable to load data')).toBeInTheDocument();
    expect(screen.getByText('Try refreshing your screen.')).toBeInTheDocument();
    expect(screen.queryByText('There are no results.')).not.toBeInTheDocument();
  });

  it('updates pageIndex when URL changes to a different page', async () => {
    render(<EnrolledLearnersWrapper navigateTo="/?page=3" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1 }),
      );
    });

    EnterpriseDataApiService.fetchEnrolledLearners.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 3 }),
      );
    });
  });

  it('updates ordering when URL changes to a different ordering', async () => {
    render(<EnrolledLearnersWrapper navigateTo="/?ordering=-enrollment_count" />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: 'user_email' }),
      );
    });

    EnterpriseDataApiService.fetchEnrolledLearners.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: '-enrollment_count' }),
      );
    });
  });

  it('ignores fetch response when component unmounts before fetch resolves', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchEnrolledLearners.mockReturnValue(deferred.promise);

    const { unmount } = render(<EnrolledLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalled();
    });

    unmount();

    // Resolving after unmount must not cause "state update on unmounted component" warnings
    await act(async () => {
      deferred.resolve({ data: { results: [], count: 0, num_pages: 1 } });
    });
  });

  it('ignores fetch error when component unmounts before fetch rejects', async () => {
    const deferred = createDeferred();
    EnterpriseDataApiService.fetchEnrolledLearners.mockReturnValue(deferred.promise);

    const { unmount } = render(<EnrolledLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalled();
    });

    unmount();

    // Rejecting after unmount must not cause "state update on unmounted component" warnings
    await act(async () => {
      deferred.reject(new Error('Network error'));
    });
  });

  it('fetches next page when fetchData is called with pagination only (no sort)', async () => {
    render(<EnrolledLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 1 }),
      );
    });

    EnterpriseDataApiService.fetchEnrolledLearners.mockClear();

    // Call fetchData directly with sortBy: [] to exercise the pagination branch
    // (the Paragon DataTable always passes the current sort, so this branch
    // is only reachable via direct invocation in tests)
    await act(async () => {
      capturedFetchData({ pageIndex: 1, sortBy: [] });
    });

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
        enterpriseId,
        expect.objectContaining({ page: 2 }),
      );
    });
  });
});
