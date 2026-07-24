/* eslint-disable import/no-extraneous-dependencies */
import {
  render, screen, waitFor, within, fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { BrowserRouter as Router } from 'react-router-dom';

import { axe } from 'jest-axe';
import { queryClient } from '../../test/testUtils';
import EnterpriseDataApiService from '../../../data/services/EnterpriseDataApiService';
import IndividualEngagementsTable from './IndividualEngagementsTable';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

jest.spyOn(EnterpriseDataApiService, 'fetchAdminAnalyticsData');
jest.spyOn(EnterpriseDataApiService, 'getAnalyticsCSVDownloadURL').mockReturnValue('/mock.csv');
jest.spyOn(EnterpriseDataApiService, 'fetchAnalyticsCSV').mockResolvedValue({ data: 'email,course_title\na@b.com,title' });

const axiosMock = new MockAdapter(axios);
getAuthenticatedHttpClient.mockReturnValue(axios);

const mockEngagementsData = {
  next: null,
  previous: null,
  count: 2,
  num_pages: 1,
  current_page: 1,
  results: [
    {
      email: 'learner1@example.com',
      courseTitle: 'Intro to React',
      activityDate: '2024-10-01',
      courseSubject: 'Computer Science',
      learningTimeHours: 1.5,
      isEngagedVideo: 1,
      isEngagedForum: 0,
      isEngagedProblem: 1,
    },
    {
      email: 'learner2@example.com',
      courseTitle: 'Advanced Python',
      activityDate: '2024-10-15',
      courseSubject: 'Programming',
      learningTimeHours: 2.25,
      isEngagedVideo: 0,
      isEngagedForum: 1,
      isEngagedProblem: 0,
    },
  ],
};

axiosMock.onGet().reply(200, mockEngagementsData);

const TEST_ENTERPRISE_ID = '33ce6562-95e0-4ecf-a2a7-7d407eb96f69';

describe('IndividualEngagementsTable Component', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Router><QueryClientProvider client={queryClient()}><IntlProvider locale="en"><IndividualEngagementsTable enterpriseId={TEST_ENTERPRISE_ID} startDate="2024-10-01" endDate="2024-10-31" /></IntlProvider></QueryClientProvider></Router>);
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  test('renders correct title, subtitle and download button', async () => {
    render(
      <Router>
        <QueryClientProvider client={queryClient()}>
          <IntlProvider locale="en">
            <IndividualEngagementsTable
              enterpriseId={TEST_ENTERPRISE_ID}
              startDate="2024-10-01"
              endDate="2024-10-31"
              courseType="special"
              budgetUUID="budget-xyz"
            />
          </IntlProvider>
        </QueryClientProvider>
      </Router>,
    );

    expect(screen.getByText('Individual Engagements')).toBeInTheDocument();
    expect(screen.getByText('See the engagement levels of learners from your organization.')).toBeInTheDocument();
    const downloadButton = screen.getByRole('button', { name: /download engagement csv/i });
    expect(downloadButton).toBeInTheDocument();

    // The button is disabled until the table's data finishes loading.
    await waitFor(() => expect(downloadButton).not.toHaveAttribute('aria-disabled', 'true'));
    fireEvent.click(downloadButton);

    await waitFor(() => expect(EnterpriseDataApiService.fetchAnalyticsCSV).toHaveBeenCalledWith(
      'engagementsTable',
      TEST_ENTERPRISE_ID,
      expect.objectContaining({
        start_date: '2024-10-01',
        end_date: '2024-10-31',
        course_type: 'special',
        budget_uuid: 'budget-xyz',
      }),
    ));
  });

  test('renders the table rows with correct values incl. segmented columns', async () => {
    render(
      <Router>
        <QueryClientProvider client={queryClient()}>
          <IntlProvider locale="en">
            <IndividualEngagementsTable
              enterpriseId={TEST_ENTERPRISE_ID}
              startDate="2024-10-01"
              endDate="2024-10-31"
            />
          </IntlProvider>
        </QueryClientProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(EnterpriseDataApiService.fetchAdminAnalyticsData).toHaveBeenCalled();

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(mockEngagementsData.results.length + 1); // +1 for header

      const columnHeaders = within(rows[0]).getAllByRole('columnheader');
      expect(columnHeaders[0]).toHaveTextContent('Email');
      expect(columnHeaders[1]).toHaveTextContent('Course Title');
      expect(columnHeaders[2]).toHaveTextContent('Activity Date');
      expect(columnHeaders[3]).toHaveTextContent('Course Subject');
      expect(columnHeaders[4]).toHaveTextContent('Learning Hours');
      expect(columnHeaders[5]).toHaveTextContent('Video Engagement');
      expect(columnHeaders[6]).toHaveTextContent('Forum Engagement');
      expect(columnHeaders[7]).toHaveTextContent('Problem Engagement');

      mockEngagementsData.results.forEach((item, idx) => {
        const row = within(rows[idx + 1]).getAllByRole('cell');
        expect(row[0]).toHaveTextContent(item.email);
        expect(row[1]).toHaveTextContent(item.courseTitle);
        expect(row[2]).toHaveTextContent(item.activityDate);
        expect(row[3]).toHaveTextContent(item.courseSubject);
        expect(row[4]).toHaveTextContent(String(item.learningTimeHours));
        expect(row[5]).toHaveTextContent(item.isEngagedVideo ? 'Yes' : 'No');
        expect(row[6]).toHaveTextContent(item.isEngagedForum ? 'Yes' : 'No');
        expect(row[7]).toHaveTextContent(item.isEngagedProblem ? 'Yes' : 'No');
      });
    });
  });
});
