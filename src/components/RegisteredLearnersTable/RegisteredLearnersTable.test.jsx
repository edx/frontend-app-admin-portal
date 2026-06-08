import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import '@testing-library/jest-dom/extend-expect';

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import RegisteredLearnersTable from '.';
import { accessibilitySettings } from '../../../tests/accessibility-settings';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';

jest.mock('../../data/services/EnterpriseDataApiService', () => ({
  __esModule: true,
  default: {
    fetchUnenrolledRegisteredLearners: jest.fn(),
  },
}));

const enterpriseId = 'test-enterprise';
const mockStore = configureMockStore([thunk]);
const store = mockStore({
  portalConfiguration: {
    enterpriseId,
  },
});

const RegisteredLearnersWrapper = props => (
  <MemoryRouter>
    <IntlProvider locale="en">
      <Provider store={store}>
        <RegisteredLearnersTable
          {...props}
        />
      </Provider>
    </IntlProvider>
  </MemoryRouter>
);

describe('RegisteredLearnersTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    EnterpriseDataApiService.fetchUnenrolledRegisteredLearners.mockResolvedValue({
      data: {
        count: 0,
        num_pages: 0,
        results: [],
      },
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<RegisteredLearnersWrapper />);

    await screen.findByText('There are no results.');
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state correctly', async () => {
    const { asFragment } = render(<RegisteredLearnersWrapper />);

    expect(await screen.findByText('There are no results.')).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
});
