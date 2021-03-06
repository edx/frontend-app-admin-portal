import { uniqBy } from 'lodash';
import {
  SET_SELECTED_ROWS, DELETE_ROW, ADD_ROW, CLEAR_SELECTION,
} from './actions';

const selectedRowsReducer = (state = [], action) => {
  switch (action.type) {
    case SET_SELECTED_ROWS:
      return uniqBy([...state, ...action.rows], (row) => row.id);

    case DELETE_ROW:
      return state.filter((row) => row.id !== action.rowId);
    case ADD_ROW:
      return [...state, action.row];
    case CLEAR_SELECTION:
      return [];
    default:
      return state;
  }
};

export default selectedRowsReducer;
