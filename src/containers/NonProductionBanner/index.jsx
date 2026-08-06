import { connect } from 'react-redux';

import NonProductionBanner from '../../components/NonProductionBanner';

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
  showNonProductionBanner: state.portalConfiguration.showNonProductionBanner,
});

export default connect(mapStateToProps)(NonProductionBanner);
