import React, { useState, useEffect } from 'react';
import { fetchTeams } from '../../api';  // Import the fetchTeams function you created earlier
import './Teams.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


function Teams() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchTeams();
                console.log("Fetched data:", response.data);
                setTeams(response.data);
            } catch (error) {
                console.error("Error fetching teams:", error.response ? error.response.data : error.message);
            } finally {
                setLoading(false);  // Ensure this is in the 'finally' block
            }
        };
        fetchData();
    }, []);
    

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Teams</h2>
            <ul>
                {teams.map((team) => (
                    <li key={team.id}>
                        <Link to={`/teams/${team.id}`}>{team.name} ({team.abbreviation})</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Teams;
