import { Alert } from '@openedx/paragon';
import { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { getArchivedContentKeysByHighlightSet, setDismissedArchivedContentKeys } from './data/archivedContent';
import { EnterpriseAppContext } from '../EnterpriseApp/EnterpriseAppContextProvider';
import { enterpriseCurationActions } from '../EnterpriseApp/data/enterpriseCurationReducer';

const ContentHighlightArchivedAlert = ({ open, onClose }) => {
  const { enterpriseCuration: { enterpriseHighlightedSets, dispatch } } = useContext(EnterpriseAppContext);
  const intl = useIntl();

  const archivedContentKeys = useMemo(
    () => getArchivedContentKeysByHighlightSet(enterpriseHighlightedSets),
    [enterpriseHighlightedSets],
  );

  const addArchivedContentToLocalStorage = () => {
    Object.entries(archivedContentKeys).forEach(([highlightSetUUID, contentKeys]) => {
      setDismissedArchivedContentKeys(highlightSetUUID, contentKeys);
    });
    dispatch(enterpriseCurationActions.updateDismissedArchivedCourse(false));
    onClose();
  };

  return (
    <Alert
      variant="info"
      dismissible
      closeLabel={intl.formatMessage({
        id: 'highlights.highlights.tab.content.archived.alert.dismiss.button.label',
        defaultMessage: 'Dismiss',
        description: 'Alert dismiss button label for archived courses in highlight tab',
      })}
      show={open}
      onClose={addArchivedContentToLocalStorage}
    >
      <Alert.Heading>
        <FormattedMessage
          id="highlights.highlights.tab.content.archived.alert.heading"
          defaultMessage="Needs Review: Archived Course(s)"
          description="Alert heading for archived courses on highlights tab"
        />
      </Alert.Heading>
      <p>
        <FormattedMessage
          id="highlights.highlights.tab.content.archived.alert.message"
          defaultMessage="Course(s) in your highlight(s) have been archived and are no longer open for new enrollments."
          description="Alert message for archived course on highlights tab"
        />
      </p>
    </Alert>
  );
};

ContentHighlightArchivedAlert.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ContentHighlightArchivedAlert;
