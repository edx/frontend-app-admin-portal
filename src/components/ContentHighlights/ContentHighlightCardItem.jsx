import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  Card, Form, Hyperlink, Icon, Truncate,
} from '@openedx/paragon';
import { Archive } from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import cardImageCapFallbackSrc from '@edx/brand/paragon/images/card-imagecap-fallback.png';

import { features } from '../../config';
import { getContentHighlightCardFooter } from './data/utils';
import StarButton from './StarButton';

const ContentHighlightCardItem = ({
  isLoading,
  title,
  hyperlinkAttrs,
  contentType,
  partners,
  cardImageUrl,
  price,
  archived,
  editHighlightsEnabled,
  uuid,
  isStarred,
  onToggleStar,
  isSelectable,
  isSelected,
  onToggleSelect,
}) => {
  const {
    FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING,
  } = features;
  const intl = useIntl();
  const formattedContentTypes = {
    course: intl.formatMessage({
      id: 'highlights.highlights.tab.content.type.course.label',
      defaultMessage: 'Course',
      description: 'Label for course content type in the highlight content card',
    }),
    program: intl.formatMessage({
      id: 'highlights.highlights.tab.content.type.program.label',
      defaultMessage: 'Program',
      description: 'Label for program content type in the highlight content card',
    }),
    learnerpathway: intl.formatMessage({
      id: 'highlights.highlights.tab.content.type.pathway.label',
      defaultMessage: 'Pathway',
      description: 'Label for pathway content type in the highlight content card',
    }),
  };
  const cardInfo = {
    cardImgSrc: cardImageUrl,
    cardLogoSrc: partners.length === 1 ? partners[0].logoImageUrl : undefined,
    cardLogoAlt: partners.length === 1 ? `${partners[0].name}'s logo` : undefined,
    cardTitle: <Truncate lines={3} title={title}>{title}</Truncate>,
    cardSubtitle: partners.map(p => p.name).join(', '),
    cardFooter: getContentHighlightCardFooter(
      { price, formattedContentType: formattedContentTypes[contentType?.toLowerCase()] },
    ),
  };
  if (hyperlinkAttrs) {
    cardInfo.cardTitle = (
      <Hyperlink onClick={hyperlinkAttrs.onClick} destination={hyperlinkAttrs.href} target={hyperlinkAttrs.target} data-testid="hyperlink-title">
        <Truncate elementType="span" lines={3} title={title}>{title}</Truncate>
      </Hyperlink>
    );
  }

  let cardWrapperTestId;
  if ((editHighlightsEnabled || isSelectable) && uuid) {
    cardWrapperTestId = archived ? `card-wrapper-archived-${uuid}` : `card-wrapper-${uuid}`;
  }

  const card = (
    <Card
      variant={contentType === 'course' ? 'light' : 'dark'}
      isLoading={isLoading}
      className={classNames('h-100', {
        'position-relative w-100': (editHighlightsEnabled || isSelectable) && uuid,
      })}
      data-testid={cardWrapperTestId}
    >
      {editHighlightsEnabled && uuid && (
        <StarButton
          title={title}
          uuid={uuid}
          isStarred={Boolean(isStarred)}
          onToggleStar={onToggleStar}
        />
      )}
      {isSelectable && uuid && (
        <div
          className="p-0 border-0 bg-transparent"
          data-testid={`select-checkbox-wrapper-${uuid}`}
          style={{
            position: 'absolute',
            top: '1px',
            right: '-25px',
            width: '24px',
            height: '24px',
          }}
        >
          <Form.Checkbox
            aria-label={intl.formatMessage(
              {
                id: 'highlights.card.select_for_removal.aria.label',
                defaultMessage: 'Select {title} for removal',
                description: 'Checkbox aria label for selecting highlighted content for removal',
              },
              { title },
            )}
            checked={isSelected}
            onChange={onToggleSelect}
            data-testid={`select-checkbox-${uuid}`}
          />
        </div>
      )}
      <Card.ImageCap
        src={cardInfo.cardImgSrc}
        fallbackSrc={cardImageCapFallbackSrc}
        srcAlt=""
        logoSrc={cardInfo.cardLogoSrc}
        logoAlt={cardInfo.cardLogoAlt}
      />
      <Card.Header
        title={cardInfo.cardTitle}
        subtitle={(
          <Truncate lines={2} title={cardInfo.cardSubtitle}>{cardInfo.cardSubtitle}</Truncate>
        )}
      />
      {contentType && (
        <>
          <Card.Section />
          {FEATURE_HIGHLIGHTS_ARCHIVE_MESSAGING && archived && (
          <p className="ml-3 mb-4 mt-0 d-flex small text-gray-400">
            <Icon src={Archive} className="mr-1" />
            <FormattedMessage
              id="highlights.highlights.tab.highlight.item.card.archived.content.label"
              defaultMessage="Archived"
              description="Label for archived content in the highlight content card"
            />
          </p>
          )}
          <Card.Footer
            textElement={cardInfo.cardFooter}
          />
        </>
      )}
    </Card>
  );

  return card;
};

ContentHighlightCardItem.propTypes = {
  isLoading: PropTypes.bool,
  cardImageUrl: PropTypes.string,
  title: PropTypes.string.isRequired,
  hyperlinkAttrs: PropTypes.shape({
    href: PropTypes.string,
    target: PropTypes.string,
    onClick: PropTypes.func,
  }),
  contentType: PropTypes.oneOf(['course', 'program', 'learnerpathway']).isRequired,
  partners: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    uuid: PropTypes.string,
    logoImageUrl: PropTypes.string,
  })).isRequired,
  price: PropTypes.number,
  archived: PropTypes.bool,
  editHighlightsEnabled: PropTypes.bool,
  uuid: PropTypes.string,
  isStarred: PropTypes.bool,
  onToggleStar: PropTypes.func,
  isSelectable: PropTypes.bool,
  isSelected: PropTypes.bool,
  onToggleSelect: PropTypes.func,
};

ContentHighlightCardItem.defaultProps = {
  isLoading: false,
  hyperlinkAttrs: undefined,
  cardImageUrl: undefined,
  price: undefined,
  archived: false,
  editHighlightsEnabled: false,
  uuid: undefined,
  isStarred: false,
  onToggleStar: undefined,
  isSelectable: false,
  isSelected: false,
  onToggleSelect: undefined,
};

export default ContentHighlightCardItem;
