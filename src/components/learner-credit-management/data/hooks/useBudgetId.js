import { useParams } from 'react-router-dom';

/**
 * Given a page route with the `:budgetId` param, returns the `budgetId` and the
 * `subsidyAccessPolicyId` (which is always the budgetId, now that enterprise offers
 * have been removed).
 *
 * @returns An object containing the `budgetId` from the URL params and the subsidyAccessPolicyId.
 */
const useBudgetId = () => {
  const { budgetId } = useParams();
  return {
    budgetId,
    subsidyAccessPolicyId: budgetId,
  };
};

export default useBudgetId;
