import React, { useState } from 'react';
import { Button, Form, Stack } from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { formatPrice } from '../../data';
import {
  isValidTopUpAmount,
  MAX_TOP_UP_AMOUNT,
  MIN_TOP_UP_AMOUNT,
  PRESET_TOP_UP_AMOUNTS,
  useAddFunds,
} from '../data';
import AddFundsStepHeading from './AddFundsStepHeading';

const getInitialCustomInput = (amount) => (
  amount !== null && !PRESET_TOP_UP_AMOUNTS.includes(amount) ? String(amount) : ''
);

const SelectAmountStep = () => {
  const intl = useIntl();
  const { formData: { amount }, updateFormData } = useAddFunds();
  // The raw input is kept locally so partially-typed or invalid values can be shown and validated;
  // only a parsed numeric amount is stored in the shared flow state.
  const [customInput, setCustomInput] = useState(() => getInitialCustomInput(amount));

  const handlePresetClick = (presetAmount) => {
    setCustomInput('');
    updateFormData({ amount: presetAmount });
  };

  const handleCustomChange = (e) => {
    const { value } = e.target;
    setCustomInput(value);
    const parsed = value.trim() === '' ? null : Number(value);
    updateFormData({ amount: Number.isFinite(parsed) ? parsed : null });
  };

  const isCustomInvalid = customInput !== '' && !isValidTopUpAmount(amount);
  const limitsMessage = intl.formatMessage({
    id: 'lcm.budget.add.funds.select.amount.limits',
    defaultMessage: 'Minimum {min} · Maximum {max}',
    description: 'Helper text describing the minimum and maximum top-up amount',
  }, { min: formatPrice(MIN_TOP_UP_AMOUNT), max: formatPrice(MAX_TOP_UP_AMOUNT) });

  return (
    <Stack gap={4}>
      <AddFundsStepHeading>
        <FormattedMessage
          id="lcm.budget.add.funds.select.amount.title"
          defaultMessage="Select an Amount"
          description="Heading for the step where the admin chooses how much to add to the budget"
        />
      </AddFundsStepHeading>
      <fieldset>
        <legend className="h5">
          <FormattedMessage
            id="lcm.budget.add.funds.select.amount.preset.label"
            defaultMessage="Choose a preset amount"
            description="Label for the group of preset top-up amount buttons"
          />
        </legend>
        <Stack direction="horizontal" gap={3} className="flex-wrap">
          {PRESET_TOP_UP_AMOUNTS.map((presetAmount) => {
            const isSelected = customInput === '' && amount === presetAmount;
            return (
              <Button
                key={presetAmount}
                variant={isSelected ? 'primary' : 'outline-primary'}
                aria-pressed={isSelected}
                onClick={() => handlePresetClick(presetAmount)}
              >
                {formatPrice(presetAmount)}
              </Button>
            );
          })}
        </Stack>
      </fieldset>
      <div className="d-flex align-items-center small text-gray-700" aria-hidden>
        <hr className="flex-grow-1" />
        <span className="px-3">
          <FormattedMessage
            id="lcm.budget.add.funds.select.amount.divider"
            defaultMessage="Or enter a custom amount"
            description="Divider text between preset amounts and the custom amount input"
          />
        </span>
        <hr className="flex-grow-1" />
      </div>
      <Form.Group isInvalid={isCustomInvalid} className="mb-0">
        <Form.Label className="sr-only">
          <FormattedMessage
            id="lcm.budget.add.funds.select.amount.custom.label"
            defaultMessage="Custom amount"
            description="Accessible label for the custom top-up amount input"
          />
        </Form.Label>
        <Form.Control
          type="number"
          inputMode="decimal"
          min={MIN_TOP_UP_AMOUNT}
          max={MAX_TOP_UP_AMOUNT}
          leadingElement="$"
          placeholder={intl.formatMessage({
            id: 'lcm.budget.add.funds.select.amount.custom.placeholder',
            defaultMessage: 'e.g. 1500',
            description: 'Placeholder for the custom top-up amount input',
          })}
          value={customInput}
          onChange={handleCustomChange}
        />
        {isCustomInvalid ? (
          <Form.Control.Feedback type="invalid">
            <FormattedMessage
              id="lcm.budget.add.funds.select.amount.custom.invalid"
              defaultMessage="Enter an amount between {min} and {max}."
              description="Validation error when the custom top-up amount is out of range"
              values={{ min: formatPrice(MIN_TOP_UP_AMOUNT), max: formatPrice(MAX_TOP_UP_AMOUNT) }}
            />
          </Form.Control.Feedback>
        ) : (
          <Form.Control.Feedback type="default">{limitsMessage}</Form.Control.Feedback>
        )}
      </Form.Group>
    </Stack>
  );
};

export default SelectAmountStep;
