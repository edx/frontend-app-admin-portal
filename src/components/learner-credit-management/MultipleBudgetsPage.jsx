import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Card, Col, Container, Hyperlink, Row, Skeleton, Stack, Tab, Tabs,
} from '@openedx/paragon';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useIntl, FormattedMessage } from '@edx/frontend-platform/i18n';

import Hero from '../Hero';
import MultipleBudgetsPicker from './MultipleBudgetsPicker';
import LearnerCreditAuditTrail from './LearnerCreditAuditTrail';
import { EnterpriseSubsidiesContext } from '../EnterpriseSubsidiesContext';
import { configuration, features } from '../../config';
import { useEnterpriseBudgets } from '../EnterpriseSubsidiesContext/data/hooks';
import { ROUTE_NAMES } from '../EnterpriseApp/data/constants';
import { LEARNER_CREDIT_AUDIT_TRAIL_TAB, LEARNER_CREDIT_BUDGETS_TAB } from './data';

const MultipleBudgetsPage = ({
  enterpriseUUID,
  enterpriseSlug,
  enableLearnerPortal,
  enablePortalLearnerCreditManagementScreen,
  activeTabKey,
}) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const PAGE_TITLE = intl.formatMessage({
    id: 'lcm.page.title',
    defaultMessage: 'Learner Credit Management',
    description: 'Title for the Learner Credit Management page',
  });
  const { isLoading } = useContext(EnterpriseSubsidiesContext);
  const { data: budgetsOverview } = useEnterpriseBudgets({
    enterpriseId: enterpriseUUID,
    enablePortalLearnerCreditManagementScreen,
  });
  const {
    budgets = [],
  } = budgetsOverview || {};

  if (isLoading) {
    return (
      <>
        <h1><Skeleton /></h1>
        <Skeleton height={200} count={2} />
        <span className="sr-only">
          <FormattedMessage
            id="lcm.budgets.loading"
            defaultMessage="Loading budgets..."
            description="Loading budgets"
          />
        </span>
      </>
    );
  }

  if (budgets.length === 0) {
    return (
      <Stack>
        <Helmet title={PAGE_TITLE} />
        <Hero title={PAGE_TITLE} />
        <Card>
          <Card.Section className="text-center">
            <Row>
              <Col xs={12} lg={{ span: 8, offset: 2 }}>
                <h3 className="mb-3">
                  <FormattedMessage
                    id="lcm.budgets.no.budgets"
                    defaultMessage="No budgets for your organization"
                    description="No budgets for your organization"
                  />
                </h3>
                <p>
                  <FormattedMessage
                    id="lcm.budgets.no.budgets.description"
                    defaultMessage="We were unable to find any budgets for your organization. Please contact Customer Support if you have questions."
                    description="Description for no budgets found and guidance to contact support."
                  />
                </p>
                <Hyperlink
                  className="btn btn-brand"
                  target="_blank"
                  destination={configuration.ENTERPRISE_SUPPORT_URL}
                >
                  <FormattedMessage
                    id="lcm.budgets.contact.support"
                    defaultMessage="Contact support"
                    description="Contact support text for no budgets found."
                  />
                </Hyperlink>
              </Col>
            </Row>
          </Card.Section>
        </Card>
      </Stack>
    );
  }

  const budgetsPicker = (
    <MultipleBudgetsPicker
      budgets={budgets}
      enterpriseUUID={enterpriseUUID}
      enterpriseSlug={enterpriseSlug}
      enableLearnerPortal={enableLearnerPortal}
    />
  );

  const handleTabSelect = (tabKey) => {
    const learnerCreditPath = `/${enterpriseSlug}/admin/${ROUTE_NAMES.learnerCredit}`;
    navigate(tabKey === LEARNER_CREDIT_AUDIT_TRAIL_TAB
      ? `${learnerCreditPath}/${LEARNER_CREDIT_AUDIT_TRAIL_TAB}`
      : learnerCreditPath);
  };

  return (
    <>
      <Helmet title={PAGE_TITLE} />
      <Hero title={PAGE_TITLE} />
      <Container className="py-3" fluid>
        {features.AUDIT_TRAIL ? (
          <Tabs
            id="tabs-learner-credit-management"
            activeKey={activeTabKey}
            onSelect={handleTabSelect}
          >
            <Tab
              eventKey={LEARNER_CREDIT_BUDGETS_TAB}
              title={intl.formatMessage({
                id: 'lcm.page.tabs.details',
                defaultMessage: 'Details',
                description: 'Title for the tab listing the budgets on the learner credit management page.',
              })}
              className="pt-4"
            >
              {activeTabKey === LEARNER_CREDIT_BUDGETS_TAB && budgetsPicker}
            </Tab>
            <Tab
              eventKey={LEARNER_CREDIT_AUDIT_TRAIL_TAB}
              title={intl.formatMessage({
                id: 'lcm.page.tabs.audit.trail',
                defaultMessage: 'Audit trail',
                description: 'Title for the audit trail tab on the learner credit management page.',
              })}
              className="pt-4"
            >
              {activeTabKey === LEARNER_CREDIT_AUDIT_TRAIL_TAB && <LearnerCreditAuditTrail />}
            </Tab>
          </Tabs>
        ) : budgetsPicker}
      </Container>
    </>
  );
};

const mapStateToProps = state => ({
  enterpriseUUID: state.portalConfiguration.enterpriseId,
  enterpriseSlug: state.portalConfiguration.enterpriseSlug,
  enableLearnerPortal: state.portalConfiguration.enableLearnerPortal,
  enterpriseFeatures: state.portalConfiguration.enterpriseFeatures,
  enablePortalLearnerCreditManagementScreen: state.portalConfiguration.enablePortalLearnerCreditManagementScreen,
});

MultipleBudgetsPage.propTypes = {
  enterpriseUUID: PropTypes.string.isRequired,
  enterpriseSlug: PropTypes.string.isRequired,
  enableLearnerPortal: PropTypes.bool.isRequired,
  enterpriseFeatures: PropTypes.shape({
  }).isRequired,
  enablePortalLearnerCreditManagementScreen: PropTypes.bool.isRequired,
  activeTabKey: PropTypes.oneOf([LEARNER_CREDIT_BUDGETS_TAB, LEARNER_CREDIT_AUDIT_TRAIL_TAB]),
};

MultipleBudgetsPage.defaultProps = {
  activeTabKey: LEARNER_CREDIT_BUDGETS_TAB,
};

export default connect(mapStateToProps)(MultipleBudgetsPage);
