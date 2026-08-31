import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import {
  Badge, Button, Card, Col, Row, Stack,
} from '@openedx/paragon';
import { FormattedMessage, getLocale, useIntl } from '@edx/frontend-platform/i18n';

import classNames from 'classnames';
import {
  ACTIVE, CANCELED, FREE_TRIAL_BADGE, SCHEDULED, SELF_SERVICE_PAID, SELF_SERVICE_TRIAL, SUBSCRIPTION_STATUS_BADGE_MAP,
} from './data/constants';
import { SubscriptionContext } from './SubscriptionData';
import { ADMINISTER_SUBSCRIPTIONS_TARGETS } from '../ProductTours/AdminOnboardingTours/constants';
import { makePlural } from '../../utils';
import { getSubscriptionStatus } from './data/utils';
import { ROUTE_NAMES } from '../EnterpriseApp/data/constants';
import { useSubscription } from '../billing/data/hooks';

const SubscriptionCard = ({
  enterpriseUuid,
  enterpriseName,
  subscription,
  createActions,
}) => {
  const intl = useIntl();
  const {
    expirationDate,
    licenses = {},
    planType,
    startDate,
    title,
    uuid: subPlanUuid,
  } = subscription;
  const { stripeInfoByUuid } = useContext(SubscriptionContext);
  const { data: billingSubscription } = useSubscription(enterpriseUuid);
  const {
    licenseCount, currentPeriodEnd, academyName,
  } = billingSubscription ?? {};
  const loadingStripeSummary = !(subPlanUuid in (stripeInfoByUuid ?? {}));
  const { invoiceAmountDue = null, currency = null, canceledDate = null } = stripeInfoByUuid?.[subPlanUuid] ?? {};
  const formattedStartDate = dayjs(startDate).format('MMMM D, YYYY');
  const formattedExpirationDate = dayjs(expirationDate).format('MMMM D, YYYY');
  const formattedCanceledDate = canceledDate ? dayjs(canceledDate).format('MMMM D, YYYY') : null;
  const subscriptionStatus = getSubscriptionStatus(subscription, canceledDate);

  const isSelfServiceSub = [SELF_SERVICE_PAID, SELF_SERVICE_TRIAL].includes(planType);
  const periodEndDate = typeof currentPeriodEnd === 'number'
    ? new Date(currentPeriodEnd * 1000)
    : new Date(currentPeriodEnd);
  const hasValidPeriodEnd = !Number.isNaN(periodEndDate.getTime());
  const cardTitle = (isSelfServiceSub && licenseCount != null && hasValidPeriodEnd && academyName)
    ? `${enterpriseName} ${licenseCount} SUBS ${intl.formatDate(periodEndDate, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })} - Essentials ${academyName} ${planType === SELF_SERVICE_TRIAL ? 'TRIAL' : 'PAID'}`
    : title;

  let subscriptionUpcomingPrice;
  if (!loadingStripeSummary && invoiceAmountDue != null && currency) {
    const locale = getLocale();
    subscriptionUpcomingPrice = `${invoiceAmountDue.toLocaleString(locale, { style: 'currency', currency, maximumFractionDigits: 0 })} ${currency.toUpperCase()}`;
  }

  const renderDaysUntilPlanStartText = (className) => {
    if (!(subscriptionStatus === SCHEDULED)) {
      return null;
    }

    const now = dayjs();
    const planStart = dayjs(startDate);
    const daysUntilPlanStart = planStart.diff(now, 'days');
    const hoursUntilPlanStart = planStart.diff(now, 'hours');

    return (
      <span className={classNames('d-block small', className)}>
        Plan begins in {
          daysUntilPlanStart > 0 ? `${makePlural(daysUntilPlanStart, 'day')}`
            : `${makePlural(hoursUntilPlanStart, 'hour')}`
        }
      </span>
    );
  };

  const renderActions = () => {
    const actions = createActions?.(subscription) || [];

    if (actions.length === 0) {
      return null;
    }

    return actions.map(action => (
      <Button
        id={action.buttonText === 'Manage learners' ? ADMINISTER_SUBSCRIPTIONS_TARGETS.MANAGE_LEARNERS_BUTTON : action.buttonText}
        key={action.to}
        variant={action.variant}
        as={Link}
        to={action.to}
      >
        {action.buttonText}
      </Button>
    ));
  };

  const renderCardHeader = () => {
    const subtitle = (
      <div className="d-flex flex-wrap align-items-center">
        <Badge className="mr-2" variant={SUBSCRIPTION_STATUS_BADGE_MAP[subscriptionStatus].variant}>
          {subscriptionStatus}
        </Badge>
        {planType === SELF_SERVICE_TRIAL && (
          <>
            <Badge className="mr-2" variant="info">
              {FREE_TRIAL_BADGE}
            </Badge>
            {(subscriptionStatus === SCHEDULED || subscriptionStatus === ACTIVE) && (
              <span className="d-inline mt-2">
                <FormattedMessage
                  id="subscriptions.subscriptionCard.freeTrialDescription"
                  defaultMessage="Your 14-day free trial will conclude on {boldDate}. Your paid subscription will automatically start, and the {subscriptionUpcomingPrice} subscription fee will be charged to the card on file. {stripeLink}"
                  description="Message shown to warn customers with a free trial that they will be charged for the full subscription"
                  values={{
                    boldDate: <span className="font-weight-bold">{formattedExpirationDate}</span>,
                    subscriptionUpcomingPrice: <span className="font-weight-bold">{subscriptionUpcomingPrice}</span>,
                    stripeLink: (
                      <Link
                        className="ml-2"
                        to={`/${enterpriseUuid}/admin/${ROUTE_NAMES.billing}`}
                      >
                        Manage subscription
                      </Link>),
                  }}
                />
              </span>
            )}
            {subscriptionStatus === CANCELED && (
              <span className="d-inline mt-2">
                <FormattedMessage
                  id="subscriptions.subscriptionCard.canceledTrialDescription"
                  defaultMessage={
                    'Your plan is scheduled to end on {cancellation_date}. Your learners can still access their courses until then. Changed your mind? '
                    + "Click on the {boldButton} button above to keep your team's progress uninterrupted."
                  }
                  description="Message shown to inform customers that they have canceled their free trial"
                  values={{
                    cancellation_date: <span className="font-weight-bold">{formattedCanceledDate}</span>,
                    boldButton: <span className="font-weight-bold">Manage subscription</span>,
                  }}
                />
              </span>
            )}
          </>
        )}
        {planType !== SELF_SERVICE_TRIAL && (
          <span>
            {formattedStartDate} - {formattedExpirationDate}
          </span>
        )}
      </div>
    );
    return (
      <Card.Header
        className={classNames({
          'pb-1': subscriptionStatus !== ACTIVE,
        })}
        title={cardTitle}
        subtitle={subtitle}
        actions={(
          <div>
            {renderActions()}
            {renderDaysUntilPlanStartText('mt-4')}
          </div>
        )}
      />
    );
  };

  const renderCardSection = () => {
    if (subscriptionStatus !== ACTIVE) {
      return null;
    }

    return (
      <Card.Section
        title="Licenses"
        muted
      >
        <Row className="d-flex flex-row justify-content-between w-md-75">
          {['Assigned', 'Activated', 'Allocated', 'Unassigned'].map(licenseStatus => (
            <Col xs="6" md="auto" className="d-flex flex-column mb-3 mb-md-0" key={licenseStatus}>
              <span className="small">{licenseStatus}</span>
              <span>{licenses[licenseStatus.toLowerCase()]} of {licenses.total}</span>
            </Col>
          ))}
        </Row>
      </Card.Section>
    );
  };

  return (
    <Card
      orientation="horizontal"
      className={classNames('subscription-card', {
        'pb-4': subscriptionStatus !== ACTIVE,
      })}
    >
      <Card.Body>
        <Stack gap={4}>
          {renderCardHeader()}
          {renderCardSection()}
        </Stack>
      </Card.Body>
    </Card>
  );
};

const mapStateToProps = state => ({
  enterpriseUuid: state.portalConfiguration.enterpriseId,
  enterpriseName: state.portalConfiguration.enterpriseName,
});

SubscriptionCard.defaultProps = {
  createActions: null,
  enterpriseName: null,
};

SubscriptionCard.propTypes = {
  enterpriseUuid: PropTypes.string.isRequired,
  enterpriseName: PropTypes.string,
  subscription: PropTypes.shape({
    expirationDate: PropTypes.string.isRequired,
    licenses: PropTypes.shape({
      assigned: PropTypes.number.isRequired,
      activated: PropTypes.number.isRequired,
      allocated: PropTypes.number.isRequired,
      unassigned: PropTypes.number.isRequired,
      total: PropTypes.number.isRequired,
    }),
    planType: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    uuid: PropTypes.string.isRequired,
  }).isRequired,
  createActions: PropTypes.func,
};

export default connect(mapStateToProps)(SubscriptionCard);
