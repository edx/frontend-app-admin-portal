import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe } from 'jest-axe';
import CheckpointOverlay from '../CheckpointOverlay';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

describe('CheckpointOverlay', () => {
  const mockIdTarget = 'test-target';
  const mockClassTarget = '.test-target';
  const mockFullIdTarget = '#test-target';
  const mockNthChildTarget = '.container .nav-item:nth-child(-n+3)';
  const mockRect = {
    top: 100,
    left: 200,
    width: 300,
    height: 400,
  };

  let mockTargetElement;
  let getBoundingClientRectSpy;

  beforeEach(() => {
    mockTargetElement = {
      getBoundingClientRect: jest.fn(() => mockRect),
    };
    document.querySelector = jest.fn(() => mockTargetElement);
    document.querySelectorAll = jest.fn(() => [mockTargetElement]);
    getBoundingClientRectSpy = jest.spyOn(mockTargetElement, 'getBoundingClientRect');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CheckpointOverlay target={mockIdTarget} />);
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders nothing when target element is not found', () => {
    document.querySelector.mockReturnValueOnce(null);
    const { container } = render(<CheckpointOverlay target={mockIdTarget} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay with correct positioning when target element is found using ID', () => {
    render(<CheckpointOverlay target={mockIdTarget} />);
    expect(document.querySelector).toHaveBeenCalledWith('#test-target');

    const overlay = screen.getByTestId('checkpoint-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('pgn__checkpoint-overlay');
    expect(overlay).toHaveStyle({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1050,
      pointerEvents: 'none',
    });
  });

  it('renders overlay with correct positioning when target element is found using class selector', () => {
    render(<CheckpointOverlay target={mockClassTarget} />);
    expect(document.querySelector).toHaveBeenCalledWith('.test-target');

    const overlay = screen.getByTestId('checkpoint-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('pgn__checkpoint-overlay');
  });

  it('renders overlay with correct positioning when target element is found using full ID selector', () => {
    render(<CheckpointOverlay target={mockFullIdTarget} />);
    expect(document.querySelector).toHaveBeenCalledWith('#test-target');

    const overlay = screen.getByTestId('checkpoint-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('pgn__checkpoint-overlay');
  });

  it('handles nth-child selectors by using querySelectorAll and creating bounding box', () => {
    const mockElement1 = {
      getBoundingClientRect: jest.fn(() => ({
        top: 100,
        left: 200,
        width: 300,
        height: 400,
        bottom: 500,
        right: 500,
      })),
    };
    const mockElement2 = {
      getBoundingClientRect: jest.fn(() => ({
        top: 150,
        left: 250,
        width: 200,
        height: 300,
        bottom: 450,
        right: 450,
      })),
    };

    document.querySelectorAll.mockReturnValueOnce([mockElement1, mockElement2]);

    render(<CheckpointOverlay target={mockNthChildTarget} />);

    expect(document.querySelectorAll).toHaveBeenCalledWith('.container .nav-item:nth-child(-n+3)');

    const overlay = screen.getByTestId('checkpoint-overlay');
    expect(overlay).toBeInTheDocument();

    expect(mockElement1.getBoundingClientRect).toHaveBeenCalled();
    expect(mockElement2.getBoundingClientRect).toHaveBeenCalled();
  });

  it('updates position on scroll', () => {
    render(<CheckpointOverlay target={mockIdTarget} />);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(getBoundingClientRectSpy).toHaveBeenCalledTimes(2);
  });

  it('updates position on resize', () => {
    render(<CheckpointOverlay target={mockIdTarget} />);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(getBoundingClientRectSpy).toHaveBeenCalledTimes(2);
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<CheckpointOverlay target={mockIdTarget} />);
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('renders overlay sections with correct dimensions', () => {
    render(<CheckpointOverlay target={mockIdTarget} />);
    const overlay = screen.getByTestId('checkpoint-overlay');
    const sections = overlay.children;

    // Default spotlight padding (see SPOTLIGHT_PADDING in CheckpointOverlay)
    const pad = 10;

    // Check top section
    expect(sections[0]).toHaveStyle({
      position: 'absolute',
      top: '0px',
      left: '0px',
      right: '0px',
      height: `${mockRect.top - pad}px`,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    });

    // Check left section
    expect(sections[1]).toHaveStyle({
      position: 'absolute',
      top: `${mockRect.top - pad}px`,
      left: '0px',
      width: `${mockRect.left - pad}px`,
      height: `${mockRect.height + pad * 2}px`,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    });

    // Check right section
    expect(sections[2]).toHaveStyle({
      position: 'absolute',
      top: `${mockRect.top - pad}px`,
      left: `${mockRect.left + mockRect.width + pad}px`,
      right: '0px',
      height: `${mockRect.height + pad * 2}px`,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    });

    // Check bottom section
    expect(sections[3]).toHaveStyle({
      position: 'absolute',
      top: `${mockRect.top + mockRect.height + pad}px`,
      left: '0px',
      right: '0px',
      bottom: '0px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    });
  });

  it('caps the spotlight width to the left portion when widthRatio is set', () => {
    render(<CheckpointOverlay target={mockIdTarget} widthRatio={0.5} padding={0} />);
    const sections = screen.getByTestId('checkpoint-overlay').children;
    // right overlay begins at left + (width * 0.5)
    expect(sections[2]).toHaveStyle({ left: `${mockRect.left + mockRect.width * 0.5}px` });
  });

  it('treats widthRatio={0} as a real value (zero-width spotlight), not "unset"', () => {
    render(<CheckpointOverlay target={mockIdTarget} widthRatio={0} padding={0} />);
    const sections = screen.getByTestId('checkpoint-overlay').children;
    // right overlay begins at the target's left — the spotlight has no width
    expect(sections[2]).toHaveStyle({ left: `${mockRect.left}px` });
  });

  it('extends the spotlight top up to the topTarget element', () => {
    const topElement = {
      getBoundingClientRect: () => ({
        top: 40, left: 200, width: 300, height: 20,
      }),
    };
    document.querySelector = jest.fn((selector) => (selector === '#top-el' ? topElement : mockTargetElement));
    render(<CheckpointOverlay target={mockIdTarget} topTarget="#top-el" padding={0} />);
    const sections = screen.getByTestId('checkpoint-overlay').children;
    // top overlay shrinks so the spotlight reaches the topTarget's top (padding 0)
    expect(sections[0]).toHaveStyle({ height: '40px' });
  });
});
