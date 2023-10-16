// TeamDetail.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTeamById } from '../../api';

function TeamDetail() {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetchTeamById(teamId);
            setTeam(response.data);
        };
        fetchData();
    }, [teamId]);

    if (!team) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>{team.name} ({team.abbreviation})</h2>
            <p>Conference: {team.conference}</p>
            <p>Division: {team.division}</p>
            {/* Add more details as required */}
        </div>
    );
}

export default TeamDetail;
