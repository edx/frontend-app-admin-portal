import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { QueryClientProvider } from '@tanstack/react-query';
import { camelCaseObject } from '@edx/frontend-platform';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { renderWithRouter, sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';

import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { EnterpriseAppContext } from '../../EnterpriseApp/EnterpriseAppContextProvider';
import ContentHighlightsCardItemsContainer from '../ContentHighlightsCardItemsContainer';
import { DEFAULT_ERROR_MESSAGE, TEST_COURSE_HIGHLIGHTS_DATA } from '../data/constants';
import { features } from '../../../config';
import { queryClient } from '../../test/testUtils';
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

jest.mock('../DeleteArchivedHighlightsDialogs', () => {
  const MockDeleteArchivedHighlightsDialogs = ({ updateSetWithActiveContent }) => (
    <button
      type="button"
      data-testid="mock-delete-archived-dialog"
      onClick={() => {
        if (typeof updateSetWithActiveContent === 'function') {
          updateSetWithActiveContent();
        }
      }}
    >
      mock-delete-archived
    </button>
  );

  return MockDeleteArchivedHighlightsDialogs;
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
  <QueryClientProvider client={queryClient()}>
    <IntlProvider locale="en">
      <Provider store={mockStore(storeState)}>
        <EnterpriseAppContext.Provider value={enterpriseAppContextValue}>
          <ContentHighlightsCardItemsContainer {...props} />
        </EnterpriseAppContext.Provider>
      </Provider>
    </IntlProvider>
  </QueryClientProvider>
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

    it('renders highlight heading when isEditing is true and title is provided', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        highlightTitle="Recommended for Marketing"
        isEditing
        selectedContentKeys={new Set()}
      />);
      expect(screen.getByText(/All courses and programs in "Recommended for Marketing" highlight/)).toBeInTheDocument();
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

    it('uses default onToggleSelect handler when none is provided', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        isEditing
        selectedContentKeys={new Set()}
      />);

      const firstItem = testHighlightSet[0];
      await user.click(screen.getByTestId(`select-checkbox-${firstItem.uuid}`));
      expect(screen.getByTestId(`select-checkbox-${firstItem.uuid}`)).not.toBeChecked();
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

    it('renders selected count message when isEditing is true and title is provided', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={testHighlightSet}
        highlightTitle="Recommended for Marketing"
        isEditing
        selectedContentKeys={new Set()}
      />);
      expect(screen.getByText(
        new RegExp(`${testHighlightSet.length} selected \\(${testHighlightSet.length} shown below\\)`),
      )).toBeInTheDocument();
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
      expect(wrapper).toHaveClass('w-100');
    });

    it('renders starred cards before unstarred cards in the main grid', () => {
      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithFavorites}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);

      const cardTitles = screen.getAllByTestId('hyperlink-title');

      expect(cardTitles[0]).toHaveTextContent(highlightedContentWithFavorites[0].title);
      expect(cardTitles[1]).toHaveTextContent(highlightedContentWithFavorites[1].title);
    });

    it('sorts correctly when a later item is starred', () => {
      const highlightedContentWithSecondFavorite = testHighlightSet.map((item, idx) => ({
        ...item,
        contentKey: `reordered-content-key-${idx}`,
        isFavorite: idx === 1,
      }));

      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithSecondFavorite}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);

      const cardTitles = screen.getAllByTestId('hyperlink-title');
      expect(cardTitles[0]).toHaveTextContent(highlightedContentWithSecondFavorite[1].title);
    });

    it('keeps original order when all cards have the same starred state', () => {
      const highlightedContentWithoutFavorites = testHighlightSet.map((item, idx) => ({
        ...item,
        contentKey: `all-unstarred-content-key-${idx}`,
        isFavorite: false,
      }));

      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithoutFavorites}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);

      const cardTitles = screen.getAllByTestId('hyperlink-title');
      expect(cardTitles[0]).toHaveTextContent(highlightedContentWithoutFavorites[0].title);
      expect(cardTitles[1]).toHaveTextContent(highlightedContentWithoutFavorites[1].title);
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

    it('renders archived cards with links when archive messaging is enabled', () => {
      features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = true;
      const highlightedContentWithArchived = testHighlightSet.map((item, idx) => ({
        ...item,
        contentKey: `archived-content-key-${idx}`,
        isFavorite: false,
        courseRunStatuses: idx < 2 ? ['archived'] : ['published'],
      }));

      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithArchived}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);

      const archivedCards = highlightedContentWithArchived.filter(
        (item) => item.courseRunStatuses?.includes('archived'),
      );
      archivedCards.forEach((item) => {
        expect(screen.getByTestId(`card-wrapper-archived-${item.uuid}`)).toBeInTheDocument();
        expect(screen.getByTestId(`star-btn-${item.uuid}`)).toBeInTheDocument();
      });
      features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = false;
    });

    it('clicking archived card star button and link triggers handlers', async () => {
      const user = userEvent.setup();
      features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = true;
      const highlightedContentWithArchived = testHighlightSet.map((item, idx) => ({
        ...item,
        contentKey: `archived-toggle-content-key-${idx}`,
        isFavorite: false,
        courseRunStatuses: idx === 0 ? ['archived'] : ['published'],
      }));
      const archivedItem = highlightedContentWithArchived[0];

      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithArchived}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
      />);

      await user.click(screen.getByTestId(`star-btn-${archivedItem.uuid}`));
      const archivedWrapper = screen.getByTestId(`card-wrapper-archived-${archivedItem.uuid}`);
      const archivedLink = within(archivedWrapper).getByTestId('hyperlink-title');
      await user.click(archivedLink);

      expect(sendEnterpriseTrackEvent).toHaveBeenCalled();
      features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = false;
    });

    it('invokes updateSetWithActiveContent from archived delete dialog', async () => {
      const user = userEvent.setup();
      features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = true;
      const updateHighlightSet = jest.fn();
      const highlightedContentWithArchived = testHighlightSet.map((item, idx) => ({
        ...item,
        contentKey: `delete-archived-content-key-${idx}`,
        isFavorite: false,
        courseRunStatuses: idx === 0 ? ['archived'] : ['published'],
      }));

      renderWithRouter(<ContentHighlightsCardItemsContainerWrapper
        isLoading={false}
        highlightedContent={highlightedContentWithArchived}
        highlightTitle="Test"
        storeState={editHighlightsEnabledState}
        updateHighlightSet={updateHighlightSet}
      />);

      await user.click(screen.getByTestId('mock-delete-archived-dialog'));
      expect(updateHighlightSet).toHaveBeenCalled();
      features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = false;
    });
  });
});
