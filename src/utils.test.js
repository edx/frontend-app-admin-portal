import { logError } from '@edx/frontend-platform/logging';
import { createIntl } from '@edx/frontend-platform/i18n';
import { saveAs } from 'file-saver';

import {
  camelCaseDict,
  camelCaseDictArray,
  createUtf8CsvBlob,
  defaultQueryClientRetryHandler,
  downloadCsv,
  getEnterpriseAdminRegisterLogoutUrl,
  getFromLocalStorage,
  getSubscriptionContactText,
  getTimeStampedFilename,
  i18nFormatPassedTimestamp,
  i18nFormatProgressStatus,
  isEnterpriseCustomerInUuidAllowlist,
  isValidNumber,
  pollAsync,
  queryCacheOnErrorHandler,
  removeCsvColumn,
  removeStringsFromList,
  removeStringsFromListCaseInsensitive,
  saveToLocalStorage,
  snakeCaseDict,
  snakeCaseFormData,
  snakeCaseObjectToForm,
  splitAndTrim,
} from './utils';
import { configuration } from './config';

jest.mock('@edx/frontend-platform/logging', () => ({
  ...jest.requireActual('@edx/frontend-platform/logging'),
  logError: jest.fn(),
}));

jest.mock('file-saver', () => ({
  ...jest.requireActual('file-saver'),
  saveAs: jest.fn(),
}));

jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2024-01-20'));

global.Blob = jest.fn();

const intl = createIntl({
  locale: 'en',
  messages: {},
});

