import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';

import useBulkRemindApprovedRequests from '../useBulkRemindApprovedRequests';
import useBudgetId from '../useBudgetId';
import EnterpriseAccessApiService from '../../../../../data/services/EnterpriseAccessApiService';
import { queryClient } from '../../../../test/testUtils';
import { learnerCreditManagementQueryKeys } from '../../constants';

jest.mock('../useBudgetId');
jest.mock('../../../../../data/services/EnterpriseAccessApiService');
jest.mock('@edx/frontend-platform/logging');

const mockSubsidyAccessPolicyId = 'test-policy-id';
const mockSubsidyRequestUUIDs = ['test-request-uuid-1', 'test-request-uuid-2'];
const mockEnterpriseId = 'test-enterprise-id';
const mockPolicyUuid = 'test-policy-uuid';

let mockQueryClient;

const wrapper = ({ children }) => (
  <QueryClientProvider client={mockQueryClient}>
    {children}
  </QueryClientProvider>
);

describe('useBulkRemindApprovedRequests', () => {
  let mockOnSuccess;
  let mockOnFailure;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess = jest.fn();
    mockOnFailure = jest.fn();

    useBudgetId.mockReturnValue({
      subsidyAccessPolicyId: mockSubsidyAccessPolicyId,
    });

    mockQueryClient = queryClient();
    jest.spyOn(mockQueryClient, 'invalidateQueries');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should return correct initial values', () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
          onSuccess: mockOnSuccess,
          onFailure: mockOnFailure,
        }),
        { wrapper },
      );

      expect(result.current.remindButtonState).toBe('default');
      expect(result.current.isOpen).toBe(false);
      expect(typeof result.current.remindApprovedRequests).toBe('function');
      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');
    });
  });

  describe('modal toggle functionality', () => {
    it('should open modal when open is called', () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
        }),
        { wrapper },
      );

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close modal when close is called', () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
        }),
        { wrapper },
      );

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('bulk remind specific requests', () => {
    const mockResponse = { data: { success: true } };

    beforeEach(() => {
      EnterpriseAccessApiService.remindApprovedBnrSubsidyRequests.mockResolvedValue(mockResponse);
    });

    it('should send POST request with multiple UUIDs', async () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
          onSuccess: mockOnSuccess,
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.remindApprovedRequests();
      });

      expect(EnterpriseAccessApiService.remindApprovedBnrSubsidyRequests).toHaveBeenCalledWith({
        enterpriseId: mockEnterpriseId,
        subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
      });
    });

    it('should handle successful bulk reminder', async () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
          onSuccess: mockOnSuccess,
        }),
        { wrapper },
      );

      act(() => {
        result.current.remindApprovedRequests();
      });

      expect(result.current.remindButtonState).toBe('pending');

      await waitFor(() => {
        expect(result.current.remindButtonState).toBe('complete');
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should invalidate queries after success', async () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.remindApprovedRequests();
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: learnerCreditManagementQueryKeys.budget(mockSubsidyAccessPolicyId),
      });
    });
  });

  describe('remind all requests', () => {
    const mockResponse = { status: 202 };
    const tableFilters = [
      { id: 'learnerRequestState', value: ['waiting'] },
    ];

    beforeEach(() => {
      EnterpriseAccessApiService.remindAllApprovedBnrSubsidyRequests.mockResolvedValue(mockResponse);
    });

    it('should call remindAllApprovedBnrSubsidyRequests when remindAll is true', async () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
          remindAll: true,
          tableFilters,
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.remindApprovedRequests();
      });

      expect(EnterpriseAccessApiService.remindAllApprovedBnrSubsidyRequests).toHaveBeenCalled();
      expect(EnterpriseAccessApiService.remindApprovedBnrSubsidyRequests).not.toHaveBeenCalled();
    });

    it('should apply filters to remind-all request', async () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
          remindAll: true,
          tableFilters,
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.remindApprovedRequests();
      });

      expect(EnterpriseAccessApiService.remindAllApprovedBnrSubsidyRequests).toHaveBeenCalledWith({
        enterpriseId: mockEnterpriseId,
        policyUuid: mockPolicyUuid,
        options: expect.any(Object),
      });
    });
  });

  describe('error handling', () => {
    const mockError = new Error('API Error');

    beforeEach(() => {
      EnterpriseAccessApiService.remindApprovedBnrSubsidyRequests.mockRejectedValue(mockError);
    });

    it('should set error state on API failure', async () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
          onFailure: mockOnFailure,
        }),
        { wrapper },
      );

      act(() => {
        result.current.remindApprovedRequests();
      });

      expect(result.current.remindButtonState).toBe('pending');

      await waitFor(() => {
        expect(result.current.remindButtonState).toBe('error');
      });
    });

    it('should call onFailure callback', async () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
          onFailure: mockOnFailure,
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.remindApprovedRequests();
      });

      expect(mockOnFailure).toHaveBeenCalledWith(mockError);
    });

    it('should not invalidate queries on failure', async () => {
      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
          onFailure: mockOnFailure,
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.remindApprovedRequests();
      });

      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe('button state transitions', () => {
    it('should transition default -> pending -> complete on success', async () => {
      EnterpriseAccessApiService.remindApprovedBnrSubsidyRequests.mockResolvedValue({ status: 200 });

      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
        }),
        { wrapper },
      );

      expect(result.current.remindButtonState).toBe('default');

      act(() => {
        result.current.remindApprovedRequests();
      });

      expect(result.current.remindButtonState).toBe('pending');

      await waitFor(() => {
        expect(result.current.remindButtonState).toBe('complete');
      });
    });

    it('should transition default -> pending -> error on failure', async () => {
      EnterpriseAccessApiService.remindApprovedBnrSubsidyRequests.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(
        () => useBulkRemindApprovedRequests({
          subsidyRequestUUIDs: mockSubsidyRequestUUIDs,
          enterpriseId: mockEnterpriseId,
          policyUuid: mockPolicyUuid,
        }),
        { wrapper },
      );

      expect(result.current.remindButtonState).toBe('default');

      act(() => {
        result.current.remindApprovedRequests();
      });

      expect(result.current.remindButtonState).toBe('pending');

      await waitFor(() => {
        expect(result.current.remindButtonState).toBe('error');
      });
    });
  });
});
