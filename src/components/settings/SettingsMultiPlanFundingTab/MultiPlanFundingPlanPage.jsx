import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import {
  Alert, Badge, Breadcrumb, Card, Container, Form, ProgressBar, Skeleton, Stack, StatefulButton, Toast, useToggle,
} from '@openedx/paragon';
import { Error as ErrorIcon, Info } from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import NotFoundPage from '../../NotFoundPage';
import { formatDate, formatPrice, useSubsidyAccessPolicy } from '../../learner-credit-management/data';
import {
  canJoinMultiPlanPool,
  isMultiPlanFundingDisabledError,
  transformMultiPlanFundingPlan,
  useIsMultiPlanFundingOptInVisible,
  useUpdateMultiPlanFunding,
} from './data/hooks';
import EnableMultiPlanFundingModal from './EnableMultiPlanFundingModal';
import MultiPlanFundingHelpLink from './MultiPlanFundingHelpLink';
import { getMultiPlanFundingPlansPath } from './constants';
import messages from './messages';

const PlanStatusBadge = ({ plan }) => {
  if (plan.isActive) {
    return <Badge variant="success"><FormattedMessage {...messages.activeBadge} /></Badge>;
  }
  if (plan.isScheduled) {
    return <Badge variant="secondary"><FormattedMessage {...messages.scheduledBadge} /></Badge>;
  }
  return <Badge variant="light"><FormattedMessage {...messages.inactiveBadge} /></Badge>;
};

PlanStatusBadge.propTypes = {
  plan: PropTypes.shape({
    isActive: PropTypes.bool.isRequired,
    isScheduled: PropTypes.bool,
  }).isRequired,
};

const PlanDetailsCard = ({ plan }) => {
  const intl = useIntl();
  const { total } = plan;
  const percentSpent = total > 0 ? Math.min((plan.spent / total) * 100, 100) : 0;
  return (
    <Card className="mb-4">
      <Card.Section>
        <Stack direction="horizontal" className="justify-content-between align-items-start mb-3">
          <h2 className="h3 mb-0">{plan.name}</h2>
          <PlanStatusBadge plan={plan} />
        </Stack>
        <p className="mb-1"><FormattedMessage {...messages.planDetails} /></p>
        <Stack direction="horizontal" className="justify-content-between align-items-end mb-2">
          <span className="h1 mb-0">{formatPrice(plan.balance)}</span>
          <span className="small text-monospace">
            <FormattedMessage {...messages.utilized} values={{ amount: formatPrice(plan.spent) }} />
          </span>
        </Stack>
        <ProgressBar
          now={percentSpent}
          variant="dark"
          className="mb-2 multi-plan-progress-thick"
          aria-label={intl.formatMessage(messages.utilized, { amount: formatPrice(plan.spent) })}
        />
        {plan.expires && (
          <p className="small mb-0">
            <FormattedMessage
              {...messages.spentOfTotal}
              values={{
                spent: formatPrice(plan.spent),
                total: formatPrice(total),
                expirationDate: formatDate(plan.expires, 'MMMM D, YYYY'),
              }}
            />
          </p>
        )}
      </Card.Section>
    </Card>
  );
};

PlanDetailsCard.propTypes = {
  plan: PropTypes.shape({
    name: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
    spent: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    isScheduled: PropTypes.bool,
    expires: PropTypes.string,
    isActive: PropTypes.bool.isRequired,
  }).isRequired,
};

/**
 * Settings > Multi-plan funding > {plan} (ENT-12446). Lets an admin add a plan to, or remove it from, the
 * multi-plan pool. Adding asks for confirmation first; removing saves directly.
 */
