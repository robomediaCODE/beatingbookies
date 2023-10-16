import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import defaultProfilePic from '../../assets/default-profile-pic.png';

function UserProfile() {
    const [userData, setUserData] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [updatedEmail, setUpdatedEmail] = useState('');
    const [updatedPassword, setUpdatedPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const navigate = useNavigate();

    const fetchUserData = () => {
        api.get('/api/users/me/')
            .then(response => {
                setUserData(response.data);
                setUpdatedEmail(response.data.email);
            })
            .catch(error => {
                if (error.response && error.response.status === 401) {
                    setErrorMessage('Unauthorized access. Please log in.');
                    navigate('/login');
                } else {
                    console.error("Error fetching user data", error);
                }
            });
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleProfilePicUpload = (event) => {
        event.preventDefault();
        const file = event.target.files[0];
        
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setSuccessMessage('Please upload a valid JPEG or PNG image.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setSuccessMessage('Please upload an image smaller than 2MB.');
            return;
        }

        const formData = new FormData();
        formData.append('profile_picture', file);
        
        api.post('/api/users/upload-profile-picture/', formData)
           .then(response => {
               setSuccessMessage('Profile picture updated successfully!');
               fetchUserData();
           })
           .catch(error => {
               console.error("Error uploading profile picture", error);
               setSuccessMessage('Error updating profile picture. Please try again.');
           });
    };

    const handleDeleteProfilePic = () => {
        api.delete('/api/users/delete-profile-picture/')
            .then(() => {
                setSuccessMessage("Profile picture deleted and reset to default.");
                fetchUserData();
            })
            .catch(error => {
                console.error("Error deleting profile picture", error);
                setErrorMessage("Error deleting profile picture. Please try again.");
            });
    };

    const handleUpdateProfile = (event) => {
        event.preventDefault();
        if (updatedPassword !== confirmPassword) {
            setErrorMessage("Passwords don't match.");
            return;
        }

        const updatedData = {
            email: updatedEmail,
            password: updatedPassword
        };

        api.put('/api/users/me/', updatedData)
            .then(() => {
                setSuccessMessage("Profile updated successfully.");
                fetchUserData();
            })
            .catch(error => {
                console.error("Error updating profile", error);
                setErrorMessage("Error updating profile. Please try again.");
            });
    };

    if (!userData) return <p>Loading...</p>;

    return (
        <div>
            <h2>Welcome, {userData.username}!</h2>
            <p><img src={userData.profile_picture || defaultProfilePic} alt="Profile" /></p>
            <p>Email: {userData.email}</p>
            <p>Date Registered: {new Date(userData.date_joined).toLocaleDateString()}</p>

            <h3>Update Profile Details</h3>
            <form onSubmit={handleUpdateProfile}>
                <div>
                    <label>Email:</label>
                    <input type="email" value={updatedEmail} onChange={(e) => setUpdatedEmail(e.target.value)} />
                </div>
                <div>
                    <label>New Password:</label>
                    <input type="password" value={updatedPassword} onChange={(e) => setUpdatedPassword(e.target.value)} />
                </div>
                <div>
                    <label>Confirm Password:</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div>
                    <button type="submit">Update Profile</button>
                </div>
            </form>

            <h3>Update Profile Picture</h3>
            <input type="file" onChange={handleProfilePicUpload} />
            <button onClick={handleDeleteProfilePic}>Delete Profile Picture</button>
            
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {successMessage && <p>{successMessage}</p>}
        </div>
    );
}

export default UserProfile;
