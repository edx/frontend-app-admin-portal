import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { axe } from 'jest-axe';

import NonProductionBanner from '.';
import {
  getNonProductionBannerDismissalStorageKey,
  NON_PRODUCTION_BANNER_DISMISSAL_DURATION_MS,
} from './constants';
import { accessibilitySettings } from '../../../tests/accessibility-settings';

const TEST_ENTERPRISE_ID = 'e783bb19-277f-4dad-9b11-9d2ac6a53f37';
const BANNER_TEXT = 'Non-Production Environment';
const ONE_DAY_MS = NON_PRODUCTION_BANNER_DISMISSAL_DURATION_MS;
const storageKey = getNonProductionBannerDismissalStorageKey(TEST_ENTERPRISE_ID);

const renderBanner = (props = {}) => render(
  <IntlProvider locale="en">
    <NonProductionBanner
      enterpriseId={TEST_ENTERPRISE_ID}
      showNonProductionBanner
      {...props}
    />
  </IntlProvider>,
);

describe('<NonProductionBanner />', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderBanner();
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders when showNonProductionBanner is true', () => {
    renderBanner();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(BANNER_TEXT)).toBeInTheDocument();
  });

  it('does not render when showNonProductionBanner is false', () => {
    renderBanner({ showNonProductionBanner: false });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides the banner and records the dismissal when dismissed', async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(global.localStorage.getItem(storageKey)).not.toBeNull();
  });

  it('stays hidden when it was dismissed less than 24 hours ago', () => {
    global.localStorage.setItem(storageKey, String(Date.now() - (ONE_DAY_MS - 1000)));
    renderBanner();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reappears when it was dismissed more than 24 hours ago', () => {
    global.localStorage.setItem(storageKey, String(Date.now() - (ONE_DAY_MS + 1000)));
    renderBanner();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('ignores a dismissal recorded for a different enterprise customer', () => {
    global.localStorage.setItem(
      getNonProductionBannerDismissalStorageKey('some-other-enterprise-id'),
      String(Date.now()),
    );
    renderBanner();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders when the stored dismissal timestamp is not parseable', () => {
    global.localStorage.setItem(storageKey, 'not-a-timestamp');
    renderBanner();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
