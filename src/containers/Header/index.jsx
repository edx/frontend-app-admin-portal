import { connect } from 'react-redux';

import Header from '../../components/Header';

const mapStateToProps = (state) => ({
  enterpriseName: state.portalConfiguration.enterpriseName,
  enterpriseSlug: state.portalConfiguration.enterpriseSlug,
  enterpriseLogo: state.portalConfiguration.enterpriseLogo,
  hasSidebarToggle: state.sidebar.hasSidebarToggle,
});

export default connect(mapStateToProps)(Header);
