import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import SubscriptionAuditTrail from '../SubscriptionAuditTrail';
import LicenseManagerApiService from '../../../data/services/LicenseManagerAPIService';

jest.mock('../../../data/services/LicenseManagerAPIService');

const SubscriptionAuditTrailWrapper = () => (
  <IntlProvider locale="en">
    <SubscriptionAuditTrail />
  </IntlProvider>
);

describe('<SubscriptionAuditTrail />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the audit trail with its empty state and license-specific filters', () => {
    render(<SubscriptionAuditTrailWrapper />);

    expect(screen.getByText(/History of every action performed on subscription licenses/)).toBeInTheDocument();
    expect(screen.getByText('No audit history available')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Revoked' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Allocated' })).not.toBeInTheDocument();
  });

  it('does not request licenses until the license-manager audit trail endpoint is available', () => {
    render(<SubscriptionAuditTrailWrapper />);

    expect(LicenseManagerApiService.fetchCustomerAgreementData).not.toHaveBeenCalled();
    expect(LicenseManagerApiService.fetchSubscriptionUsers).not.toHaveBeenCalled();
  });
});
