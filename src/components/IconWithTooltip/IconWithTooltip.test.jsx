import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import IconWithTooltip from './index';
import useWindowSize from '../../hooks/useWindowSize';

jest.mock('./../../hooks/useWindowSize');

const defaultAltText = 'infoooo';
const defaultTooltipText = 'Tooool';
const DEFAULT_PROPS = {
  icon: faInfoCircle,
  altText: defaultAltText,
  tooltipText: defaultTooltipText,
};

describe('<IconWithTooltip />', () => {
  it('renders the icon passed to it with alt text', () => {
    useWindowSize.mockReturnValue({ width: 800 });
    const { container } = render(<IconWithTooltip {...DEFAULT_PROPS} />);
    expect(container.querySelector(`[data-icon=${faInfoCircle.iconName}]`)).toBeTruthy();
  });
  [
    { windowSize: 800, expectedLocation: 'right' },
    { windowSize: 700, expectedLocation: 'top' },
  ].forEach((data) => {
    it(`renders the tooltip on the ${data.expectedLocation} for ${data.windowSize}px screen`, () => {
      useWindowSize.mockReturnValue({ width: data.windowSize });
      const { container } = render(<IconWithTooltip {...DEFAULT_PROPS} />);
      const icon = container.querySelector(`[data-icon=${faInfoCircle.iconName}]`);
      expect(icon).toBeTruthy();

      act(async () => {
        await userEvent.hover(icon);
        expect(screen.findByText(defaultTooltipText)).toBeTruthy();
        expect(screen.findByTestId(`tooltip-${data.expectedLocation}`)).toBeTruthy();
      });
    });
  });
});
