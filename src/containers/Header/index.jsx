import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Dropdown } from '@edx/paragon';

import Img from '../../components/Img';

import EdxLogo from '../../images/edx-logo.png';
import './Header.scss';

const Header = (props) => {
  const { enterpriseLogo, enterpriseSlug, email } = props;

  return (
    <header className="container">
      <nav className="navbar px-0 justify-content-between">
        <Link
          to={enterpriseSlug ? `/${enterpriseSlug}` : '/'}
          className="navbar-brand"
        >
          <Img src={enterpriseLogo || EdxLogo} alt="" />
        </Link>
        {email && <Dropdown
          title={email}
          menuItems={[
            <Link to="/logout" />,
          ]}
        />}
      </nav>
    </header>
  );
};

Header.propTypes = {
  enterpriseSlug: PropTypes.string,
  enterpriseLogo: PropTypes.string,
  email: PropTypes.string,
};

Header.defaultProps = {
  enterpriseSlug: null,
  enterpriseLogo: null,
  email: null,
};

const mapStateToProps = state => ({
  enterpriseSlug: state.portalConfiguration.enterpriseSlug,
  enterpriseLogo: state.portalConfiguration.enterpriseLogo,
  email: state.login.email,
});

export default connect(mapStateToProps)(Header);
