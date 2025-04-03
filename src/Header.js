import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import './Header.css';

const Navbar = styled.nav`
  background-color: #fff !important;
`;

const Header = () => {

  return (
    <Navbar className="navbar navbar-expand-lg navbar-light header">
      <div className="header-left">
        <a className="navbar-brand" href="#">dFroms</a>
      </div>
    </Navbar>
  );
};

export default Header;
