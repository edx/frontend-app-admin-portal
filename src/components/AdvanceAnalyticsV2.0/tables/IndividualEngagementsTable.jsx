import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import AnalyticsTable from './AnalyticsTable';
import { ANALYTICS_TABS } from '../data/constants';

// Renders the segmented engagement booleans (0/1) as human readable Yes/No.
const renderEngagementFlag = (intl) => ({ value }) => (value ? intl.formatMessage({
  id: 'analytics.individual.engagements.table.engagement.yes',
  defaultMessage: 'Yes',
  description: 'Affirmative engagement indicator',
}) : intl.formatMessage({
  id: 'analytics.individual.engagements.table.engagement.no',
  defaultMessage: 'No',
  description: 'Negative engagement indicator',
}));

const IndividualEngagementsTable = ({
  startDate,
  endDate,
  enterpriseId,
  groupUUID,
  courseType,
  budgetUUID,
  course,
  trackCsvDownloadClick,
}) => {
  const intl = useIntl();

  return (
    <div className="individual-engagements-datatable-container mt-4">
      <div className="mb-4 rounded-lg">
        <AnalyticsTable
          name={ANALYTICS_TABS.ENGAGEMENTS}
          tableTitle={intl.formatMessage({
            id: 'analytics.individual.engagements.table.title',
            defaultMessage: 'Individual Engagements',
            description: 'Title for the individual engagements datatable.',
          })}
          tableSubtitle={intl.formatMessage({
            id: 'analytics.individual.engagements.table.subtitle',
            defaultMessage: 'See the engagement levels of learners from your organization.',
            description: 'Subtitle for the individual engagements datatable.',
          })}
          csvButtonText={intl.formatMessage({
            id: 'analytics.individual.engagements.table.csv.button',
            defaultMessage: 'Download Engagement CSV',
            description: 'Label for the download CSV button on the individual engagements table',
          })}
          entityId="individual-engagements-table"
          startDate={startDate}
          endDate={endDate}
          enterpriseId={enterpriseId}
          groupUUID={groupUUID}
          courseType={courseType}
          budgetUUID={budgetUUID}
          course={course}
          trackCsvDownloadClick={trackCsvDownloadClick}
          tableColumns={[
            {
              Header: intl.formatMessage({
                id: 'analytics.individual.engagements.table.column.email',
                defaultMessage: 'Email',
                description: 'Label for the email column in individual engagements table',
              }),
              accessor: 'email',
            },
            {
              Header: intl.formatMessage({
                id: 'analytics.individual.engagements.table.column.course.title',
                defaultMessage: 'Course Title',
                description: 'Label for the course title column in individual engagements table',
              }),
              accessor: 'courseTitle',
            },
            {
              Header: intl.formatMessage({
                id: 'analytics.individual.engagements.table.column.activity.date',
                defaultMessage: 'Activity Date',
                description: 'Label for the activity date column in individual engagements table',
              }),
              accessor: 'activityDate',
            },
            {
              Header: intl.formatMessage({
                id: 'analytics.individual.engagements.table.column.course.subject',
                defaultMessage: 'Course Subject',
                description: 'Label for the course subject column in individual engagements table',
              }),
              accessor: 'courseSubject',
            },
            {
              Header: intl.formatMessage({
                id: 'analytics.individual.engagements.table.column.learning.hours',
                defaultMessage: 'Learning Hours',
                description: 'Label for the learning hours column in individual engagements table',
              }),
              accessor: 'learningTimeHours',
            },
            {
              Header: intl.formatMessage({
                id: 'analytics.individual.engagements.table.column.video',
                defaultMessage: 'Video Engagement',
                description: 'Label for the video engagement column in individual engagements table',
              }),
              accessor: 'isEngagedVideo',
              Cell: renderEngagementFlag(intl),
            },
            {
              Header: intl.formatMessage({
                id: 'analytics.individual.engagements.table.column.forum',
                defaultMessage: 'Forum Engagement',
                description: 'Label for the forum engagement column in individual engagements table',
              }),
              accessor: 'isEngagedForum',
              Cell: renderEngagementFlag(intl),
            },
            {
              Header: intl.formatMessage({
                id: 'analytics.individual.engagements.table.column.problem',
                defaultMessage: 'Problem Engagement',
                description: 'Label for the problem engagement column in individual engagements table',
              }),
              accessor: 'isEngagedProblem',
              Cell: renderEngagementFlag(intl),
            },
          ]}
        />
      </div>
    </div>
  );
};

IndividualEngagementsTable.propTypes = {
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  enterpriseId: PropTypes.string.isRequired,
  groupUUID: PropTypes.string,
  courseType: PropTypes.string,
  budgetUUID: PropTypes.string,
  course: PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }),
  trackCsvDownloadClick: PropTypes.func,
};

IndividualEngagementsTable.defaultProps = {
  groupUUID: '',
  courseType: undefined,
  budgetUUID: undefined,
  course: undefined,
};

export default IndividualEngagementsTable;
