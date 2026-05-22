import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { camelCaseObject } from '@edx/frontend-platform';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { renderWithRouter, sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';

import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { EnterpriseAppContext } from '../../EnterpriseApp/EnterpriseAppContextProvider';
import ContentHighlightsCardItemsContainer from '../ContentHighlightsCardItemsContainer';
import { DEFAULT_ERROR_MESSAGE, TEST_COURSE_HIGHLIGHTS_DATA } from '../data/constants';
import { features } from '../../../config';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

const mockStore = configureMockStore([thunk]);

jest.mock('../../../data/services/EnterpriseCatalogApiService', () => ({
  __esModule: true,
  default: {
    toggleFavoriteHighlight: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ highlightSetUUID: 'test-highlight-uuid' }),
}));

jest.mock('@2uinc/frontend-enterprise-utils', () => {
  const originalModule = jest.requireActual('@2uinc/frontend-enterprise-utils');
  return ({
    ...originalModule,
    sendEnterpriseTrackEvent: jest.fn(),
  });
});

const mockDispatchFn = jest.fn();
const initialEnterpriseAppContextValue = {
  enterpriseCuration: {
    dispatch: mockDispatchFn,
  },
};

const testHighlightSet = camelCaseObject(TEST_COURSE_HIGHLIGHTS_DATA)[0]?.highlightedContent;
const initialState = {
  portalConfiguration: {
    enterpriseSlug: 'test-enterprise',
    enterpriseId: 'test-enterprise-id',
    enterpriseFeatures: {},
  },
};

const editHighlightsEnabledState = {
  portalConfiguration: {
    enterpriseSlug: 'test-enterprise',
    enterpriseId: 'test-enterprise-id',
    enterpriseFeatures: {
      enterpriseEditHighlightsEnabled: true,
    },
  },
};

const ContentHighlightsCardItemsContainerWrapper = ({
  enterpriseAppContextValue = initialEnterpriseAppContextValue,
  storeState = initialState,
  ...props
}) => (
  <IntlProvider locale="en">
    <Provider store={mockStore(storeState)}>
      <EnterpriseAppContext.Provider value={enterpriseAppContextValue}>
        <ContentHighlightsCardItemsContainer {...props} />
      </EnterpriseAppContext.Provider>
    </Provider>
  </IntlProvider>
);

