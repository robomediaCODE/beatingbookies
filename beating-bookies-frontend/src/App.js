import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Teams from './components/Teams/Teams';
import TeamDetail from './components/Teams/TeamDetail';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import UserProfile from './components/UserProfile/UserProfile';
import UserDashboard from './components/UserDashboard/UserDashboard';
import { useAuth } from './AuthContext';

function App() {
  const { isAuthenticated, isLoading } = useAuth(); // Import isLoading from AuthContext
  
  // Show a loading message or spinner while AuthContext is still loading
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Router>
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/teams" element={ isAuthenticated ? <Teams /> : <Navigate to="/login" />} />
            <Route path="/teams/:teamId" element={<TeamDetail />} />
            <Route path="/profile" element={ isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
            <Route path="/userdashboard" element={ isAuthenticated ? <UserDashboard /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