describe('utils', () => {
  describe('camel casing methods', () => {
    it('formats dictionaries into camel case', () => {
      const startingSnakeCaseDict = { snake_case_key: 'foobar' };
      const expectedCamelCaseDict = { snakeCaseKey: 'foobar' };
      expect(camelCaseDict(startingSnakeCaseDict)).toEqual(
        expectedCamelCaseDict,
      );
    });
    it('does not format dictionary value', () => {
      const startingDict = { fooBar: 'example_value' };
      expect(camelCaseDict(startingDict)).toEqual(startingDict);
    });
    it('formats an array of dictionaries into camel case', () => {
      const snakeCaseDictArray = [
        { foo_bar: 'example_value' },
        { ayy_lmao: 'example_value' },
      ];
      const expectedCamelCaseArray = [
        { fooBar: 'example_value' },
        { ayyLmao: 'example_value' },
      ];
      expect(camelCaseDictArray(snakeCaseDictArray)).toEqual(
        expectedCamelCaseArray,
      );
    });
  });

  describe('snake casing methods', () => {
    it('formats dictionaries into snake case', () => {
      const startingSnakeCaseDict = { snakeCaseKey: 'foobar' };
      const expectedCamelCaseDict = { snake_case_key: 'foobar' };
      expect(snakeCaseDict(startingSnakeCaseDict)).toEqual(
        expectedCamelCaseDict,
      );
    });
    it('does not format dictionary value', () => {
      const startingDict = { foo_bar: 'example_value' };
      expect(snakeCaseDict(startingDict)).toEqual(startingDict);
    });
    it('format form data to snake case', () => {
      const camelCaseFormData = new FormData();
      camelCaseFormData.append('userName', 'ayyLmao');
      expect(snakeCaseFormData(camelCaseFormData).get('user_name')).toEqual(
        'ayyLmao',
      );
    });
    it('converts object to form data', () => {
      const originalObject = { captainCrunch: 'allberries' };
      const formData = snakeCaseObjectToForm(originalObject);
      expect(formData instanceof FormData).toEqual(true);
      expect(formData.get('captain_crunch')).toEqual('allberries');
    });
  });

  describe('async polling', () => {
    it('polls until truthy return value', async () => {
      const mockPoll = jest.fn();
      mockPoll
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValue(true);
      const pollReturn = await pollAsync(mockPoll, 1000, 300);
      expect(pollReturn).toEqual(true);
      expect(mockPoll).toBeCalledTimes(3);
    });
    it('polls until condition', async () => {
      const mockPoll = jest.fn();
      mockPoll.mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValue(2);
      const pollReturn = await pollAsync(mockPoll, 1000, 300, (val) => val > 1);
      expect(pollReturn).toEqual(2);
      expect(mockPoll).toBeCalledTimes(3);
    });
    it('times out', async () => {
      const mockPoll = jest.fn();
      mockPoll.mockReturnValue(false);
      const pollReturn = await pollAsync(mockPoll, 1000, 300);
      expect(pollReturn).toEqual(false);
      expect(mockPoll).toBeCalledTimes(4);
    });
  });

  describe('validations', () => {
    it('detects valid number', () => {
      expect(isValidNumber(1)).toEqual(true);
      expect(isValidNumber('1')).toEqual(true);
      expect(isValidNumber(Infinity)).toEqual(true);
      expect(isValidNumber('One')).toEqual(false);
      expect(isValidNumber({})).toEqual(false);
      expect(isValidNumber(undefined)).toEqual(false);
    });
  });

  describe('defaultQueryClientRetryHandler', () => {
    const mockError404 = { customAttributes: { httpErrorStatus: 404 } };
    const mockError500 = { customAttributes: { httpErrorStatus: 500 } };

    it.each([3, 4])('return false if failureCount >= 3 (failureCount: %s)', (failureCount) => {
      const result = defaultQueryClientRetryHandler(failureCount, mockError500);
      expect(result).toEqual(false);
    });

    it('return false if error is a 404 HTTP status code', () => {
      const result = defaultQueryClientRetryHandler(1, mockError404);
      expect(result).toEqual(false);
    });

    it.each([1, 2])('return true if first failure and error is not a 404 (failureCount: %s)', (failureCount) => {
      const result = defaultQueryClientRetryHandler(failureCount, mockError500);
      expect(result).toEqual(true);
    });
  });
  describe('queryCacheOnErrorHandler', () => {
    it('calls logError', () => {
      const error = 'hello!';
      const query = { meta: { errorMessage: "hi, I'm an error" } };
      queryCacheOnErrorHandler(error, query);
      expect(logError).toHaveBeenCalledWith("hi, I'm an error");
    });
  });
  describe('i18nFormatPassedTimestamp', () => {
    it('returns correct value', () => {
      const passedTimestamp = i18nFormatPassedTimestamp({ intl, timestamp: '2021-01-01T00:00:00Z' });
      expect(passedTimestamp).toEqual('January 1, 2021');

      const notPassed = i18nFormatPassedTimestamp({ intl, timestamp: undefined });
      expect(notPassed).toEqual('Has not passed');
    });
  });
  describe('i18nFormatProgressStatus', () => {
    const testIntl = createIntl({
      locale: 'en',
      messages: {
        'admin.portal.lpr.progress.status.in.progress': 'IN_PROGRESS_TRANSLATED',
        'admin.portal.lpr.progress.status.passed': 'PASSED_TRANSLATED',
        'admin.portal.lpr.progress.status.audit.access.expired': 'AUDIT_ACCESS_EXPIRED_TRANSLATED',
        'admin.portal.lpr.progress.status.failed': 'FAILED_TRANSLATED',
        'admin.portal.lpr.progress.status.cancelled': 'CANCELLED_TRANSLATED',
        'admin.portal.lpr.progress.status.enrolled': 'ENROLLED_TRANSLATED',
        'admin.portal.lpr.progress.status.pass': 'PASS_TRANSLATED',
        'admin.portal.lpr.progress.status.pending': 'PENDING_TRANSLATED',
      },
    });

    it('returns correct progress status', () => {
      const allProgressStatuses = [
        'In Progress', 'Passed', 'Audit Access Expired',
        'Failed', 'Cancelled', 'Enrolled', 'Pass', 'Pending', null,
      ];
      allProgressStatuses.forEach((progressStatus) => {
        const formattedProgressStatus = i18nFormatProgressStatus({ intl, progressStatus });
        expect(formattedProgressStatus).toEqual(progressStatus);
      });
    });

    it('returns translated message for "In Progress" status', () => {
      const result = i18nFormatProgressStatus({ intl: testIntl, progressStatus: 'In Progress' });
      expect(result).toEqual('IN_PROGRESS_TRANSLATED');
      expect(typeof result).toBe('string');
    });

    it('returns translated message for "Passed" status', () => {
      const result = i18nFormatProgressStatus({ intl: testIntl, progressStatus: 'Passed' });
      expect(result).toEqual('PASSED_TRANSLATED');
      expect(typeof result).toBe('string');
    });

    it('returns original status for unknown progress status', () => {
      const unknownStatus = 'Unknown Status';
      const result = i18nFormatProgressStatus({ intl, progressStatus: unknownStatus });
      expect(result).toEqual(unknownStatus);
    });

    it('returns null for null progress status', () => {
      const result = i18nFormatProgressStatus({ intl, progressStatus: null });
      expect(result).toEqual(null);
    });

    it('returns undefined for undefined progress status', () => {
      const result = i18nFormatProgressStatus({ intl, progressStatus: undefined });
      expect(result).toEqual(undefined);
    });
  });
  describe('getTimeStampedFilename', () => {
    it('generates timestamped filename', () => {
      const expectedFileName = '2024-01-20-somefile.txt';
      expect(getTimeStampedFilename('somefile.txt')).toEqual(expectedFileName);
    });
  });
  describe('downloadCsv', () => {
    it('downloads properly formatted csv', () => {
      const fileName = 'somefile.csv';
      const data = [
        {
          a: 1, b: 2, c: 3, d: 4,
        },
        {
          a: 'apple', b: 'banana', c: 'comma, please', d: 'donut',
        },
      ];
      const headers = ['a', 'b', 'c', 'd'];
      const dataEntryToRow = (entry) => {
        const changeItUp = (field) => (isValidNumber(field) ? field + 1 : field);
        const {
          a, b, c, d,
        } = entry;
        return [a, b, c, d].map(changeItUp);
      };
      downloadCsv(fileName, data, headers, dataEntryToRow);
      const expectedBlob = ['a,b,c,d\n2,3,4,5\napple,banana,"comma, please",donut'];
      expect(global.Blob).toHaveBeenCalledWith(expectedBlob, {
        type: 'text/csv;charset=utf-8;',
      });
      expect(saveAs).toHaveBeenCalledWith({}, fileName);
    });
  });
  describe('createUtf8CsvBlob', () => {
    it('does not manually prepend a BOM', () => {
      // file-saver's saveAs auto-prepends a BOM for any blob type matching
      // text/*;charset=utf-8 (its `auto_bom` helper) — adding one here too would
      // double it up in the downloaded file. See file-saver's FileSaver.js.
      const csv = 'a,b\n1,2';
      createUtf8CsvBlob(csv);
      expect(global.Blob).toHaveBeenCalledWith([csv], {
        type: 'text/csv;charset=utf-8;',
      });
    });
  });
  describe('removeCsvColumn', () => {
    it('removes the matching column from every row', () => {
      const csv = 'email,course_progress,current_grade\nlearner@example.com,50%,77%';
      expect(removeCsvColumn(csv, 'course_progress')).toBe(
        'email,current_grade\nlearner@example.com,77%',
      );
    });

    it('matches the header case-insensitively and trims whitespace', () => {
      const csv = 'email, Course_Progress ,current_grade\nlearner@example.com,50%,77%';
      expect(removeCsvColumn(csv, 'course_progress')).toBe(
        'email,current_grade\nlearner@example.com,77%',
      );
    });

    it('returns the csv unchanged when the header is not found', () => {
      const csv = 'email,current_grade\nlearner@example.com,77%';
      expect(removeCsvColumn(csv, 'course_progress')).toBe(csv);
    });

    it('returns falsy input unchanged', () => {
      expect(removeCsvColumn('', 'course_progress')).toBe('');
      expect(removeCsvColumn(undefined, 'course_progress')).toBe(undefined);
    });

    it('preserves quoted commas in surviving columns', () => {
      const csv = 'course_title,course_progress,current_grade\n"Business, Basics",50%,77%';
      expect(removeCsvColumn(csv, 'course_progress')).toBe(
        'course_title,current_grade\n"Business, Basics",77%',
      );
    });

    it('preserves escaped quotes in surviving columns', () => {
      const csv = 'course_title,course_progress\n"Say ""Hi""",50%';
      expect(removeCsvColumn(csv, 'course_progress')).toBe(
        'course_title\n"Say ""Hi"""',
      );
    });

    it('re-quotes a surviving column that contains a newline', () => {
      const csv = 'course_title,course_progress\n"Line one\nLine two",50%';
      expect(removeCsvColumn(csv, 'course_progress')).toBe(
        'course_title\n"Line one\nLine two"',
      );
    });

    it('does not corrupt an unquoted field containing a stray quote character', () => {
      const csv = 'user_email,course_title,course_progress,current_grade\n'
        + 'learner@example.com,6" Screen Basics,50%,77%';
      expect(removeCsvColumn(csv, 'course_progress')).toBe(
        'user_email,course_title,current_grade\nlearner@example.com,"6"" Screen Basics",77%',
      );
    });

    it('leaves a ragged row with a different field count than the header untouched', () => {
      const csv = 'a,course_progress,c\n1,2\n3,4,5';
      expect(removeCsvColumn(csv, 'course_progress')).toBe('a,c\n1,2\n3,5');
    });
  });
  describe('isEnterpriseCustomerInUuidAllowlist', () => {
    const ENTERPRISE_UUID = 'cepal-enterprise-uuid';

    it('returns true when the enterprise uuid matches the configured uuid', () => {
      expect(isEnterpriseCustomerInUuidAllowlist(ENTERPRISE_UUID, ENTERPRISE_UUID)).toBe(true);
    });

    it('returns false when the enterprise uuid does not match the configured uuid', () => {
      expect(isEnterpriseCustomerInUuidAllowlist('other-uuid', ENTERPRISE_UUID)).toBe(false);
    });

    it('returns false for a partial/substring match, not just an exact match', () => {
      expect(isEnterpriseCustomerInUuidAllowlist('uuid', ENTERPRISE_UUID)).toBe(false);
    });

    it('returns false for a null/undefined/empty configured uuid', () => {
      expect(isEnterpriseCustomerInUuidAllowlist(ENTERPRISE_UUID, null)).toBe(false);
      expect(isEnterpriseCustomerInUuidAllowlist(ENTERPRISE_UUID, undefined)).toBe(false);
      expect(isEnterpriseCustomerInUuidAllowlist(ENTERPRISE_UUID, '')).toBe(false);
    });

    it('returns false when enterpriseCustomerUuid is falsy, even with a configured uuid', () => {
      expect(isEnterpriseCustomerInUuidAllowlist(null, ENTERPRISE_UUID)).toBe(false);
      expect(isEnterpriseCustomerInUuidAllowlist(undefined, ENTERPRISE_UUID)).toBe(false);
    });
  });
  describe('splitAndTrim', () => {
    it('returns split and trimmed string array', () => {
      const csvStr = 'a,b,,c ,';
      expect(splitAndTrim(',', csvStr)).toEqual(['a', 'b', 'c']);
    });
  });
  describe('removeStringsFromList', () => {
    it('should remove strings from list', () => {
      const list = ['a', 'b', 'c', 'd'];
      const remove = ['b', 'd'];
      expect(removeStringsFromList(list, remove)).toEqual(['a', 'c']);
    });
  });
  describe('removeStringsFromListCaseInsensitive', () => {
    it('should remove strings from list in a case insensitive way', () => {
      const list = ['ab', 'bc', 'cd', 'de', 'Ef'];
      const remove = ['Bc', 'de', 'eF'];
      expect(removeStringsFromListCaseInsensitive(list, remove)).toEqual(['ab', 'cd']);
    });
  });
  describe('localStorage utils', () => {
    const originalLocalStorage = global.localStorage;

    beforeEach(() => {
      global.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
      };
    });

    afterEach(() => {
      global.localStorage = originalLocalStorage;
    });

    describe('saveToLocalStorage', () => {
      it('saves string value to localStorage', () => {
        saveToLocalStorage('testKey', 'testValue');
        expect(localStorage.setItem).toHaveBeenCalledWith('testKey', '"testValue"');
      });

      it('saves object to localStorage', () => {
        const testObject = { foo: 'bar', num: 123 };
        saveToLocalStorage('testKey', testObject);
        expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testObject));
      });
    });

    describe('getFromLocalStorage', () => {
      it('retrieves and parses value from localStorage', () => {
        const testObject = { foo: 'bar', num: 123 };
        localStorage.getItem.mockReturnValue(JSON.stringify(testObject));

        const result = getFromLocalStorage('testKey');

        expect(localStorage.getItem).toHaveBeenCalledWith('testKey');
        expect(result).toEqual(testObject);
      });

      it('returns null when key not found', () => {
        localStorage.getItem.mockReturnValue(null);

        const result = getFromLocalStorage('nonExistentKey');

        expect(result).toBeNull();
      });
    });
  });

  describe('getSubscriptionContactText', () => {
    it('returns text with email when intl is not provided', () => {
      expect(getSubscriptionContactText('help@example.com')).toEqual(
        'To learn more about your unlimited subscription and edX, contact your edX administrator at help@example.com.',
      );
    });

    it('returns default text with period when no contactEmail is provided', () => {
      expect(getSubscriptionContactText(null)).toEqual(
        'To learn more about your unlimited subscription and edX, contact your edX administrator.',
      );
    });
  });

  describe('getEnterpriseAdminRegisterLogoutUrl', () => {
    const ORIGINAL_BASE_URL = configuration.BASE_URL;
    const ORIGINAL_LOGOUT_URL = configuration.LOGOUT_URL;

    beforeEach(() => {
      configuration.BASE_URL = 'https://portal.example.com';
      configuration.LOGOUT_URL = 'https://courses.example.com/logout';
    });

    afterEach(() => {
      configuration.BASE_URL = ORIGINAL_BASE_URL;
      configuration.LOGOUT_URL = ORIGINAL_LOGOUT_URL;
    });

    // Decoding `next` back to the original target is the property we actually
    // care about server-side, so most assertions extract and decode the param
    // rather than pinning the exact escape sequence the URL ctor produces.
    const decodeNext = (logoutUrl) => new URL(logoutUrl).searchParams.get('next');

    it('builds a logout URL with next pointing at /admin/register on the configured BASE_URL', () => {
      const url = getEnterpriseAdminRegisterLogoutUrl('acme');
      expect(new URL(url).origin + new URL(url).pathname).toBe('https://courses.example.com/logout');
      expect(decodeNext(url)).toBe('https://portal.example.com/acme/admin/register');
    });

    it('attaches params to the next URL as a query string', () => {
      const url = getEnterpriseAdminRegisterLogoutUrl('acme', { 'pending-invited-admin': 'true' });
      expect(decodeNext(url)).toBe(
        'https://portal.example.com/acme/admin/register?pending-invited-admin=true',
      );
    });

    it('preserves multiple params on the next URL', () => {
      const url = getEnterpriseAdminRegisterLogoutUrl('acme', { a: '1', b: '2' });
      expect(decodeNext(url)).toBe('https://portal.example.com/acme/admin/register?a=1&b=2');
    });

    it('safely encodes values containing reserved characters', () => {
      const url = getEnterpriseAdminRegisterLogoutUrl('acme', { redirect: 'https://x.test/y?z=1' });
      expect(decodeNext(url)).toBe(
        'https://portal.example.com/acme/admin/register?redirect=https%3A%2F%2Fx.test%2Fy%3Fz%3D1',
      );
    });

    it('strips a trailing slash from BASE_URL to avoid // in the next URL', () => {
      configuration.BASE_URL = 'https://portal.example.com/';
      const url = getEnterpriseAdminRegisterLogoutUrl('acme');
      expect(decodeNext(url)).toBe('https://portal.example.com/acme/admin/register');
    });
  });
});
