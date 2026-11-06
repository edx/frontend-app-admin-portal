/* eslint-disable react/prop-types */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import LearnerCreditManagementRoutes from '..';
import { features } from '../../../config';

jest.mock('../MultipleBudgetsPage', () => function MultipleBudgetsPage({ activeTabKey = 'budgets' }) {
  return <div>{`Budgets page: ${activeTabKey}`}</div>;
});
jest.mock('../BudgetDetailPage', () => {
  const { useParams } = jest.requireActual('react-router-dom');
  return function BudgetDetailPage() {
    const { budgetId } = useParams();
    return <div>{`Budget detail page: ${budgetId}`}</div>;
  };
});
jest.mock('../add-funds', () => function AddFundsPage() {
  return <div>Add funds page</div>;
});

const renderRoutes = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <LearnerCreditManagementRoutes />
  </MemoryRouter>,
);

describe('<LearnerCreditManagementRoutes />', () => {
  afterEach(() => {
    features.AUDIT_TRAIL = false;
  });

  it('shows the budgets page', () => {
    renderRoutes('/');
    expect(screen.getByText('Budgets page: budgets')).toBeInTheDocument();
  });

  it('routes /audit-trail to the audit trail tab when the audit trail feature is enabled', () => {
    features.AUDIT_TRAIL = true;
    renderRoutes('/audit-trail');
    expect(screen.getByText('Budgets page: audit-trail')).toBeInTheDocument();
  });

  it('does not route /audit-trail to the audit trail tab when the audit trail feature is disabled', () => {
    features.AUDIT_TRAIL = false;
    renderRoutes('/audit-trail');
    // As before the audit trail, the path is treated as a budget ID.
    expect(screen.getByText('Budget detail page: audit-trail')).toBeInTheDocument();
    expect(screen.queryByText('Budgets page: audit-trail')).not.toBeInTheDocument();
  });
});
