/* eslint-disable react/prop-types */
import { renderWithRouter } from '@2uinc/frontend-enterprise-utils';
import { screen, waitFor } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { axe } from 'jest-axe';
import EnterpriseList from './index';
import mockEnterpriseList from './EnterpriseList.mocks';
import { accessibilitySettings } from '../../../tests/accessibility-settings';

const originalGetComputedStyle = window.getComputedStyle;
const enterpriseListAccessibilitySettings = {
  ...accessibilitySettings,
  rules: {
    ...accessibilitySettings.rules,
    // Paragon DataTable renders a pagination landmark that shares the same
    // label as another landmark in this jsdom test environment.
    'landmark-unique': { enabled: false },
  },
};

jest.mock('../../data/services/LmsApiService', () => ({
  fetchEnterpriseList: () => Promise.resolve({
    data: mockEnterpriseList,
  }),
}));

const EnterpriseListWrapper = () => (
  <IntlProvider locale="en">
    <EnterpriseList clearPortalConfiguration={() => { }} />
  </IntlProvider>
);

describe('EnterpriseList', () => {
  beforeAll(() => {
    const getComputedStyleWithoutPseudoElement = (element) => originalGetComputedStyle.call(window, element);
    window.getComputedStyle = getComputedStyleWithoutPseudoElement;
    global.getComputedStyle = getComputedStyleWithoutPseudoElement;
  });

  afterAll(() => {
    window.getComputedStyle = originalGetComputedStyle;
    global.getComputedStyle = originalGetComputedStyle;
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithRouter(<EnterpriseListWrapper />);
    await waitFor(() => expect(screen.getByText('Enterprise 1')).toBeTruthy());
    const results = await axe(container, enterpriseListAccessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders the EnterpriseList', () => {
    renderWithRouter(<EnterpriseListWrapper />);
    expect(screen.getByText('loading')).toBeTruthy();
  });
  it('renders the datatable with data', async () => {
    renderWithRouter(<EnterpriseListWrapper />);
    expect(screen.getByText('loading')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Enterprise 1')).toBeTruthy());
  });
});
