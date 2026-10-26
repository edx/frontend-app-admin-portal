import React from 'react';
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
import messages from '../messages';
import AddFundsStepHeading from './AddFundsStepHeading';

const SelectAmountStep = () => {
  const intl = useIntl();
  const { formData: { amount, customAmountInput: customInput }, updateFormData } = useAddFunds();

  const handlePresetClick = (presetAmount) => {
    updateFormData({ amount: presetAmount, customAmountInput: '' });
  };

  const handleCustomChange = (e) => {
    const { value } = e.target;
    const parsed = value.trim() === '' ? null : Number(value);
    updateFormData({ amount: Number.isFinite(parsed) ? parsed : null, customAmountInput: value });
  };

  const isCustomInvalid = customInput !== '' && !isValidTopUpAmount(amount);
  const limits = { min: formatPrice(MIN_TOP_UP_AMOUNT), max: formatPrice(MAX_TOP_UP_AMOUNT) };

  return (
    <Stack gap={4}>
      <AddFundsStepHeading>
        <FormattedMessage {...messages.selectAmountTitle} />
      </AddFundsStepHeading>
      <Stack gap={4} className="align-self-start mw-100">
        <fieldset>
          <legend className="h5">
            <FormattedMessage {...messages.presetAmountLabel} />
          </legend>
          <Stack direction="horizontal" gap={3} className="flex-wrap">
            {PRESET_TOP_UP_AMOUNTS.map((presetAmount) => {
              const isSelected = amount === presetAmount;
              return (
                <Button
                  key={presetAmount}
                  variant={isSelected ? 'primary' : 'outline-primary'}
                  className={isSelected ? 'font-weight-bold' : 'bg-white text-gray-900 border-light-500 font-weight-bold'}
                  aria-pressed={isSelected}
                  onClick={() => handlePresetClick(presetAmount)}
                >
                  {`$ ${presetAmount}`}
                </Button>
              );
            })}
          </Stack>
        </fieldset>
        <div className="d-flex align-items-center w-100 small font-weight-bold text-gray-700" aria-hidden>
          <hr className="flex-grow-1" />
          <span className="px-3">
            <FormattedMessage {...messages.customAmountDivider} />
          </span>
          <hr className="flex-grow-1" />
        </div>
        <Form.Group isInvalid={isCustomInvalid} className="mb-0 w-100">
          <Form.Label className="sr-only">
            <FormattedMessage {...messages.customAmountLabel} />
          </Form.Label>
          <Form.Control
            className="w-100 border-gray-500 font-weight-bold"
            type="number"
            inputMode="numeric"
            min={MIN_TOP_UP_AMOUNT}
            max={MAX_TOP_UP_AMOUNT}
            leadingElement="$"
            placeholder={intl.formatMessage(messages.customAmountPlaceholder)}
            value={customInput}
            onChange={handleCustomChange}
            // Stop the mouse wheel from silently changing the amount while the field is focused.
            onWheel={(e) => e.currentTarget.blur()}
          />
          {isCustomInvalid ? (
            <Form.Control.Feedback type="invalid">
              <FormattedMessage {...messages.customAmountInvalid} values={limits} />
            </Form.Control.Feedback>
          ) : (
            <Form.Control.Feedback type="default">
              {intl.formatMessage(messages.amountLimits, limits)}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      </Stack>
    </Stack>
  );
};

export default SelectAmountStep;
