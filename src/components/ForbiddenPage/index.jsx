import React from 'react';
import Helmet from 'react-helmet';
import { MailtoLink } from '@edx/paragon';

import H1 from '../../components/H1';

const ForbiddenPage = () => (
  <main role="main">
    <div className="container-fluid mt-3">
      <Helmet>
        <title>Access Denied</title>
      </Helmet>
      <div className="text-center py-5">
        <H1>403</H1>
        <p className="lead">You do not have access to this page.</p>
        <p>
          For assistance, please contact the edX Customer Success team at
          {' '}
          <MailtoLink to="customersuccess@edx.org">customersuccess@edx.org</MailtoLink>.
        </p>
      </div>
    </div>
  </main>
);

export default ForbiddenPage;
