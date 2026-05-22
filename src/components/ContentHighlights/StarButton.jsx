import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@openedx/paragon';
import { StarFilled, StarOutline } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

const StarButton = ({
  title, uuid, isStarred, onToggleStar,
}) => {
  const intl = useIntl();
  const ariaLabel = isStarred
    ? intl.formatMessage(
      {
        id: 'highlights.card.unstar.aria.label',
        defaultMessage: 'Unstar {title}',
        description: 'Unstar button aria label',
      },
      { title },
    )
    : intl.formatMessage(
      {
        id: 'highlights.card.star.aria.label',
        defaultMessage: 'Star {title}',
        description: 'Star button aria label',
      },
      { title },
    );

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleStar();
      }}
      data-testid={`star-btn-${uuid}`}
      className="star-btn"
    >
      <Icon src={isStarred ? StarFilled : StarOutline} />
    </button>
  );
};

StarButton.propTypes = {
  title: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired,
  isStarred: PropTypes.bool.isRequired,
  onToggleStar: PropTypes.func.isRequired,
};

export default StarButton;
