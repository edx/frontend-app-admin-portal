import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Alert } from '@openedx/paragon';
import { Error } from '@openedx/paragon/icons';

const messageShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  defaultMessage: PropTypes.string.isRequired,
  description: PropTypes.string,
});

const TableErrorAlert = ({ heading, message }) => (
  <Alert variant="danger" icon={Error}>
    <Alert.Heading>
      <FormattedMessage {...heading} />
    </Alert.Heading>
    <p>
      <FormattedMessage {...message} />
    </p>
  </Alert>
);

TableErrorAlert.propTypes = {
  heading: messageShape.isRequired,
  message: messageShape.isRequired,
};

export default TableErrorAlert;
