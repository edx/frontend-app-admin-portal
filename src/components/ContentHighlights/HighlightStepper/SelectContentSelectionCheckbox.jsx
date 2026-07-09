import React, { useContext } from 'react';
import { useContextSelector } from 'use-context-selector';
import PropTypes from 'prop-types';
import { CheckboxControl } from '@openedx/paragon';

import { MAX_CONTENT_ITEMS_PER_HIGHLIGHT_SET } from '../data/constants';
import { ContentHighlightsContext } from '../ContentHighlightsContext';

// Lets each row's checkbox trigger a single, shared "max limit reached" modal
// owned by the parent table, rather than every row rendering its own modal.
export const MaxContentSelectionModalContext = React.createContext(() => {});

const SelectContentSelectionCheckbox = ({ row }) => {
  const {
    indeterminate,
    checked,
    onChange,
    ...toggleRowSelectedProps
  } = row.getToggleRowSelectedProps();

  const openMaxLimitModal = useContext(MaxContentSelectionModalContext);

  const currentSelectedRowsCount = useContextSelector(
    ContentHighlightsContext,
    v => Object.keys(v[0].stepperModal.currentSelectedRowIds).length,
  );

  const isMaxSelectionsReached = !checked && currentSelectedRowsCount >= MAX_CONTENT_ITEMS_PER_HIGHLIGHT_SET;

  const handleChange = (e) => {
    // When the maximum number of items is already selected, block adding another
    // and prompt the admin to unselect an existing item instead.
    if (isMaxSelectionsReached) {
      openMaxLimitModal();
      return;
    }
    onChange(e);
  };

  return (
    <div>
      <CheckboxControl
        {...toggleRowSelectedProps}
        checked={checked}
        onChange={handleChange}
        title="Toggle row selected"
        isIndeterminate={indeterminate}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
};

SelectContentSelectionCheckbox.propTypes = {
  row: PropTypes.shape({
    getToggleRowSelectedProps: PropTypes.func.isRequired,
  }).isRequired,
};

export default SelectContentSelectionCheckbox;
