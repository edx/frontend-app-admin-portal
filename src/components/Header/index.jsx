import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Icon, Dropdown } from '@edx/paragon';

import SidebarToggle from '../../containers/SidebarToggle';
import Img from '../Img';

import apiClient from '../../data/apiClient';

import EdxLogo from '../../images/edx-logo.png';
import './Header.scss';

class Header extends React.Component {
  componentDidMount() {
    this.props.fetchUserProfile(this.props.username);
  }

  getProfileIconElement() {
    const { userProfile, email } = this.props;
    const profileImage = userProfile && userProfile.profile_image;
    const screenReaderText = `Profile image for ${email}`;

    if (profileImage && profileImage.has_image) {
      return <Img src={profileImage.image_url_medium} alt={screenReaderText} />;
    }
    return <Icon className={['fa', 'fa-user', 'px-3']} screenReaderText={screenReaderText} />;
  }

  renderLogo() {
    const { enterpriseLogo, enterpriseName } = this.props;
    return (
      <Img
        src={enterpriseLogo || EdxLogo}
        alt={`${enterpriseName || 'edX'} logo`}
        onError={(e) => { e.target.src = EdxLogo; }}
      />
    );
  }

  render() {
    const { email, hasSidebarToggle } = this.props;
    return (
      <header className="container-fluid">
        <nav className="navbar px-0 justify-content-between">
          <div>
            {hasSidebarToggle && <SidebarToggle />}
            <Link
              to="/"
              className="navbar-brand"
            >
              {this.renderLogo()}
            </Link>
            <span className="badge badge-secondary beta">Beta</span>
          </div>
          {email && <Dropdown
            title={email}
            iconElement={this.getProfileIconElement()}
            menuItems={[
              <button onClick={() => apiClient.logout()}>Logout</button>,
            ]}
          />}
        </nav>
      </header>
    );
  }
}

Header.propTypes = {
  enterpriseLogo: PropTypes.string,
  enterpriseName: PropTypes.string,
  email: PropTypes.string,
  username: PropTypes.string,
  fetchUserProfile: PropTypes.func,
  userProfile: PropTypes.shape({}),
  hasSidebarToggle: PropTypes.bool,
};

Header.defaultProps = {
  enterpriseLogo: null,
  enterpriseName: null,
  email: null,
  username: null,
  fetchUserProfile: () => {},
  userProfile: null,
  hasSidebarToggle: false,
};

export default Header;
