import React from 'react';
import { Helmet } from 'react-helmet';
import { MailtoLink } from '@edx/paragon';

import H1 from '../../components/H1';

const SupportPage = () => (
  <div className="container mt-3">
    <Helmet>
      <title>Support</title>
    </Helmet>
    <H1>Support</H1>
    <p>
      For assistance, please contact edX Enterprise Support at <MailtoLink to="customersuccess@edx.org" content=" customersuccess@edx.org" />.
    </p>
  </div>
);

export default SupportPage;
