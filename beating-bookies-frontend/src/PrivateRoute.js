import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const PrivateRoute = ({ element, ...rest }) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp > currentTime) {
        return <Route element={element} {...rest} />;
      }
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }

  return <Navigate to="/login" />;
};

export default PrivateRoute;
