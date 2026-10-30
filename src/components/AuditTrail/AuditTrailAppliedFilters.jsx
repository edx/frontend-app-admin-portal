import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { Button, Chip, Stack } from '@openedx/paragon';
import { Close } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import messages from './data/messages';
import { auditTrailFiltersPropType } from './data/propTypes';
import { AUDIT_TRAIL_DEFAULT_FILTERS } from './data/constants';
import {
  getActionTypeLabel, getSourceLabel, getStatusLabel, isValidDateRange,
} from './data/utils';

const formatFilterDate = (intl, date) => intl.formatDate(
  dayjs(date).toDate(),
  { month: 'short', day: '2-digit', year: 'numeric' },
);

const getDateRangeChipLabel = (intl, startDate, endDate) => {
  if (startDate && endDate) {
    return intl.formatMessage(messages.appliedFilterDateRange, {
      startDate: formatFilterDate(intl, startDate),
      endDate: formatFilterDate(intl, endDate),
    });
  }
  if (startDate) {
    return intl.formatMessage(messages.appliedFilterStartDate, { startDate: formatFilterDate(intl, startDate) });
  }
  return intl.formatMessage(messages.appliedFilterEndDate, { endDate: formatFilterDate(intl, endDate) });
};

/**
 * Displays each applied audit trail filter as a removable chip.
 */
const AuditTrailAppliedFilters = ({ filters, onFiltersChange }) => {
  const intl = useIntl();
  const {
    actorSearch,
    actionType,
    status,
    source,
    startDate,
    endDate,
  } = filters;

  const appliedFilters = [];
  if (actorSearch?.trim()) {
    appliedFilters.push({
      key: 'actorSearch',
      label: intl.formatMessage(messages.appliedFilterActor, { value: actorSearch.trim() }),
      clearedFilters: { actorSearch: '' },
    });
  }
  if (actionType) {
    appliedFilters.push({
      key: 'actionType',
      label: intl.formatMessage(messages.appliedFilterActionType, { value: getActionTypeLabel(intl, actionType) }),
      clearedFilters: { actionType: '' },
    });
  }
  if (status) {
    appliedFilters.push({
      key: 'status',
      label: intl.formatMessage(messages.appliedFilterStatus, { value: getStatusLabel(intl, status) }),
      clearedFilters: { status: '' },
    });
  }
  if (source) {
    appliedFilters.push({
      key: 'source',
      label: intl.formatMessage(messages.appliedFilterSource, { value: getSourceLabel(intl, source) }),
      clearedFilters: { source: '' },
    });
  }
  if ((startDate || endDate) && isValidDateRange(startDate, endDate)) {
    appliedFilters.push({
      key: 'dateRange',
      label: getDateRangeChipLabel(intl, startDate, endDate),
      clearedFilters: { startDate: '', endDate: '' },
    });
  }

  if (appliedFilters.length === 0) {
    return null;
  }

  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap mb-3">
      <span className="small">{intl.formatMessage(messages.filtersApplied)}</span>
      {appliedFilters.map(({ key, label, clearedFilters }) => (
        <Chip
          key={key}
          iconAfter={Close}
          iconAfterAlt={intl.formatMessage(messages.removeFilter)}
          onIconAfterClick={() => onFiltersChange({ ...filters, ...clearedFilters })}
        >
          {label}
        </Chip>
      ))}
      <Button variant="link" size="inline" onClick={() => onFiltersChange(AUDIT_TRAIL_DEFAULT_FILTERS)}>
        {intl.formatMessage(messages.clearAllFilters)}
      </Button>
    </Stack>
  );
};

AuditTrailAppliedFilters.propTypes = {
  filters: auditTrailFiltersPropType.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
};

export default AuditTrailAppliedFilters;
