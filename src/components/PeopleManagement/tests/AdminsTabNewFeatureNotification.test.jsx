import { renderHook, act } from '@testing-library/react';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { sendEnterpriseTrackEvent } from '@edx/frontend-enterprise-utils';

import {
  useAdminsTabNewFeature,
  ADMINS_TAB_NEW_FEATURE_NOTIFICATION_EVENT_NAME,
  generateAdminsTabAlertCookieName,
  generateAdminsTabSeenCookieName,
} from '../AdminsTabNewFeatureNotification';

jest.mock('@edx/frontend-platform/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('@edx/frontend-enterprise-utils', () => ({
  sendEnterpriseTrackEvent: jest.fn(),
}));

jest.mock('../../ProductTours/constants', () => ({
  TOUR_TARGETS: {
    PEOPLE_MANAGEMENT: 'people-management-link',
  },
}));

const mockEnterpriseId = 'test-enterprise-id';
const mockUsername = 'test-user';
const alertCookieName = generateAdminsTabAlertCookieName(mockEnterpriseId, mockUsername);
const seenCookieName = generateAdminsTabSeenCookieName(mockEnterpriseId, mockUsername);

describe('useAdminsTabNewFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.localStorage.clear();
    getAuthenticatedUser.mockReturnValue({ username: mockUsername });
  });

  describe('adminsNewFeatureNotification', () => {
    it('should render notification when alert cookie is not set', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      expect(result.current.adminsNewFeatureNotification).not.toBeNull();
      expect(result.current.adminsNewFeatureNotification.props.children.props.tours[0].enabled).toBe(true);
    });

    it('should disable notification when alert cookie is already set', () => {
      global.localStorage.setItem(alertCookieName, 'true');

      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      const tourConfig = result.current.adminsNewFeatureNotification.props.children.props.tours[0];
      expect(tourConfig.enabled).toBe(false);
    });

    it('should have correct tour configuration', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      const tourConfig = result.current.adminsNewFeatureNotification.props.children.props.tours[0];
      expect(tourConfig.tourId).toBe('adminsTabNewFeature');
      expect(tourConfig.dismissible).toBe(true);
      expect(tourConfig.checkpoints).toHaveLength(1);
      expect(tourConfig.checkpoints[0].target).toBe('#people-management-link');
      expect(tourConfig.checkpoints[0].placement).toBe('right');
      expect(tourConfig.checkpoints[0].title).toBe('New Feature');
      expect(tourConfig.checkpoints[0].body).toBe(
        "We've recently added the ability for you to invite and manage your admins.",
      );
    });

    it('should set alert cookie and send tracking event when dismissed via onEnd', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      act(() => {
        result.current.adminsNewFeatureNotification.props.children.props.tours[0].onEnd();
      });

      expect(global.localStorage.getItem(alertCookieName)).toBe('true');
      expect(sendEnterpriseTrackEvent).toHaveBeenCalledWith(
        mockEnterpriseId,
        ADMINS_TAB_NEW_FEATURE_NOTIFICATION_EVENT_NAME,
      );
    });

    it('should set alert cookie and send tracking event when dismissed via onDismiss', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      act(() => {
        result.current.adminsNewFeatureNotification.props.children.props.tours[0].checkpoints[0].onDismiss();
      });

      expect(global.localStorage.getItem(alertCookieName)).toBe('true');
      expect(sendEnterpriseTrackEvent).toHaveBeenCalledWith(
        mockEnterpriseId,
        ADMINS_TAB_NEW_FEATURE_NOTIFICATION_EVENT_NAME,
      );
    });

    it('should not hide bubble when notification is dismissed', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      act(() => {
        result.current.adminsNewFeatureNotification.props.children.props.tours[0].onEnd();
      });

      expect(result.current.adminsTabNotificationBubble).not.toBeNull();
    });

    it('should use userId as fallback when username is not available', () => {
      getAuthenticatedUser.mockReturnValue({ userId: 123 });

      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      expect(result.current.adminsNewFeatureNotification.props.children.props.tours[0].enabled).toBe(true);
    });

    it('should use unknown-user when neither username nor userId is available', () => {
      getAuthenticatedUser.mockReturnValue({});

      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      expect(result.current.adminsNewFeatureNotification).toBeDefined();
    });
  });

  describe('adminsTabNotificationBubble (red dot)', () => {
    it('should show bubble when seen cookie is not set', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      expect(result.current.adminsTabNotificationBubble).not.toBeNull();
    });

    it('should hide bubble when seen cookie is already set', () => {
      global.localStorage.setItem(seenCookieName, 'true');

      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      expect(result.current.adminsTabNotificationBubble).toBeNull();
    });

    it('should have correct bubble configuration', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      const bubble = result.current.adminsTabNotificationBubble;
      expect(bubble.props.variant).toBe('error');
      expect(bubble.props.className).toBe('position-absolute');
      expect(bubble.props.style).toEqual({
        minHeight: '0.5rem',
        minWidth: '0.5rem',
        top: -2,
        right: -8,
      });
    });

    it('should hide bubble and set seen cookie when admins tab is clicked', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      act(() => {
        result.current.onAdminsTabClick();
      });

      expect(result.current.adminsTabNotificationBubble).toBeNull();
      expect(global.localStorage.getItem(seenCookieName)).toBe('true');
    });

    it('should remain hidden when admins tab clicked and already seen', () => {
      global.localStorage.setItem(seenCookieName, 'true');

      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      act(() => {
        result.current.onAdminsTabClick();
      });

      expect(result.current.adminsTabNotificationBubble).toBeNull();
    });
  });

  describe('Integration: notification and bubble interact independently', () => {
    it('should independently manage notification and bubble states', () => {
      const { result } = renderHook(() => useAdminsTabNewFeature(mockEnterpriseId));

      // Initially both visible
      expect(result.current.adminsNewFeatureNotification.props.children.props.tours[0].enabled).toBe(true);
      expect(result.current.adminsTabNotificationBubble).not.toBeNull();

      // Dismiss notification - bubble stays visible
      act(() => {
        result.current.adminsNewFeatureNotification.props.children.props.tours[0].onEnd();
      });
      expect(result.current.adminsNewFeatureNotification.props.children.props.tours[0].enabled).toBe(false);
      expect(result.current.adminsTabNotificationBubble).not.toBeNull();

      // Click admins tab - bubble now hidden
      act(() => {
        result.current.onAdminsTabClick();
      });
      expect(result.current.adminsTabNotificationBubble).toBeNull();
    });
  });
});
