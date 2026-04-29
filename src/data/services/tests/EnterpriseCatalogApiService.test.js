/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

import EnterpriseCatalogApiService from '../EnterpriseCatalogApiService';

const axiosMock = new MockAdapter(axios);
getAuthenticatedHttpClient.mockReturnValue(axios);

axiosMock.onAny().reply(200);
axios.get = jest.fn().mockResolvedValue({ data: {} });
axios.delete = jest.fn().mockResolvedValue({ data: {} });
const enterpriseCatalogBaseUrl = `${process.env.ENTERPRISE_CATALOG_BASE_URL}/api/v1`;

const mockHighlightSetUUID = 'test-highlight-set-uuid';

describe('EnterpriseCatalogApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchHighlightSet calls enterprise-catalog', async () => {
    await EnterpriseCatalogApiService.fetchHighlightSet(mockHighlightSetUUID);
    expect(axios.get).toBeCalledWith(`${enterpriseCatalogBaseUrl}/highlight-sets-admin/${mockHighlightSetUUID}`);
  });
  test('deleteHighlightSet calls enterprise-catalog', () => {
    EnterpriseCatalogApiService.deleteHighlightSet(mockHighlightSetUUID);
    expect(axios.delete).toBeCalledWith(`${enterpriseCatalogBaseUrl}/highlight-sets-admin/${mockHighlightSetUUID}/`);
  });
});
