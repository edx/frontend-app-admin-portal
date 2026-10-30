import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash-es';
import { Form, Icon } from '@openedx/paragon';
import { Search } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import messages from './data/messages';
import { auditTrailFiltersPropType } from './data/propTypes';
import { AUDIT_TRAIL_STATUS_OPTIONS } from './data/constants';
import {
  getActionTypeLabel,
  getSourceLabel,
  getStatusLabel,
  isValidDateRange,
} from './data/utils';

const ACTOR_SEARCH_DEBOUNCE_MS = 300;

const AuditTrailFilters = ({
  filters,
  onFiltersChange,
  actionTypeOptions,
  sourceOptions,
}) => {
  const intl = useIntl();
  const [actorSearch, setActorSearch] = useState(filters.actorSearch);

  // Keep the actor search input in sync when the filter is cleared outside this input (e.g. "Clear all").
  useEffect(() => {
    setActorSearch(filters.actorSearch);
  }, [filters.actorSearch]);

  // The debounced actor search reads the latest filters and callback from a ref, so it's created once and a
  // pending search isn't cancelled (and lost) when another filter changes or the parent re-renders.
  const latestPropsRef = useRef({ filters, onFiltersChange });
  latestPropsRef.current = { filters, onFiltersChange };

  const debouncedActorSearchChange = useMemo(
    () => debounce((value) => {
      const { filters: latestFilters, onFiltersChange: latestOnFiltersChange } = latestPropsRef.current;
      latestOnFiltersChange({ ...latestFilters, actorSearch: value });
    }, ACTOR_SEARCH_DEBOUNCE_MS),
    [],
  );

  useEffect(() => () => debouncedActorSearchChange.cancel(), [debouncedActorSearchChange]);

  const handleFilterChange = (key) => (e) => {
    onFiltersChange({ ...filters, [key]: e.target.value });
  };

  const handleActorSearchChange = (e) => {
    setActorSearch(e.target.value);
    debouncedActorSearchChange(e.target.value);
  };

  const isDateRangeValid = isValidDateRange(filters.startDate, filters.endDate);

  return (
    <div className="row">
      <Form.Group className="col-12 col-sm-6 col-lg-2" controlId="audit-trail-filter-actor">
        <Form.Label>{intl.formatMessage(messages.filterActorLabel)}</Form.Label>
        <Form.Control
          size="sm"
          type="text"
          value={actorSearch}
          onChange={handleActorSearchChange}
          placeholder={intl.formatMessage(messages.filterActorPlaceholder)}
          leadingElement={<Icon src={Search} />}
        />
      </Form.Group>
      <Form.Group className="col-12 col-sm-6 col-lg-2" controlId="audit-trail-filter-action-type">
        <Form.Label>{intl.formatMessage(messages.filterActionTypeLabel)}</Form.Label>
        <Form.Control
          size="sm"
          as="select"
          value={filters.actionType}
          onChange={handleFilterChange('actionType')}
        >
          <option value="">{intl.formatMessage(messages.filterActionTypeAll)}</option>
          {actionTypeOptions.map(actionType => (
            <option key={actionType} value={actionType}>{getActionTypeLabel(intl, actionType)}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group className="col-12 col-sm-6 col-lg-2" controlId="audit-trail-filter-status">
        <Form.Label>{intl.formatMessage(messages.filterStatusLabel)}</Form.Label>
        <Form.Control
          size="sm"
          as="select"
          value={filters.status}
          onChange={handleFilterChange('status')}
        >
          <option value="">{intl.formatMessage(messages.filterStatusAll)}</option>
          {AUDIT_TRAIL_STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{getStatusLabel(intl, status)}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group className="col-12 col-sm-6 col-lg-2" controlId="audit-trail-filter-source">
        <Form.Label>{intl.formatMessage(messages.filterSourceLabel)}</Form.Label>
        <Form.Control
          size="sm"
          as="select"
          value={filters.source}
          onChange={handleFilterChange('source')}
        >
          <option value="">{intl.formatMessage(messages.filterSourceAll)}</option>
          {sourceOptions.map(source => (
            <option key={source} value={source}>{getSourceLabel(intl, source)}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group
        className="col-12 col-sm-6 col-lg-2"
        controlId="audit-trail-filter-start-date"
        isInvalid={!isDateRangeValid}
      >
        <Form.Label>{intl.formatMessage(messages.filterStartDateLabel)}</Form.Label>
        <Form.Control
          size="sm"
          type="date"
          value={filters.startDate}
          max={filters.endDate || undefined}
          onChange={handleFilterChange('startDate')}
        />
        {!isDateRangeValid && (
          <Form.Control.Feedback type="invalid">
            {intl.formatMessage(messages.filterStartDateAfterEndDate)}
          </Form.Control.Feedback>
        )}
      </Form.Group>
      <Form.Group className="col-12 col-sm-6 col-lg-2" controlId="audit-trail-filter-end-date">
        <Form.Label>{intl.formatMessage(messages.filterEndDateLabel)}</Form.Label>
        <Form.Control
          size="sm"
          type="date"
          value={filters.endDate}
          min={filters.startDate || undefined}
          onChange={handleFilterChange('endDate')}
        />
      </Form.Group>
    </div>
  );
};

AuditTrailFilters.propTypes = {
  filters: auditTrailFiltersPropType.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  actionTypeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  sourceOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default AuditTrailFilters;
