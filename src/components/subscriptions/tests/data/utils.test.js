import dayjs from 'dayjs';
import {
  ACTIVE, CANCELED, ENDED, PENDING_CANCELLATION, SCHEDULED,
} from '../../data/constants';
import { getSubscriptionStatus, openStripeBillingPortal, sortSubscriptionsByStatus } from '../../data/utils';
import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import { features } from '../../../../config';

describe('utils', () => {
  const scheduledSub = {
    startDate: dayjs().add(1, 'days').toISOString(),
    expirationDate: dayjs().add(10, 'days').toISOString(),
    title: 'Test Scheduled Plan',
  };
  const activeSub = {
    startDate: dayjs().subtract(1, 'days').toISOString(),
    expirationDate: dayjs().add(10, 'days').toISOString(),
    title: 'Test Active Plan',
  };
  const expiredSub = {
    startDate: dayjs().subtract(10, 'days').toISOString(),
    expirationDate: dayjs().subtract(1, 'days').toISOString(),
    title: 'Test Expired Plan',
  };

  describe('getSubscriptionStatus', () => {
    it('should get the subscription plan status', () => {
      expect(getSubscriptionStatus(scheduledSub)).toEqual(SCHEDULED);
      expect(getSubscriptionStatus(activeSub)).toEqual(ACTIVE);
      expect(getSubscriptionStatus(expiredSub)).toEqual(ENDED);
    });

    describe('with ENABLE_SSP_PAID_RENEWAL on', () => {
      beforeEach(() => { features.ENABLE_SSP_PAID_RENEWAL = true; });
      afterEach(() => { features.ENABLE_SSP_PAID_RENEWAL = false; });

      it('returns Pending Cancellation while the cancellation date is in the future', () => {
        const canceledDate = dayjs().add(5, 'days').toISOString();
        expect(getSubscriptionStatus(activeSub, canceledDate)).toEqual(PENDING_CANCELLATION);
      });

      it('returns Ended, not Pending Cancellation, for an earlier plan that already ended (e.g. the trial)', () => {
        const canceledDate = dayjs().add(5, 'days').toISOString();
        expect(getSubscriptionStatus(expiredSub, canceledDate)).toEqual(ENDED);
      });

      it('returns Canceled once the cancellation date has passed', () => {
        const canceledDate = dayjs().subtract(1, 'days').toISOString();
        expect(getSubscriptionStatus(expiredSub, canceledDate)).toEqual(CANCELED);
      });
    });

    describe('with ENABLE_SSP_PAID_RENEWAL off', () => {
      it.each([
        ['in the future', dayjs().add(5, 'days').toISOString()],
        ['in the past', dayjs().subtract(1, 'days').toISOString()],
      ])('returns Canceled for any cancellation date (%s), as before', (_, canceledDate) => {
        expect(getSubscriptionStatus(activeSub, canceledDate)).toEqual(CANCELED);
        expect(getSubscriptionStatus(expiredSub, canceledDate)).toEqual(CANCELED);
      });
    });
  });

  describe('sortSubscriptionsByStatus', () => {
    it('should sort subscriptions by status', () => {
      const initialOrder = [expiredSub, activeSub, scheduledSub];
      const expectedOrder = [activeSub, scheduledSub, expiredSub];
      expect(sortSubscriptionsByStatus(initialOrder)).toEqual(expectedOrder);
    });

    it('should sort subscriptions by expiration date after status', () => {
      const activeSub2 = {
        ...activeSub,
        expirationDate: dayjs().add(1, 'days').toISOString(), // expires sooner than other active subs plan
      };
      const initialOrder = [expiredSub, activeSub, scheduledSub, activeSub2];
      const expectedOrder = [activeSub2, activeSub, scheduledSub, expiredSub];
      expect(sortSubscriptionsByStatus(initialOrder)).toEqual(expectedOrder);
    });

    it('should sort subscriptions by plan title after status and date', () => {
      const activeSub2 = {
        ...activeSub,
        title: 'Another Active Plan', // title alphabetically comes before other active subs plan title
      };
      const initialOrder = [expiredSub, activeSub, scheduledSub, activeSub2];
      const expectedOrder = [activeSub2, activeSub, scheduledSub, expiredSub];
      expect(sortSubscriptionsByStatus(initialOrder)).toEqual(expectedOrder);
    });
  });
  describe('openStripeBillingPortal', () => {
    jest.mock('../../../../data/services/EnterpriseAccessApiService', () => ({
      fetchStripeBillingPortalSession: jest.fn().mockReturnValue({
        data: {
          url: 'https://fake-stripe-url.com',
        },
      }),
    }));
    it('should create new stripe billing portal', () => {
      const spy = jest.spyOn(EnterpriseAccessApiService, 'fetchStripeBillingPortalSession');
      openStripeBillingPortal('test-uuid');
      expect(spy).toHaveBeenCalledWith('test-uuid');
    });
  });
});
