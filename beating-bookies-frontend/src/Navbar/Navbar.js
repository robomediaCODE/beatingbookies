import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Navbar() {
    const { logout } = useAuth();  // Get the logout function from AuthContext
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();  // Use the logout function from AuthContext
        navigate('/login');  // Redirect to login page after logout
    };

    return (
        <div>
            <Link to="/userdashboard">Dashboard | </Link>
            <Link to="/profile">Profile </Link>
            <Link to="/teams">| Team List | </Link>
            <button onClick={handleLogout}>Logout</button> {/* Updated logout button */}
        </div>
    );
}

export default Navbar;
