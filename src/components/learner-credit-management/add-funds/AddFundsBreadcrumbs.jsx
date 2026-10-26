import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import messages from './messages';

const AddFundsBreadcrumbs = ({ learnerCreditPath, budgetDetailPath, budgetDisplayName }) => {
  const intl = useIntl();
  return (
    <div className="small">
      <Breadcrumb
        ariaLabel={intl.formatMessage(messages.breadcrumbAriaLabel)}
        links={[
          { label: intl.formatMessage(messages.learnerCreditBreadcrumb), to: learnerCreditPath },
          {
            label: budgetDisplayName || intl.formatMessage(messages.budgetFallbackName),
            to: budgetDetailPath,
          },
        ]}
        linkAs={Link}
        activeLabel={intl.formatMessage(messages.pageBreadcrumb)}
      />
    </div>
  );
};

AddFundsBreadcrumbs.propTypes = {
  learnerCreditPath: PropTypes.string.isRequired,
  budgetDetailPath: PropTypes.string.isRequired,
  budgetDisplayName: PropTypes.string,
};

AddFundsBreadcrumbs.defaultProps = {
  budgetDisplayName: undefined,
};

export default AddFundsBreadcrumbs;
