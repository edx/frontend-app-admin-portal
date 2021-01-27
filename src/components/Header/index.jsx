import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dropdown, Navbar, AvatarButton, Nav,
} from '@edx/paragon';

import {
  getAuthenticatedUser, hydrateAuthenticatedUser, getLogoutRedirectUrl,
} from '@edx/frontend-platform/auth';
import SidebarToggle from '../../containers/SidebarToggle';
import Img from '../Img';

import { configuration } from '../../config';

import './Header.scss';

export const Logo = ({ enterpriseLogo, enterpriseName }) => {
  const logo = configuration.LOGO_URL;

  return (
    <Img
      src={enterpriseLogo || logo}
      alt={`${enterpriseName || 'edX'} logo`}
      onError={(e) => { e.target.src = logo; }}
    />
  );
};

Logo.defaultProps = {
  enterpriseLogo: configuration.LOGO_URL,
};

Logo.propTypes = {
  enterpriseLogo: PropTypes.string,
  enterpriseName: PropTypes.string.isRequired,
};

export const HeaderDropdown = ({ user }) => {
  const { profileImage, username } = user;
  const avatarImage = profileImage?.hasImage ? profileImage.imageUrlMedium : null;
  const avatarScreenReaderText = `Profile image for ${username}`;

  return (
    <Dropdown>
      <Dropdown.Toggle
        as={AvatarButton}
        src={avatarImage}
        id="avatar-dropdown"
        size="md"
        alt={avatarScreenReaderText}
      >
        {username}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item
          href={getLogoutRedirectUrl()}
        >
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

HeaderDropdown.propTypes = {
  user: PropTypes.shape({
    profileImage: PropTypes.shape({
      hasImage: PropTypes.bool.isRequired,
      imageUrlMedium: PropTypes.string,
    }),
    username: PropTypes.string.isRequired,
  }).isRequired,
};

const Header = ({
  hasSidebarToggle, enterpriseName, enterpriseLogo,
}) => {
  const user = getAuthenticatedUser();
  useEffect(() => {
    // if there is no email, the user data has not been hydrated
    if (user && !user.email) {
      hydrateAuthenticatedUser();
    }
    // rehydrate if the username changes
  }, [user?.username, user?.id]);

  return (
    <header className="container-fluid border-bottom">
      <Navbar aria-label="header" className="px-0 py-1 justify-content-between">
        <Nav>
          {hasSidebarToggle && <SidebarToggle />}

          <Nav.Link
            href="/"
            className="navbar-brand"
          >
            <Logo enterpriseLogo={enterpriseLogo} enterpriseName={enterpriseName || ''} />
          </Nav.Link>

        </Nav>
        {user?.username && (
          <HeaderDropdown user={user} />
        )}
      </Navbar>
    </header>
  );
};

Header.propTypes = {
  enterpriseLogo: PropTypes.string,
  enterpriseName: PropTypes.string,
  hasSidebarToggle: PropTypes.bool,
};

Header.defaultProps = {
  enterpriseLogo: null,
  enterpriseName: null,
  hasSidebarToggle: false,
};

export default Header;
