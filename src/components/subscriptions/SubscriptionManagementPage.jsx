import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Route, Switch } from 'react-router-dom';
import { Container } from '@edx/paragon';

import Hero from '../Hero';
import SubscriptionData from './SubscriptionData';
import MultipleSubscriptionsPage from './MultipleSubscriptionsPage';
import SubscriptionDetailPage from './SubscriptionDetailPage';
import MaintenanceAlert from "../MaintenanceAlert/MaintenanceAlert";

const PAGE_TITLE = 'Subscription Management';

function SubscriptionManagementPage({ enterpriseId }) {
  return (
    <SubscriptionData enterpriseId={enterpriseId}>
      <Helmet title={PAGE_TITLE} />
      <Hero title={PAGE_TITLE} />
      <MaintenanceAlert />
      <main role="main" className="manage-subscription">
        <Container className="py-3" fluid>
          <Switch>
            <Route
              path="/:enterpriseSlug/admin/subscriptions"
              component={MultipleSubscriptionsPage}
              exact
            />
            <Route
              path="/:enterpriseSlug/admin/subscriptions/:subscriptionUUID"
              component={SubscriptionDetailPage}
              exact
            />
          </Switch>
        </Container>
      </main>
    </SubscriptionData>
  );
}

SubscriptionManagementPage.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(SubscriptionManagementPage);
