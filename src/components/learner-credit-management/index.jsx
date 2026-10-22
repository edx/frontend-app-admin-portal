import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MultipleBudgetsPage from './MultipleBudgetsPage';
import BudgetDetailPage from './BudgetDetailPage';
import AddFundsPage from './add-funds';
import { ADD_FUNDS_ROUTE_SEGMENT } from './add-funds/data/constants';

const LearnerCreditManagementRoutes = () => (
  <main className="learner-credit-management">
    <Routes>
      <Route
        path="/"
        element={<MultipleBudgetsPage />}
      />

      {/* One URL per step (`/add-funds/select-amount`, ...). React Router ranks the static
          `add-funds` segment above the dynamic tab param below, so it is never treated as a tab key. */}
      <Route
        path={`/:budgetId/${ADD_FUNDS_ROUTE_SEGMENT}/:step?`}
        element={<AddFundsPage />}
      />

      <Route
        path="/:budgetId/:activeTabKey?"
        element={<BudgetDetailPage />}
      />
    </Routes>
  </main>
);

export default LearnerCreditManagementRoutes;
