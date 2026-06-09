import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
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

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchEnrolledLearners).toHaveBeenCalled();
    });

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

    expect(screen.getByText('There are no results.')).toBeInTheDocument();
  });
});