const MultiPlanFundingPlanPage = ({ enterpriseId, enterpriseSlug }) => {
  const intl = useIntl();
  const { planId } = useParams();
  const isOptInVisible = useIsMultiPlanFundingOptInVisible();
  const { data: policy, isLoading, isError } = useSubsidyAccessPolicy(isOptInVisible ? planId : undefined);
  const updateMultiPlanFunding = useUpdateMultiPlanFunding(enterpriseId);
  const [isConfirmOpen, openConfirm, closeConfirm] = useToggle(false);
  const [isToastShown, setIsToastShown] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const savedValue = !!policy?.isMultiPlanEligible;
  const [isInPool, setIsInPool] = useState(savedValue);
  useEffect(() => {
    setIsInPool(savedValue);
  }, [savedValue]);

  if (!isOptInVisible) {
    return <NotFoundPage />;
  }

  const plansPath = getMultiPlanFundingPlansPath(enterpriseSlug);
  const breadcrumbs = (activeLabel) => (
    <Breadcrumb
      ariaLabel={intl.formatMessage(messages.breadcrumbPlans)}
      links={[{ label: intl.formatMessage(messages.breadcrumbPlans), to: plansPath }]}
      linkAs={Link}
      activeLabel={activeLabel}
      className="mb-4"
    />
  );

  if (isLoading) {
    return (
      <Container className="py-4" size="md">
        <Skeleton height={200} className="mb-4" />
        <Skeleton height={160} />
        <div className="sr-only"><FormattedMessage {...messages.loading} /></div>
      </Container>
    );
  }

  if (isError || !policy) {
    return (
      <Container className="py-4" size="md">
        {breadcrumbs('')}
        <Alert variant="danger" icon={ErrorIcon}>
          <FormattedMessage {...messages.planNotFound} />
        </Alert>
      </Container>
    );
  }

  const plan = transformMultiPlanFundingPlan(policy);
  const canJoinPool = canJoinMultiPlanPool(policy);
  const hasChanges = isInPool !== savedValue;
  const isSaving = updateMultiPlanFunding.isLoading;

  const save = async (isMultiPlanEligible) => {
    setSaveError(null);
    try {
      await updateMultiPlanFunding.mutateAsync({ policyId: plan.id, isMultiPlanEligible });
      setIsToastShown(true);
    } catch (error) {
      setSaveError(isMultiPlanFundingDisabledError(error) ? messages.customerDisabledError : messages.saveError);
    } finally {
      closeConfirm();
    }
  };

  const handleSave = () => {
    if (isInPool) {
      openConfirm();
      return;
    }
    save(false);
  };

  return (
    <Container className="py-4" size="md">
      {breadcrumbs(plan.name)}
      <PlanDetailsCard plan={plan} />
      <Card className="mb-4">
        <Card.Section>
          <h3 className="h4 mb-3"><FormattedMessage {...messages.fundingSettingsHeading} /></h3>
          {saveError && (
            <Alert variant="danger" icon={ErrorIcon} className="mb-3">
              <FormattedMessage {...saveError} />
            </Alert>
          )}
          {canJoinPool || savedValue ? (
            <>
              <Form.Switch
                className="mb-3 justify-content-between w-100"
                checked={isInPool}
                onChange={(e) => setIsInPool(e.target.checked)}
                disabled={isSaving}
                isInline={false}
              >
                <FormattedMessage {...messages.fundingSettingsSwitchLabel} />
              </Form.Switch>
              <StatefulButton
                variant="primary"
                state={isSaving && !isConfirmOpen ? 'pending' : 'default'}
                labels={{
                  default: intl.formatMessage(messages.saveChanges),
                  pending: intl.formatMessage(messages.saving),
                }}
                disabledStates={['pending']}
                disabled={!hasChanges}
                onClick={handleSave}
              />
            </>
          ) : (
            <p className="mb-0"><FormattedMessage {...messages.unavailableDescription} /></p>
          )}
        </Card.Section>
      </Card>
      {savedValue && (
        <Alert variant="info" icon={Info}>
          <Alert.Heading><FormattedMessage {...messages.howItWorksHeading} /></Alert.Heading>
          <p className="mb-2"><FormattedMessage {...messages.howItWorksBody} /></p>
          <MultiPlanFundingHelpLink />
        </Alert>
      )}
      <EnableMultiPlanFundingModal
        isOpen={isConfirmOpen}
        isSaving={isSaving}
        onCancel={closeConfirm}
        onConfirm={() => save(true)}
        planName={plan.name}
      />
      <Toast show={isToastShown} onClose={() => setIsToastShown(false)}>
        {intl.formatMessage(messages.savedToast)}
      </Toast>
    </Container>
  );
};

MultiPlanFundingPlanPage.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
  enterpriseSlug: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
  enterpriseSlug: state.portalConfiguration.enterpriseSlug,
});

export default connect(mapStateToProps)(MultiPlanFundingPlanPage);
