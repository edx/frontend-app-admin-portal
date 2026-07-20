import React from 'react';
import {
  render,
  waitFor,
  screen,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import * as hooks from './data/hooks';
import EnterpriseAppContextProvider from './EnterpriseAppContextProvider';
import * as learnerCreditHooks from '../learner-credit-management/data/hooks';
import * as subsidyRequestsContext from '../subsidy-requests/SubsidyRequestsContext';
import * as enterpriseSubsidiesContext from '../EnterpriseSubsidiesContext';

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';
const TEST_ENTERPRISE_NAME = 'test-enterprise-name';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    enterpriseSlug: 'test-enterprise',
  }),
}));

jest.mock('./data/hooks');
jest.mock('../learner-credit-management/data/hooks', () => ({
  ...jest.requireActual('../learner-credit-management/data/hooks'),
  useEnterpriseCustomer: jest.fn(() => ({
    data: { productType: null },
    isLoading: false,
  })),
}));

describe('<EnterpriseAppContextProvider />', () => {
  it.each([{
    isLoadingEnterpriseSubsidies: true,
    isLoadingSubsidyRequests: false,
    isLoadingEnterpriseCuration: false,
    isLoadingUpdateActiveEnterpriseForUser: false,
  },
  {
    isLoadingEnterpriseSubsidies: false,
    isLoadingSubsidyRequests: true,
    isLoadingEnterpriseCuration: false,
    isLoadingUpdateActiveEnterpriseForUser: false,
  },
  {
    isLoadingEnterpriseSubsidies: false,
    isLoadingSubsidyRequests: false,
    isLoadingEnterpriseCuration: true,
    isLoadingUpdateActiveEnterpriseForUser: false,
  },
  {
    isLoadingEnterpriseSubsidies: true,
    isLoadingSubsidyRequests: true,
    isLoadingEnterpriseCuration: false,
    isLoadingUpdateActiveEnterpriseForUser: false,
  },
  {
    isLoadingEnterpriseSubsidies: false,
    isLoadingSubsidyRequests: false,
    isLoadingEnterpriseCuration: false,
    isLoadingUpdateActiveEnterpriseForUser: true,
  },
  {
    isLoadingEnterpriseSubsidies: true,
    isLoadingSubsidyRequests: true,
    isLoadingEnterpriseCuration: true,
    isLoadingUpdateActiveEnterpriseForUser: true,
  },
  ])('renders <EnterpriseAppSkeleton /> when: %s', async ({
    isLoadingEnterpriseSubsidies,
    isLoadingSubsidyRequests,
    isLoadingEnterpriseCuration,
    isLoadingUpdateActiveEnterpriseForUser,
  }) => {
    const mockUseEnterpriseSubsidiesContext = jest.spyOn(enterpriseSubsidiesContext, 'useEnterpriseSubsidiesContext').mockReturnValue({
      isLoading: isLoadingEnterpriseSubsidies,
      customerAgreement: undefined,
      canManageLearnerCredit: false,
      coupons: [],
      enterpriseSubsidyTypes: [],
      hasBillingSubscription: false,
      isLoadingCustomerAgreement: false,
    });
    const mockUseSubsidyRequestsContext = jest.spyOn(subsidyRequestsContext, 'useSubsidyRequestsContext').mockReturnValue(
      {
        isLoading: isLoadingSubsidyRequests,
        updateSubsidyRequestConfiguration: jest.fn(),
        subsidyRequestConfiguration: {
          enterpriseSubsidyTypes: [],
        },
        decrementCouponCodeRequestCount: jest.fn(),
        decrementLicenseRequestCount: jest.fn(),
        enterpriseSubsidyTypesForRequests: [],
        refreshsubsidyRequestsCounts: jest.fn(),
        subsidyRequestsCounts: {
          couponCodes: 0,
          subscriptionLicenses: 0,
        },
      },
    );
    const mockUseEnterpriseCurationContext = jest.spyOn(hooks, 'useEnterpriseCurationContext').mockReturnValue(
      {
        isLoading: isLoadingEnterpriseCuration,
      },
    );
    const mockUseUpdateActiveEnterpriseForUser = jest.spyOn(hooks, 'useUpdateActiveEnterpriseForUser').mockReturnValue(
      {
        isLoading: isLoadingUpdateActiveEnterpriseForUser,
      },
    );

    render(
      <EnterpriseAppContextProvider
        enterpriseId={TEST_ENTERPRISE_UUID}
        enterpriseName={TEST_ENTERPRISE_NAME}
        enablePortalLearnerCreditManagementScreen
      >
        children
      </EnterpriseAppContextProvider>,
    );

    await waitFor(() => {
      expect(mockUseUpdateActiveEnterpriseForUser).toHaveBeenCalled();
      expect(mockUseSubsidyRequestsContext).toHaveBeenCalled();
      expect(mockUseEnterpriseSubsidiesContext).toHaveBeenCalled();
      expect(mockUseEnterpriseCurationContext).toHaveBeenCalled();

      if (
        isLoadingEnterpriseSubsidies
        || isLoadingSubsidyRequests
        || isLoadingEnterpriseCuration
        || isLoadingUpdateActiveEnterpriseForUser
      ) {
        expect(screen.getByTestId('enterprise-app-skeleton')).toBeInTheDocument();
      } else {
        expect(screen.getByText('children'));
      }
    });
  });

  it('renders children while enterprise customer data is loading', async () => {
    jest.spyOn(enterpriseSubsidiesContext, 'useEnterpriseSubsidiesContext').mockReturnValue({
      isLoading: false,
      customerAgreement: undefined,
      canManageLearnerCredit: false,
      coupons: [],
      enterpriseSubsidyTypes: [],
      hasBillingSubscription: false,
      isLoadingCustomerAgreement: false,
    });
    jest.spyOn(subsidyRequestsContext, 'useSubsidyRequestsContext').mockReturnValue({
      isLoading: false,
      updateSubsidyRequestConfiguration: jest.fn(),
      subsidyRequestConfiguration: {
        enterpriseSubsidyTypes: [],
      },
      decrementCouponCodeRequestCount: jest.fn(),
      decrementLicenseRequestCount: jest.fn(),
      enterpriseSubsidyTypesForRequests: [],
      refreshsubsidyRequestsCounts: jest.fn(),
      subsidyRequestsCounts: {
        couponCodes: 0,
        subscriptionLicenses: 0,
      },
    });
    jest.spyOn(hooks, 'useEnterpriseCurationContext').mockReturnValue({
      isLoading: false,
    });
    jest.spyOn(hooks, 'useUpdateActiveEnterpriseForUser').mockReturnValue({
      isLoading: false,
    });
    jest.spyOn(learnerCreditHooks, 'useEnterpriseCustomer').mockReturnValue({
      data: { productType: null },
      isLoading: true,
    });

    render(
      <EnterpriseAppContextProvider
        enterpriseId={TEST_ENTERPRISE_UUID}
        enterpriseName={TEST_ENTERPRISE_NAME}
        enablePortalLearnerCreditManagementScreen
      >
        children
      </EnterpriseAppContextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('children')).toBeInTheDocument();
      expect(screen.queryByTestId('enterprise-app-skeleton')).not.toBeInTheDocument();
    });
  });
});
