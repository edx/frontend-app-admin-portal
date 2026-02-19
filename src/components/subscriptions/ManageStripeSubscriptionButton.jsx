import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { logError } from '@edx/frontend-platform/logging';
import { useIntl } from '@edx/frontend-platform/i18n';
import { camelCaseObject } from '@edx/frontend-platform/utils';
import { Icon, StatefulButton } from '@openedx/paragon';
import { Error, Launch, SpinnerSimple } from '@openedx/paragon/icons';
import EnterpriseAccessApiService from '../../data/services/EnterpriseAccessApiService';

const ManageStripeSubscriptionButton = ({
  classNames, variant, enterpriseUuid,
}) => {
  const intl = useIntl();
  const [stripeSessionStatus, setStripeSessionStatus] = useState('default');

  const handleManageSubscriptionClick = async () => {
    setStripeSessionStatus('pending');
    try {
      const response = await EnterpriseAccessApiService.fetchStripeBillingPortalSession(enterpriseUuid);
      const results = camelCaseObject(response.data);
      if (results.url) {
        setStripeSessionStatus('default');
        window.open(results.url, '_blank', 'noopener,noreferrer');
      } else {
        setStripeSessionStatus('error');
      }
    } catch (error) {
      logError(error);
      setStripeSessionStatus('error');
    }
  };

  return (
    <StatefulButton
      data-testid="manage-stripe-subscription-button"
      className={classNames}
      labels={{
        default: intl.formatMessage({
          id: 'subscriptions.manageSubscriptions.stripeLinkButton.default',
          defaultMessage: 'Manage subscription',
          description: 'Button text that link out to manage their subscriptions on the Stripe billing dashboard.',
        }),
        pending: intl.formatMessage({
          id: 'subscriptions.manageSubscriptions.stripeLinkButton.loading',
          defaultMessage: 'Creating Stripe session',
          description: 'Button text while we are creating a new Stripe billing session',
        }),
        error: intl.formatMessage({
          id: 'subscriptions.manageSubscriptions.stripeLinkButton.error',
          defaultMessage: 'Try again',
          description: 'Text for the button when creating a new Stripe session has failed',
        }),
      }}
      icons={{
        default: <Icon src={Launch} />,
        pending: <Icon src={SpinnerSimple} className="icon-spin" />,
        error: <Icon src={Error} />,
      }}
      variant={variant}
      state={stripeSessionStatus}
      onClick={handleManageSubscriptionClick}
    />
  );
};

ManageStripeSubscriptionButton.defaultProps = {
  classNames: null,
  variant: 'outline-primary',
};

const mapStateToProps = state => ({
  enterpriseUuid: state.portalConfiguration.enterpriseId,
});

ManageStripeSubscriptionButton.propTypes = {
  classNames: PropTypes.string,
  variant: PropTypes.string,
  enterpriseUuid: PropTypes.string.isRequired,
};

export default connect(mapStateToProps)(ManageStripeSubscriptionButton);