describe('<ContentHighlightsCardItemsContainer>', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithRouter(<ContentHighlightsCardItemsContainerWrapper />);
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('Displays all content data titles', () => {
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
      isLoading={false}
      highlightedContent={testHighlightSet}
    />);
    const firstTitle = testHighlightSet[0].title;
    const lastTitle = testHighlightSet[testHighlightSet.length - 1].title;
    expect(screen.getByText(firstTitle)).toBeInTheDocument();
    expect(screen.getByText(lastTitle)).toBeInTheDocument();
  });

  it('Displays all content data content types', () => {
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
      isLoading={false}
      highlightedContent={testHighlightSet}
    />);
    const firstContentType = testHighlightSet[0].contentType;
    const lastContentType = testHighlightSet[testHighlightSet.length - 1].contentType;
    expect(screen.getByText(firstContentType)).toBeInTheDocument();
    expect(screen.getByText(lastContentType)).toBeInTheDocument();
  });

  it('Displays multiple organizations', () => {
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
      isLoading={false}
      highlightedContent={testHighlightSet}
    />);
    const firstContentType = testHighlightSet[0]
      .authoringOrganizations[0].name;
    const lastContentType = testHighlightSet[0]
      .authoringOrganizations[testHighlightSet[0].authoringOrganizations.length - 1].name;
    expect(screen.getByText(firstContentType, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(lastContentType, { exact: false })).toBeInTheDocument();
  });
  it('Displays nothing when highlightedContents length equals 0', () => {
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
      isLoading={false}
      highlightedContent={[]}
    />);
    expect(screen.getByTestId('empty-highlighted-content')).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_ERROR_MESSAGE.EMPTY_HIGHLIGHT_SET)).toBeInTheDocument();
  });
  it('Displays Skeleton on load', () => {
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
      isLoading
      highlightedContent={testHighlightSet}
    />);
    expect(screen.getAllByTestId('card-item-skeleton')).toBeTruthy();
  });
  it('sends track event on click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
      isLoading={false}
      highlightedContent={testHighlightSet}
    />);
    const hyperlinkTitle = screen.getAllByTestId('hyperlink-title')[0];
    await user.click(hyperlinkTitle);
    expect(sendEnterpriseTrackEvent).toHaveBeenCalledTimes(1);
  });
  it('shows archived content subheader', () => {
    features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = true;
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
      isLoading={false}
      highlightedContent={testHighlightSet}
    />);
    expect(screen.getByText('Delete archived courses')).toBeInTheDocument();
  });
  it('does not show archived content subheader', () => {
    features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = false;
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
      isLoading={false}
      highlightedContent={testHighlightSet}
    />);
    expect(screen.queryByText('Delete archived courses')).not.toBeInTheDocument();
  });

  describe('edit mode', () => {
    it('renders card grid with checkboxes when isEditing is true', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        isEditing
        selectedContentKeys={new Set()}
      />);
      expect(screen.getByTestId('edit-mode-card-grid')).toBeInTheDocument();
      testHighlightSet.forEach((item) => {
        expect(screen.getByTestId(`select-checkbox-${item.uuid}`)).toBeInTheDocument();
      });
    });

    it('calls onToggleSelect with contentKey when checkbox is clicked', async () => {
      const onToggleSelect = jest.fn();
      const user = userEvent.setup();
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        isEditing
        selectedContentKeys={new Set()}
        onToggleSelect={onToggleSelect}
      />);
      const firstItem = testHighlightSet[0];
      await user.click(screen.getByTestId(`select-checkbox-${firstItem.uuid}`));
      expect(onToggleSelect).toHaveBeenCalledWith(firstItem.contentKey);
    });

    it('checkbox is checked when item is in selectedContentKeys', () => {
      const firstItem = testHighlightSet[0];
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        isEditing
        selectedContentKeys={new Set([firstItem.contentKey])}
      />);
      expect(screen.getByTestId(`select-checkbox-${firstItem.uuid}`)).toBeChecked();
    });

    it('checkbox is unchecked when item is not in selectedContentKeys', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        isEditing
        selectedContentKeys={new Set()}
      />);
      const firstItem = testHighlightSet[0];
      expect(screen.getByTestId(`select-checkbox-${firstItem.uuid}`)).not.toBeChecked();
    });

    it('does not render edit mode card grid when isEditing is false', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        isEditing={false}
      />);
      expect(screen.queryByTestId('edit-mode-card-grid')).not.toBeInTheDocument();
    });
  });

  describe('editHighlightsEnabled mode', () => {
    const highlightedContentWithFavorites = testHighlightSet.map((item, idx) => ({
      ...item,
      contentKey: `test-content-key-${idx}`, // ensure unique contentKeys across all items
      isFavorite: idx === 0,
    }));

    it('renders FeaturedContentSection when editHighlightsEnabled is true', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithFavorites}
        highlightTitle="Test Highlight"
        storeState={editHighlightsEnabledState}
      />);
      expect(screen.getByTestId('featured-courses-section')).toBeInTheDocument();
      expect(screen.getByText('Featured courses and programs')).toBeInTheDocument();
    });

    it('does not render FeaturedContentSection when editHighlightsEnabled is false', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        highlightTitle="Test Highlight"
        storeState={initialState}
      />);
      expect(screen.queryByTestId('featured-courses-section')).not.toBeInTheDocument();
    });

    it('renders highlight title heading when editHighlightsEnabled is true', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithFavorites}
        highlightTitle="Recommended for Marketing"
        storeState={editHighlightsEnabledState}
      />);
      expect(screen.getByText(/All courses and programs in "Recommended for Marketing" highlight/)).toBeInTheDocument();
    });

    it('does not render highlight title heading when editHighlightsEnabled is false', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        highlightTitle="Recommended for Marketing"
        storeState={initialState}
      />);
      expect(screen.queryByText(/All courses and programs in/)).not.toBeInTheDocument();
    });

    it('renders StarButton for each active card when editHighlightsEnabled is true', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithFavorites}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);
      highlightedContentWithFavorites.forEach((item) => {
        expect(screen.getByTestId(`star-btn-${item.uuid}`)).toBeInTheDocument();
      });
    });

    it('renders card wrappers with position-relative and overflow visible', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithFavorites}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);
      const firstItem = highlightedContentWithFavorites[0];
      const wrapper = screen.getByTestId(`card-wrapper-${firstItem.uuid}`);
      expect(wrapper).toHaveClass('position-relative');
      expect(wrapper).toHaveStyle({ overflow: 'visible' });
    });

    it('starred item appears in featured section', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithFavorites}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);
      // First item is starred (isFavorite: true), should appear in featured section
      const firstTitle = highlightedContentWithFavorites[0].title;
      const featuredSection = screen.getByTestId('featured-courses-section');
      expect(featuredSection).toHaveTextContent(firstTitle);
    });

    it('clicking star button on unstarred item toggles starred state', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithFavorites}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);
      // Second item is not starred
      const secondItem = highlightedContentWithFavorites[1];
      const starBtn = screen.getByTestId(`star-btn-${secondItem.uuid}`);
      await user.click(starBtn);
      // After API resolves, loadingContentKey clears and the item shows in featured section
      const featuredSection = screen.getByTestId('featured-courses-section');
      await waitFor(() => expect(featuredSection).toHaveTextContent(secondItem.title));
    });

    it('renders StarButton for each archived card when editHighlightsEnabled is true', () => {
      features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = true;
      // First item in testHighlightSet has course_run_statuses: [archived]
      const archivedItem = highlightedContentWithFavorites.find(
        (item) => item.courseRunStatuses?.includes('archived'),
      );
      if (!archivedItem) { return; } // skip if no archived content in test data
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithFavorites}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);
      expect(screen.getByTestId(`card-wrapper-archived-${archivedItem.uuid}`)).toBeInTheDocument();
      expect(screen.getByTestId(`star-btn-${archivedItem.uuid}`)).toBeInTheDocument();
      features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = false;
    });
  });
});
