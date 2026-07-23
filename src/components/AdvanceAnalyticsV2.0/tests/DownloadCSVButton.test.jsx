import React from 'react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { saveAs } from 'file-saver';
import { axe } from 'jest-axe';
import DownloadCSVButton from '../DownloadCSVButton';
import '@testing-library/jest-dom/extend-expect';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

jest.mock('file-saver', () => ({
  ...jest.requireActual('file-saver'),
  saveAs: jest.fn(),
}));

jest.mock('@edx/frontend-platform/logging', () => ({
  ...jest.requireActual('@edx/frontend-platform/logging'),
  logError: jest.fn(),
}));
const mockJsonData = [
  { date: '2024-01-01', count: 10, enroll_type: 'verified' },
  { date: '2024-01-02', count: 20, enroll_type: 'certificate' },
  { date: '2024-01-03', count: 30, enroll_type: 'verified' },
  { date: '2024-01-04', count: 40, enroll_type: 'audit' },
  { date: '2024-01-05', count: 50, enroll_type: 'verified' },
  { date: '2024-01-06', count: 60, enroll_type: 'verified' },
  { date: '2024-01-07', count: 70, enroll_type: 'certificate' },
  { date: '2024-01-08', count: 80, enroll_type: 'verified' },
  { date: '2024-01-09', count: 90, enroll_type: 'certificate' },
  { date: '2024-01-10', count: 100, enroll_type: 'certificate' },
];
// Mirrors DownloadCSVButton's jsonToCSV: each field is run through JSON.stringify (so
// strings are quoted, numbers are not) and rows are joined with CRLF line endings.
const mockJsonAsCSV = [
  'date,count,enroll_type',
  ...mockJsonData.map(
    (row) => [row.date, row.count, row.enroll_type].map((value) => JSON.stringify(value)).join(','),
  ),
].join('\r\n');

function readBlobBytes(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

const mockTrackCsvDownloadClick = jest.fn();

const DEFAULT_PROPS = {
  jsonData: mockJsonData,
  csvFileName: 'completions.csv',
  entityId: 'test-entity',
  trackCsvDownloadClick: mockTrackCsvDownloadClick,
};

describe('DownloadCSVButton', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <IntlProvider locale="en">
        <DownloadCSVButton {...DEFAULT_PROPS} />
      </IntlProvider>,
    );
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders download csv button correctly', async () => {
    render(
      <IntlProvider locale="en">
        <DownloadCSVButton {...DEFAULT_PROPS} />
      </IntlProvider>,
    );

    expect(screen.getByTestId('plotly-charts-download-csv-button')).toBeInTheDocument();
  });

  it('handles successful CSV download and calls tracking', async () => {
    const user = userEvent.setup();
    render(
      <IntlProvider locale="en">
        <DownloadCSVButton {...DEFAULT_PROPS} />
      </IntlProvider>,
    );

    // Click the download button.
    await user.click(screen.getByTestId('plotly-charts-download-csv-button'));

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blobArg, filenameArg] = saveAs.mock.calls[0];
    expect(filenameArg).toBe('completions.csv');
    expect(blobArg).toBeInstanceOf(Blob);
    // No manual BOM here: file-saver's saveAs auto-prepends one for this exact
    // charset=utf-8 blob type, so adding one ourselves would double it up.
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    const bytes = await readBlobBytes(blobArg);
    expect(String.fromCharCode(...bytes)).toBe(mockJsonAsCSV);

    expect(mockTrackCsvDownloadClick).toHaveBeenCalledWith('test-entity');
  });
});
