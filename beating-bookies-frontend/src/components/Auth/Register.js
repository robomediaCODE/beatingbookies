import React, { useState, useRef } from 'react';  // Added useRef
import { registerUser } from '../../api';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await registerUser(formData);
            console.log('Registration successful', response.data);
        } catch (error) {
            console.error('Registration error', error);
        }
    };

    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const usernameRef = useRef();

    const handleUsernameChange = async () => {
        const username = usernameRef.current.value;

        try {
            const response = await fetch(`/api/check-username/${username}/`);
            const data = await response.json();
            setUsernameAvailable(data.isAvailable);
        } catch (error) {
            console.error('Error checking username:', error);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        onBlur={handleUsernameChange} // Added onBlur event
                        ref={usernameRef} // Added ref
                        required 
                    />
                    {usernameAvailable === true && <span style={{ color: 'green' }}>Username is available!</span>}
                    {usernameAvailable === false && <span style={{ color: 'red' }}>Username is already taken!</span>}
                </div>
                <div>
                    <label>Email:</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default Register;
