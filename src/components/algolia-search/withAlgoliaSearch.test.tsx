/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import configureMockStore, { MockStore } from 'redux-mock-store';
import { Provider } from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { AnyAction } from 'redux';
import { getAuthenticatedHttpClient, getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import algoliasearch from 'algoliasearch/lite';
import '@testing-library/jest-dom/extend-expect';

import withAlgoliaSearch from './withAlgoliaSearch';
import type { UseAlgoliaSearchResult } from './useAlgoliaSearch';
import { queryClient } from '../test/testUtils';
import { configuration } from '../../config';

jest.mock('@edx/frontend-platform/auth');
jest.mock('algoliasearch/lite', () => {
  const search = jest.fn(() => Promise.resolve({ hits: [] }));
  const initIndex = jest.fn(() => ({ search }));
  const mockAlgoliasearch = jest.fn(() => ({ initIndex }));
  return mockAlgoliasearch;
});

const axiosMock = new MockAdapter(axios);
getAuthenticatedHttpClient.mockReturnValue(axios);

jest.mock('../../config', () => ({
  configuration: {
    ENTERPRISE_CATALOG_BASE_URL: 'http://test-catalog',
    ALGOLIA: {
      APP_ID: 'testAppId',
      SEARCH_API_KEY: 'testSearchApiKey',
      INDEX_NAME: 'enterprise_catalog_v1',
      INDEX_NAME_V2: 'enterprise_catalog_v2',
    },
  },
}));

jest.mock('@edx/frontend-platform/auth', () => ({
  ...jest.requireActual('@edx/frontend-platform/auth'),
  getAuthenticatedUser: jest.fn(),
  getAuthenticatedHttpClient: jest.fn(),
}));

const mockStore = configureMockStore([thunk]);

interface PortalConfigurationState {
  enterpriseId: string;
  enterpriseFeatures?: Record<string, boolean>;
}

interface RootState {
  portalConfiguration: PortalConfigurationState;
}

type DispatchExts = ThunkDispatch<RootState, undefined, AnyAction>;

interface MyComponentProps {
  algolia: UseAlgoliaSearchResult;
  enterpriseId: string;
  className?: string;
}
const MyComponent: React.FC<MyComponentProps> = ({ algolia, enterpriseId, className }) => (
  <div className={className}>
    <h1>My Component</h1>
    <div>{enterpriseId}</div>
    {algolia.searchClient && <div>Search Client Loaded</div>}
    <div data-testid="index-name">{algolia.indexName}</div>
  </div>
);
interface MyComponentWrapperProps {
  store: MockStore<RootState, DispatchExts>;
}

const MyComponentWithAlgoliaSearch = withAlgoliaSearch(MyComponent);

const Wrapper: React.FC<MyComponentWrapperProps> = ({ store }) => (
  <QueryClientProvider client={queryClient()}>
    <Provider store={store || mockStore()}>
      <MyComponentWithAlgoliaSearch />
    </Provider>
  </QueryClientProvider>
);

describe('withAlgoliaSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthenticatedUser.mockReturnValue({ userId: 3 });
  });

  afterEach(() => {
    axiosMock.reset();
  });

  it.each([
    {
      hasErrorOnSecuredAlgoliaApiKeyRequest: false,
    },
    {
      hasErrorOnSecuredAlgoliaApiKeyRequest: true,
    },
  ])('should render WrappedComponent with expected injected props (%s)', async ({
    hasErrorOnSecuredAlgoliaApiKeyRequest,
  }) => {
    const mockEnterpriseId = 'test-enterprise-id';
    const mockSecuredApiKey = 'securedApiKey';
    const store: MockStore<RootState, DispatchExts> = mockStore({
      portalConfiguration: {
        enterpriseId: mockEnterpriseId,
        enterpriseFeatures: {},
      },
    });
    const apiUrl = `${configuration.ENTERPRISE_CATALOG_BASE_URL}/api/v1/enterprise-customer/${mockEnterpriseId}/secured-algolia-api-key/`;
    const mockSecuredAlgoliaApiKeyResponse = {
      algolia: {
        securedApiKey: 'securedApiKey',
        validUntil: '2023-10-01T00:00:00Z',
      },
      catalog_uuids_to_catalog_query_uuids: {
        'catalog-uuid-1': 'catalog-query-uuid-1',
        'catalog-uuid-2': 'catalog-query-uuid-2',
      },
    };
    if (hasErrorOnSecuredAlgoliaApiKeyRequest) {
      axiosMock.onGet(apiUrl).reply(500);
    } else {
      axiosMock.onGet(apiUrl).reply(200, mockSecuredAlgoliaApiKeyResponse);
    }
    render(<Wrapper store={store} />);

    await waitFor(() => {
      expect(screen.getByText('My Component')).toBeInTheDocument();
      expect(screen.getByText(mockEnterpriseId)).toBeInTheDocument();
      expect(screen.getByText('Search Client Loaded')).toBeInTheDocument();
    });

    if (!hasErrorOnSecuredAlgoliaApiKeyRequest) {
      expect(algoliasearch).toHaveBeenCalledWith(
        configuration.ALGOLIA.APP_ID,
        mockSecuredApiKey,
      );
    } else {
      expect(algoliasearch).toHaveBeenCalledWith(
        configuration.ALGOLIA.APP_ID,
        configuration.ALGOLIA.SEARCH_API_KEY,
      );
    }
  });

  it.each([
    { useAlgoliaIndexV2: false, expectedIndexName: 'enterprise_catalog_v1' },
    { useAlgoliaIndexV2: true, expectedIndexName: 'enterprise_catalog_v2' },
  ])('selects the correct index name when useAlgoliaIndexV2=%s', async ({ useAlgoliaIndexV2, expectedIndexName }) => {
    const mockEnterpriseId = 'test-enterprise-id';
    const store: MockStore<RootState, DispatchExts> = mockStore({
      portalConfiguration: {
        enterpriseId: mockEnterpriseId,
        enterpriseFeatures: { useAlgoliaIndexV2 },
      },
    });
    const apiUrl = `${configuration.ENTERPRISE_CATALOG_BASE_URL}/api/v1/enterprise-customer/${mockEnterpriseId}/secured-algolia-api-key/`;
    axiosMock.onGet(apiUrl).reply(500);

    render(<Wrapper store={store} />);

    await waitFor(() => {
      expect(screen.getByTestId('index-name')).toHaveTextContent(expectedIndexName);
    });
  });
});
