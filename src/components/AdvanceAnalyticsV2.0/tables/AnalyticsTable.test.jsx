/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';
import { QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'jest-axe';
import { saveAs } from 'file-saver';
import AnalyticsTable from './AnalyticsTable';
import { useEnterpriseAnalyticsData, usePaginatedData } from '../data/hooks';
import EnterpriseDataApiService from '../../../data/services/EnterpriseDataApiService';
import { queryClient } from '../../test/testUtils';
import { analyticsDataTableKeys } from '../data/constants';
import '@testing-library/jest-dom';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

// Mock hooks
jest.mock('../data/hooks', () => ({
  useEnterpriseAnalyticsData: jest.fn(),
  usePaginatedData: jest.fn(),
}));

// Mock service
jest.mock('../../../data/services/EnterpriseDataApiService', () => ({
  getAnalyticsCSVDownloadURL: jest.fn(() => '/mock.csv'),
  fetchAnalyticsCSV: jest.fn(() => Promise.resolve({ data: 'course_key,course_title\nkey,title' })),
}));

jest.mock('file-saver', () => ({
  ...jest.requireActual('file-saver'),
  saveAs: jest.fn(),
}));

jest.mock('@edx/frontend-platform/logging', () => ({
  logError: jest.fn(),
}));

const defaultProps = {
  name: 'leaderboardTable',
  tableColumns: [],
  tableTitle: 'Leaderboard Table',
  entityId: 'entity-1',
  enterpriseId: 'enterprise-1',
  startDate: '2023-01-01',
  endDate: '2023-02-01',
  trackCsvDownloadClick: jest.fn(),
};

function readBlobBytes(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

function wrapWithProviders(ui) {
  return (
    <Router>
      <QueryClientProvider client={queryClient()}>
        <IntlProvider locale="en">
          {ui}
        </IntlProvider>
      </QueryClientProvider>
    </Router>
  );
}

function renderWithIntl(ui) {
  return render(wrapWithProviders(ui));
}

describe('AnalyticsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePaginatedData.mockReturnValue({
      data: [],
      itemCount: 0,
      pageCount: 1,
    });
  });

  it('has no accessibility violations', async () => {
    useEnterpriseAnalyticsData.mockReturnValue({ isFetching: false, isError: false, data: null });
    const { container } = renderWithIntl(<AnalyticsTable {...defaultProps} />);
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  test('disables CSV button when data.results is empty', () => {
    useEnterpriseAnalyticsData.mockReturnValue({
      data: { results: [] },
      isFetching: false,
    });

    renderWithIntl(<AnalyticsTable {...defaultProps} />);

    const button = screen.getByRole('button', { name: /download/i });

    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  test('enables CSV button when data.results has items', () => {
    useEnterpriseAnalyticsData.mockReturnValue({
      data: { results: [{ id: 1 }] },
      isFetching: false,
    });

    renderWithIntl(<AnalyticsTable {...defaultProps} />);

    const button = screen.getByRole('button', { name: /download/i });

    expect(button).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('clicking CSV button fetches the CSV and saves it with a UTF-8 BOM', async () => {
    useEnterpriseAnalyticsData.mockReturnValue({
      data: { results: [{ id: 1 }] },
      isFetching: false,
    });

    const props = {
      ...defaultProps,
      courseType: 'special',
      course: { value: 'course-123', label: 'Course 123' },
      budgetUUID: 'budget-xyz',
      groupUUID: 'group-abc',
    };

    renderWithIntl(<AnalyticsTable {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => expect(EnterpriseDataApiService.fetchAnalyticsCSV).toHaveBeenCalledWith(
      analyticsDataTableKeys[props.name],
      props.enterpriseId,
      {
        start_date: props.startDate,
        end_date: props.endDate,
        course_type: props.courseType,
        course_key: props.course.value,
        budget_uuid: props.budgetUUID,
        group_uuid: props.groupUUID,
      },
    ));

    await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1));
    const [blobArg, filenameArg] = saveAs.mock.calls[0];
    expect(filenameArg).toBe(`${props.name}.csv`);
    expect(blobArg).toBeInstanceOf(Blob);
    // No manual BOM here: file-saver's saveAs auto-prepends one for this exact
    // charset=utf-8 blob type, so adding one ourselves would double it up.
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    const bytes = await readBlobBytes(blobArg);
    expect(String.fromCharCode(...bytes)).toBe('course_key,course_title\nkey,title');

    expect(defaultProps.trackCsvDownloadClick).toHaveBeenCalledWith('entity-1');
  });

  test('resets the CSV button state when the date range filter changes', async () => {
    useEnterpriseAnalyticsData.mockReturnValue({
      data: { results: [{ id: 1 }] },
      isFetching: false,
    });

    const { rerender } = renderWithIntl(<AnalyticsTable {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(await screen.findByRole('button', { name: /csv downloaded/i })).toBeInTheDocument();

    // Simulate the admin changing the date range filter, which reloads new data.
    rerender(wrapWithProviders(<AnalyticsTable {...defaultProps} startDate="2023-03-01" />));

    expect(screen.queryByRole('button', { name: /csv downloaded/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^download/i })).toBeInTheDocument();
  });

  test('shows an error state and logs the error when the CSV download fails', async () => {
    useEnterpriseAnalyticsData.mockReturnValue({
      data: { results: [{ id: 1 }] },
      isFetching: false,
    });

    const downloadError = new Error('Network Error');
    EnterpriseDataApiService.fetchAnalyticsCSV.mockRejectedValueOnce(downloadError);

    renderWithIntl(<AnalyticsTable {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /download/i }));

    expect(await screen.findByRole('button', { name: /error/i })).toBeInTheDocument();
    expect(saveAs).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(downloadError);
  });
});
