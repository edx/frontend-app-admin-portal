import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { ROUTE_NAMES } from '../../EnterpriseApp/data/constants';
import messages from './messages';

const AddFundsBreadcrumbs = ({ enterpriseSlug, budgetId, budgetDisplayName }) => {
  const intl = useIntl();
  const learnerCreditPath = `/${enterpriseSlug}/admin/${ROUTE_NAMES.learnerCredit}`;
  return (
    <div className="small">
      <Breadcrumb
        ariaLabel="Add funds breadcrumb navigation"
        links={[
          { label: intl.formatMessage(messages.learnerCreditBreadcrumb), to: learnerCreditPath },
          { label: budgetDisplayName, to: `${learnerCreditPath}/${budgetId}` },
        ]}
        linkAs={Link}
        activeLabel={intl.formatMessage(messages.pageBreadcrumb)}
      />
    </div>
  );
};

AddFundsBreadcrumbs.propTypes = {
  enterpriseSlug: PropTypes.string.isRequired,
  budgetId: PropTypes.string.isRequired,
  budgetDisplayName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseSlug: state.portalConfiguration.enterpriseSlug,
});

export default connect(mapStateToProps)(AddFundsBreadcrumbs);
