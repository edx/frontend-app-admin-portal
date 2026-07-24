import PropTypes from 'prop-types';

const EmailCell = ({ value }) => (
  <span data-hj-suppress>{value}</span>
);
EmailCell.propTypes = {
  value: PropTypes.string.isRequired,
};

export default EmailCell;
