import React from 'react';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { axe } from 'jest-axe';
import FloatingCollapsible from './index';
import { accessibilitySettings } from '../../../tests/accessibility-settings';

// Mock Paragon components
jest.mock('@openedx/paragon', () => {
  const OriginalModule = jest.requireActual('@openedx/paragon');
  return {
    ...OriginalModule,
    Icon: ({ src }) => {
      const IconComponent = src;
      return <IconComponent data-testid="icon" />;
    },
    ActionRow: ({ children }) => <div data-testid="action-row">{children}</div>,
    Button: ({
      children, variant, onClick, disabled,
    }) => (
      <button type="button" data-testid={`button-${variant}`} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
  };
});

// Mock Paragon icons
jest.mock('@openedx/paragon/icons', () => ({
  KeyboardArrowUp: () => <div data-testid="keyboard-arrow-up-icon" />,
  KeyboardArrowDown: () => <div data-testid="keyboard-arrow-down-icon" />,
}));

const mockStore = configureStore([]);
const defaultState = {
  portalConfiguration: {
    enterpriseBranding: {},
  },
  enterpriseCustomerAdmin: {
    onboardingTourDismissed: false,
    uuid: 'test-uuid',
  },
};

const setup = (props = {}) => {
  const store = mockStore(defaultState);

  const defaultProps = {
    title: 'Test Title',
    children: <div>Test Content</div>,
    onDismiss: jest.fn(),
  };

  const mergedProps = { ...defaultProps, ...props };

  return {
    store,
    props: mergedProps,
    ...render(
      <IntlProvider locale="en" messages={{}}>
        <Provider store={store}>
          <FloatingCollapsible {...mergedProps} />
        </Provider>
      </IntlProvider>,
    ),
  };
};

describe('FloatingCollapsible', () => {
  it('has no accessibility violations', async () => {
    const { container } = setup();
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders with the correct title', () => {
    setup();
    expect(screen.queryByText('Test Title')).toBeTruthy();
  });

  it('renders with the collapsible initially open', () => {
    setup();
    expect(screen.queryByText('Test Content')).toBeTruthy();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = jest.fn();
    setup({ onDismiss });

    fireEvent.click(screen.getByTestId('button-tertiary'));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('Test Content')).toBeFalsy();
    });
  });

  it('closes the collapsible when cancel button is clicked', async () => {
    setup();

    // Click cancel button to close collapsible
    fireEvent.click(screen.getByTestId('button-primary'));

    await waitFor(() => {
      expect(screen.queryByText('Test Content')).toBeFalsy();
    });
  });

  it('hides the dismiss button when hideDismissButton is true', () => {
    setup({ hideDismissButton: true });

    expect(screen.queryByTestId('button-tertiary')).toBeFalsy();
    expect(screen.queryByText('Test Content')).toBeTruthy();
  });

  it('has no accessibility violations when hideDismissButton is true', async () => {
    const { container } = setup({ hideDismissButton: true });
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders Dismiss and Close button text via i18n', () => {
    const translatedMessages = {
      'admin.portal.productTours.collapsible.dismiss': 'Translated Dismiss',
      'admin.portal.productTours.collapsible.close': 'Translated Close',
    };
    const store = mockStore(defaultState);
    render(
      <IntlProvider locale="en" messages={translatedMessages}>
        <Provider store={store}>
          <FloatingCollapsible title="Test" onDismiss={jest.fn()}>
            <div>Content</div>
          </FloatingCollapsible>
        </Provider>
      </IntlProvider>,
    );
    expect(screen.getByText('Translated Dismiss')).toBeTruthy();
    expect(screen.getByText('Translated Close')).toBeTruthy();
  });
});
