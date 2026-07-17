import React from 'react';
import {
  render, screen,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import {
  MaxStarredModal, FeaturedContentSection,
} from '../FeaturedContentStarring';

const IntlWrapper = ({ children }) => (
  <IntlProvider locale="en">{children}</IntlProvider>
);

const renderWithIntl = (ui) => render(ui, { wrapper: IntlWrapper });

// MaxStarredModal Tests

describe('<MaxStarredModal />', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithIntl(<MaxStarredModal {...defaultProps} />);
    expect(screen.getByText('Unstar a selection to continue')).toBeInTheDocument();
    expect(screen.getByText(/Only 4 courses or programs can be featured/)).toBeInTheDocument();
  });

  it('renders close button', () => {
    renderWithIntl(<MaxStarredModal {...defaultProps} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderWithIntl(<MaxStarredModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render modal content when closed', () => {
    renderWithIntl(<MaxStarredModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByText(/Only 4 courses or programs/)).not.toBeInTheDocument();
  });
});

// FeaturedContentSection Tests

describe('<FeaturedContentSection />', () => {
  const defaultProps = {
    starredItems: [],
    loadingContentKey: null,
    onUnstar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section title and subtitle', () => {
    renderWithIntl(<FeaturedContentSection {...defaultProps} />);
    expect(screen.getByText('Featured courses and programs')).toBeInTheDocument();
    expect(screen.getByText(/Selected courses or programs will be displayed at the top/)).toBeInTheDocument();
  });

  it('renders empty state placeholder when no starred items', () => {
    renderWithIntl(<FeaturedContentSection {...defaultProps} />);
    expect(screen.getByText('Starred courses will appear here')).toBeInTheDocument();
  });

  it('renders starred items in the table', () => {
    const starredItems = [
      {
        uuid: 'content-1',
        title: 'Course Alpha',
        contentKey: 'edX+Course1',
        authoringOrganizations: [{ uuid: 'org-1', name: 'OrgA', logoImageUrl: 'https://example.com/logo.png' }],
      },
      {
        uuid: 'content-3',
        title: 'Course Gamma',
        contentKey: 'edX+Course3',
        authoringOrganizations: [{ uuid: 'org-3', name: 'OrgC' }],
      },
    ];
    renderWithIntl(<FeaturedContentSection {...defaultProps} starredItems={starredItems} />);
    expect(screen.getByText('Course Alpha')).toBeInTheDocument();
    expect(screen.getByText('Course Gamma')).toBeInTheDocument();
    expect(screen.getByText('OrgA')).toBeInTheDocument();
    expect(screen.getByText('OrgC')).toBeInTheDocument();
  });

  it('renders partner logos when available', () => {
    const starredItems = [
      {
        uuid: 'content-1',
        title: 'Course Alpha',
        contentKey: 'edX+Course1',
        authoringOrganizations: [{ uuid: 'org-1', name: 'OrgA', logoImageUrl: 'https://example.com/logo.png' }],
      },
    ];
    renderWithIntl(<FeaturedContentSection {...defaultProps} starredItems={starredItems} />);
    const logo = screen.getByAltText('OrgA');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('shows loading row when loadingContentKey is provided', () => {
    renderWithIntl(
      <FeaturedContentSection {...defaultProps} loadingContentKey="edX+Course2" />,
    );
    expect(screen.getByTestId('featured-loading-row')).toBeInTheDocument();
    expect(screen.getByText('Loading your selection')).toBeInTheDocument();
  });

  it('calls onUnstar when star icon in row is clicked', async () => {
    const onUnstar = jest.fn();
    const user = userEvent.setup();
    const starredItems = [
      {
        uuid: 'content-1',
        title: 'Course Alpha',
        contentKey: 'edX+Course1',
        authoringOrganizations: [{ uuid: 'org-1', name: 'OrgA' }],
      },
    ];
    renderWithIntl(
      <FeaturedContentSection {...defaultProps} starredItems={starredItems} onUnstar={onUnstar} />,
    );
    const unstarBtn = screen.getByLabelText('Unstar Course Alpha');
    await user.click(unstarBtn);
    expect(onUnstar).toHaveBeenCalledWith('edX+Course1');
  });

  it('renders column headers', () => {
    const starredItems = [
      {
        uuid: 'content-1',
        title: 'Course Alpha',
        contentKey: 'edX+Course1',
        authoringOrganizations: [{ uuid: 'org-1', name: 'OrgA' }],
      },
    ];
    renderWithIntl(<FeaturedContentSection {...defaultProps} starredItems={starredItems} />);
    expect(screen.getByText('Course Title')).toBeInTheDocument();
    expect(screen.getByText('Educational Partner')).toBeInTheDocument();
  });

  it('renders section with correct test id', () => {
    renderWithIntl(<FeaturedContentSection {...defaultProps} />);
    expect(screen.getByTestId('featured-courses-section')).toBeInTheDocument();
  });
});
