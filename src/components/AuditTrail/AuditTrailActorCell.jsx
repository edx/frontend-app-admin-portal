import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import { AUDIT_TRAIL_ACTOR_TYPES } from './data/constants';
import messages, { ACTOR_TYPE_MESSAGES } from './data/messages';

/**
 * Displays who performed an audit trail action. Actor names are resolved by the backend; this cell
 * never assumes a missing actor is the current admin, and falls back to "Unknown user" (with the LMS
 * user ID when available) for human actors whose name could not be resolved.
 */
const AuditTrailActorCell = ({ row }) => {
  const intl = useIntl();
  const {
    actorType,
    actorName,
    actorEmail,
    actorLmsUserId,
  } = row.original;

  const isSystemActor = actorType === AUDIT_TRAIL_ACTOR_TYPES.system;
  const roleLabel = ACTOR_TYPE_MESSAGES[actorType] ? intl.formatMessage(ACTOR_TYPE_MESSAGES[actorType]) : null;

  let primaryText;
  let secondaryText;
  if (isSystemActor) {
    primaryText = intl.formatMessage(messages.actorSystem);
    secondaryText = intl.formatMessage(messages.actorAutomated);
  } else if (actorName || actorEmail) {
    primaryText = actorName || actorEmail;
    secondaryText = [roleLabel, actorName ? actorEmail : null].filter(Boolean).join(' · ');
  } else {
    primaryText = intl.formatMessage(messages.actorUnknown);
    secondaryText = [
      roleLabel,
      actorLmsUserId ? intl.formatMessage(messages.actorLmsUserId, { lmsUserId: actorLmsUserId }) : null,
    ].filter(Boolean).join(' · ');
  }

  return (
    <div>
      <div>{primaryText}</div>
      {secondaryText && <div className="small text-muted">{secondaryText}</div>}
    </div>
  );
};

AuditTrailActorCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      actorType: PropTypes.string,
      actorName: PropTypes.string,
      actorEmail: PropTypes.string,
      actorLmsUserId: PropTypes.number,
    }).isRequired,
  }).isRequired,
};

export default AuditTrailActorCell;
