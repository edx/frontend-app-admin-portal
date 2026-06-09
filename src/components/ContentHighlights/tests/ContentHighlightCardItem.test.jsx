import { screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import thunk from 'redux-thunk';
import { camelCaseObject } from '@edx/frontend-platform';
import { renderWithRouter } from '@2uinc/frontend-enterprise-utils';

import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import ContentHighlightCardItem from '../ContentHighlightCardItem';
import { TEST_COURSE_HIGHLIGHTS_DATA } from '../data/constants';
import { generateAboutPageUrl } from '../data/utils';
import { features } from '../../../config';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

const mockStore = configureMockStore([thunk]);

const testHighlightedContent = camelCaseObject(TEST_COURSE_HIGHLIGHTS_DATA)[0]?.highlightedContent[0];

const initialState = {
  portalConfiguration: {
    enterpriseSlug: 'test-enterprise',
  },
};

const ContentHighlightCardItemContainerWrapper = (props) => (
  <IntlProvider locale="en">
    <Provider store={mockStore(initialState)}>
      <ContentHighlightCardItem {...props} />
    </Provider>
  </IntlProvider>
);

describe('<ContentHighlightCardItem>', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithRouter(
      <ContentHighlightCardItemContainerWrapper
        isLoading={false}
        title={testHighlightedContent.title}
        contentType={testHighlightedContent.contentType.toLowerCase()}
        partners={testHighlightedContent.authoringOrganizations}
      />,
    );
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('Does not render a hyperlink if href is not specified', () => {
    renderWithRouter(<ContentHighlightCardItemContainerWrapper
      isLoading={false}
      title={testHighlightedContent.title}
      contentType={testHighlightedContent.contentType.toLowerCase()}
      partners={testHighlightedContent.authoringOrganizations}
    />);
    expect(screen.queryByTestId('hyperlink-title')).not.toBeInTheDocument();
  });
  it('Sets title as hyperlink when href populated', async () => {
    const user = userEvent.setup();
    const trackClickEvent = jest.fn();
    renderWithRouter(<ContentHighlightCardItemContainerWrapper
      isLoading={false}
      title={testHighlightedContent.title}
      contentType={testHighlightedContent.contentType.toLowerCase()}
      partners={testHighlightedContent.authoringOrganizations}
      hyperlinkAttrs={
        {
          href: generateAboutPageUrl({
            enterpriseSlug: initialState.portalConfiguration.enterpriseSlug,
            contentType: testHighlightedContent.contentType.toLowerCase(),
            contentKey: testHighlightedContent.contentKey,
          }),
          target: '_blank',
          onClick: () => trackClickEvent(),
        }
      }

    />);
    const hyperlink = screen.getByTestId('hyperlink-title');
    expect(hyperlink).toBeInTheDocument();
    expect(hyperlink.href).toContain(`${initialState.portalConfiguration.enterpriseSlug}/${testHighlightedContent.contentType.toLowerCase()}/${testHighlightedContent.contentKey}`);
    await user.click(hyperlink);
    expect(trackClickEvent).toHaveBeenCalled();
  });
  it('Adds archived subtitle when appropriate', () => {
    features.FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING = true;
    renderWithRouter(<ContentHighlightCardItemContainerWrapper
      isLoading={false}
      title={testHighlightedContent.title}
      contentType={testHighlightedContent.contentType.toLowerCase()}
      partners={testHighlightedContent.authoringOrganizations}
      archived
    />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('renders StarButton and wrapper when editHighlightsEnabled is true', async () => {
    const user = userEvent.setup();
    const onToggleStar = jest.fn();

    renderWithRouter(<ContentHighlightCardItemContainerWrapper
      isLoading={false}
      uuid={testHighlightedContent.uuid}
      editHighlightsEnabled
      isStarred={false}
      onToggleStar={onToggleStar}
      title={testHighlightedContent.title}
      contentType={testHighlightedContent.contentType.toLowerCase()}
      partners={testHighlightedContent.authoringOrganizations}
    />);

    expect(screen.getByTestId(`card-wrapper-${testHighlightedContent.uuid}`)).toBeInTheDocument();
    const starButton = screen.getByTestId(`star-btn-${testHighlightedContent.uuid}`);
    expect(starButton).toBeInTheDocument();

    await user.click(starButton);
    expect(onToggleStar).toHaveBeenCalledTimes(1);
  });

  it('does not render StarButton when editHighlightsEnabled is false', () => {
    renderWithRouter(<ContentHighlightCardItemContainerWrapper
      isLoading={false}
      uuid={testHighlightedContent.uuid}
      editHighlightsEnabled={false}
      title={testHighlightedContent.title}
      contentType={testHighlightedContent.contentType.toLowerCase()}
      partners={testHighlightedContent.authoringOrganizations}
    />);

    expect(screen.queryByTestId(`star-btn-${testHighlightedContent.uuid}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`card-wrapper-${testHighlightedContent.uuid}`)).not.toBeInTheDocument();
  });
});
