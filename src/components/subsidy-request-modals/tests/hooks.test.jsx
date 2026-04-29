import { renderHook, waitFor } from '@testing-library/react';
import { useApplicableCatalogs, useApplicableSubscriptions } from '../data/hooks';
import EnterpriseCatalogApiService from '../../../data/services/EnterpriseCatalogApiService';

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';
const TEST_COURSE_RUN_IDS = ['edx+101'];
const TEST_CATALOG_UUID = 'test-catalog-uuid';

jest.mock('../../../data/services/EnterpriseCatalogApiService', () => ({
  fetchApplicableCatalogs: jest.fn(() => ({
    data: {
      catalog_list: [TEST_CATALOG_UUID],
    },
  })),
}));

describe('useApplicableCatalogs', () => {
  afterEach(() => jest.clearAllMocks());

  it('should fetch catalogs containing given the course runs', async () => {
    const { result } = renderHook(() => useApplicableCatalogs({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
    }));
    await waitFor(() => {
      expect(result.current.applicableCatalogs).toBeDefined();
    });
    expect(EnterpriseCatalogApiService.fetchApplicableCatalogs).toHaveBeenCalledWith(
      {
        enterpriseId: TEST_ENTERPRISE_UUID,
        courseRunIds: TEST_COURSE_RUN_IDS,
      },
    );
    expect(result.current.applicableCatalogs).toEqual([TEST_CATALOG_UUID]);
  });

  it('should handle errors', async () => {
    const error = new Error('something went wrong');
    EnterpriseCatalogApiService.fetchApplicableCatalogs.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useApplicableCatalogs({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
    }));

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });
  });
});

describe('useApplicableSubscriptions', () => {
  const subscriptions = {
    results: [{
      uuid: 'test-subscription-1',
      enterpriseCatalogUuid: TEST_CATALOG_UUID,
      licenses: {
        unassigned: 1,
      },
      daysUntilExpiration: 23,
    },
    {
      uuid: 'test-subscription-2',
      enterpriseCatalogUuid: TEST_CATALOG_UUID,
      licenses: {
        unassigned: 0,
      },
      daysUntilExpiration: 33,
    },
    {
      uuid: 'test-subscription-2',
      enterpriseCatalogUuid: 'abc',
      licenses: {
        unassigned: 1,
      },
      daysUntilExpiration: -1,
    }],
  };

  afterEach(() => jest.clearAllMocks());

  it('should return all subscriptions with a catalog containing the given course runs', async () => {
    const { result } = renderHook(() => useApplicableSubscriptions({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
      subscriptions,
    }));

    await waitFor(() => {
      expect(result.current.applicableSubscriptions).toBeDefined();
    });
    expect(EnterpriseCatalogApiService.fetchApplicableCatalogs).toHaveBeenCalledWith(
      {
        enterpriseId: TEST_ENTERPRISE_UUID,
        courseRunIds: TEST_COURSE_RUN_IDS,
      },
    );
    const { applicableSubscriptions } = result.current;
    expect(applicableSubscriptions.length).toEqual(1);
    expect(applicableSubscriptions[0]).toEqual(subscriptions.results[0]);
  });

  it('should handle errors', async () => {
    const error = new Error('something went wrong');
    EnterpriseCatalogApiService.fetchApplicableCatalogs.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useApplicableCatalogs({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
    }));

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });
    expect(result.current.error).toEqual(error);
  });
});
