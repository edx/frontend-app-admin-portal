import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { axe } from 'jest-axe';

import EnrolledLearnersTable from '.';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';
import { accessibilitySettings } from '../../../tests/accessibility-settings';

const mockStore = configureMockStore([thunk]);
const enterpriseId = 'test-enterprise';
const store = mockStore({
  portalConfiguration: {
    enterpriseId,
  },
});

const EnrolledLearnersWrapper = props => (
  <MemoryRouter>
    <IntlProvider locale="en">
      <Provider store={store}>
        <EnrolledLearnersTable
          {...props}
        />
      </Provider>
    </IntlProvider>
  </MemoryRouter>
);

describe('EnrolledLearnersTable', () => {
  beforeEach(() => {
    jest.spyOn(EnterpriseDataApiService, 'fetchEnrolledLearners').mockResolvedValue({
      data: {
        results: [],
        count: 0,
        num_pages: 1,
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<EnrolledLearnersWrapper />);
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state correctly', async () => {
    render(<EnrolledLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalled();
    });
    expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledWith(
      enterpriseId,
      expect.objectContaining({ page: 1, page_size: 50 }),
    );

    expect(await screen.findByText('There are no results.')).toBeInTheDocument();
  });

  it('sends ordering when sorting by a column', async () => {
    render(<EnrolledLearnersWrapper />);

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalledTimes(1);
    });

    await userEvent.click(screen.getByText('Email'));

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenLastCalledWith(
        enterpriseId,
        expect.objectContaining({ ordering: 'user_email' }),
      );
    });
  });

  it('renders an error state when the API request fails', async () => {
    const errorMessage = 'API is unavailable';
    EnterpriseDataApiService.fetchEnrolledLearners.mockRejectedValueOnce(new Error(errorMessage));

    render(<EnrolledLearnersWrapper />);

    expect(await screen.findByText('Unable to load data')).toBeInTheDocument();
    expect(screen.getByText(`Try refreshing your screen ${errorMessage}`)).toBeInTheDocument();
  });
});
