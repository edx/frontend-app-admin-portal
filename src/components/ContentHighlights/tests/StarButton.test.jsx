import React from 'react';
import {
  render, screen, fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import StarButton from '../StarButton';

const IntlWrapper = ({ children }) => (
  <IntlProvider locale="en">{children}</IntlProvider>
);

const renderWithIntl = (ui) => render(ui, { wrapper: IntlWrapper });

describe('<StarButton />', () => {
  const defaultProps = {
    title: 'Test Course',
    uuid: 'test-course-uuid',
    isStarred: false,
    onToggleStar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct aria-label when unstarred', () => {
    renderWithIntl(<StarButton {...defaultProps} />);
    expect(screen.getByLabelText('Star Test Course')).toBeInTheDocument();
  });

  it('renders with correct aria-label when starred', () => {
    renderWithIntl(<StarButton {...defaultProps} isStarred />);
    expect(screen.getByLabelText('Unstar Test Course')).toBeInTheDocument();
  });

  it('renders with correct test id', () => {
    renderWithIntl(<StarButton {...defaultProps} />);
    expect(screen.getByTestId('star-btn-test-course-uuid')).toBeInTheDocument();
  });

  it('calls onToggleStar when clicked', async () => {
    const onToggleStar = jest.fn();
    const user = userEvent.setup();
    renderWithIntl(<StarButton {...defaultProps} onToggleStar={onToggleStar} />);
    await user.click(screen.getByTestId('star-btn-test-course-uuid'));
    expect(onToggleStar).toHaveBeenCalledTimes(1);
  });

  it('prevents default and stops propagation on click', () => {
    const onToggleStar = jest.fn();
    renderWithIntl(<StarButton {...defaultProps} onToggleStar={onToggleStar} />);
    const btn = screen.getByTestId('star-btn-test-course-uuid');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });
    Object.defineProperty(event, 'stopPropagation', { value: stopPropagation });
    fireEvent(btn, event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onToggleStar).toHaveBeenCalled();
  });

  it('has star-btn class', () => {
    renderWithIntl(<StarButton {...defaultProps} />);
    expect(screen.getByTestId('star-btn-test-course-uuid')).toHaveClass('star-btn');
  });
});
