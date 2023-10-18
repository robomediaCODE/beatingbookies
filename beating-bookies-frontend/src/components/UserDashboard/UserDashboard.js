import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '1em',
    zIndex: 1000,
  };
  
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 999,
  };

function UserDashboard() {
    const [username, setUsername] = useState(null);
    const [weeklyMatchups, setWeeklyMatchups] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [teams, setTeams] = useState([]);  // New state variable to store list of teams
    const [newMatchup, setNewMatchup] = useState({
      week_number: '',
      away_team: '',
      home_team: '',
      away_team_spread: '',
      home_team_spread: ''
    });
    const navigate = useNavigate();
    const [predictions, setPredictions] = useState({});
    const [showModal, setShowModal] = useState(false);  // State to control the visibility of the modal
    const [selectedMatchupId, setSelectedMatchupId] = useState(null);  // State to hold the selected matchup ID
    const [homeTeam, setHomeTeamName] = useState('');  // State to hold the home team name
    const [awayTeam, setAwayTeamName] = useState('');  // State to hold the away team name
    const [isLock, setIsLock] = useState(false);  // State to hold if the prediction is a lock


    // New useEffect for fetching the username
    useEffect(() => {
        const userId = extractUserIdFromToken();
        if (userId) {
        api.get(`/api/users/${userId}/`)  // Replace with your actual API endpoint
            .then(response => {
            setUsername(response.data.username);  // Assuming the response has a 'username' field
            })
            .catch(error => {
            console.error("Error fetching username:", error);
            });
        }
    }, []);  // Empty dependency array to run only once when component mounts

    // New useEffect to fetch list of teams
    useEffect(() => {
        api.get('/api/teams/')
            .then(response => {
                setTeams(response.data);
            })
            .catch(error => {
                console.error("Error fetching teams:", error);
            });
    }, []);

    // New useEffect for authentication
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!token && !refreshToken) {
            navigate('/login');
            return;
        }

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp < currentTime) {
                    // ... your refresh logic
                }
            } catch (error) {
                console.error('Invalid token:', error);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, []);  // Empty dependency array to run only once when component mounts

    // Existing useEffect to fetch the current week
    useEffect(() => {
        api.get('/api/currentWeek/')
            .then(response => {
                const currentWeek = response.data.currentWeek;
                setSelectedWeek(currentWeek);
            })
            .catch(error => {
                console.error("Error fetching current week", error);
            });
    }, []);

    // Existing useEffect to fetch the user's weekly matchups
    useEffect(() => {
        if (selectedWeek) {
            api.get(`/api/weeklymatchups/?week=${selectedWeek}&use_abbreviation=true`)
                .then(response => {
                    setWeeklyMatchups(response.data);
                })
                .catch(error => {
                    if (error.response && error.response.status === 401) {
                        navigate('/login');
                    } else {
                        console.error("Error fetching weekly matchups", error);
                    }
                });
        }
    }, [selectedWeek]);  // Dependency array now includes selectedWeek

    const weekOptions = [
        "Week 1", "Week 2", "Week 3", "Week 4", "Week 5",
        "Week 6", "Week 7", "Week 8", "Week 9", "Week 10",
        "Week 11", "Week 12", "Week 13", "Week 14", "Week 15",
        "Week 16", "Week 17", "Week 18", "Wildcard", "Divisional",
        "Conference Championship", "Super Bowl"
    ];

    const handleSelectMatchup = (matchupId) => {
        setSelectedMatchupId(matchupId);
      
        const selectedMatchup = weeklyMatchups.find(matchup => matchup.id === matchupId);
        if (selectedMatchup) {
          setHomeTeamName(selectedMatchup.home_team_display);
          setAwayTeamName(selectedMatchup.away_team_display);
      
          setShowModal(true);
        }
      };
    
      const handleModalClose = () => {
        setShowModal(false);
        setIsLock(false);  // Reset the lock state when modal is closed
      };
    
      const handleTeamSelection = (event) => {
        const selectedTeam = event.target.value;
        console.log("Selected team in dropdown:", selectedTeam); // Debug log
    
        // Prepare your payload and send it to the backend
        const predictionData = {
            prediction: selectedTeam,
            is_locked: isLock
        };
        console.log("Prediction data:", predictionData); // Debug log
        
        // Update local state to keep track of the prediction and lock status
        setPredictions({
            ...predictions,
            [selectedMatchupId]: predictionData
        });
    
        console.log("Updated predictions state:", predictions); // Debug log
      };

    const handleWeekChange = (event) => {
        setSelectedWeek(event.target.value);
    };

    const handleSubmitPicks = () => {
        const payload = {
          week_number: selectedWeek,  // This should align with what the backend expects
          picks: predictions,
        };
    
        console.log("Debug: Payload being sent in handleSubmitPicks:", payload);  // Debugging log
        
        api.post('/api/submitPicks/', payload)
          .then(response => {
            console.log("Successfully submitted picks:", response.data);
          })
          .catch(error => {
            console.error("Error submitting picks:", error);
          });
      };
    
    const handleNewMatchupChange = (event) => {
        setNewMatchup({
          ...newMatchup,
          [event.target.name]: event.target.value
        });
    };

    const extractUserIdFromToken = () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            const decodedToken = jwtDecode(token);
            return decodedToken.user_id; // Replace with the actual key in the token that holds the user_id
          } catch (error) {
            console.error('Invalid token:', error);
          }
        }
        return null;
      };

    const handleDeleteMatchup = (matchupId) => {
        // Make an API call to delete the matchup with the given ID
        api.delete(`/api/weeklymatchups/${matchupId}/`)
            .then(response => {
                // Remove the deleted matchup from the list
                setWeeklyMatchups(weeklyMatchups.filter(matchup => matchup.id !== matchupId));
            })
            .catch(error => {
                // Handle any errors
                console.error('Error deleting matchup:', error);
            });
      };

      const handleConfirm = () => {
        // Prepare payload for the backend
    
        console.log('Current isLock state:', isLock); // Debug log here
        console.log('homeTeam:', homeTeam);
        console.log('awayTeam:', awayTeam);
    
        const selectedTeam = homeTeam; // Or awayTeam, based on what user selected in the modal
    
        const payload = {
            week_number: selectedWeek,  // This should align with what the backend expects
            picks: {
                ...predictions,
                [selectedMatchupId]: {
                    prediction: selectedTeam,
                    is_locked: isLock  // Use isLock directly
                }
            },
        };
    
        // Validate payload before sending
        if (!payload.week_number || !Object.keys(payload.picks).length) {
            console.error('Missing required fields for prediction');
            return;
        }

        console.log("Payload about to be sent to server:", payload);  // Debugging log

        api.post('/api/submitPicks/', payload)
            .then(response => {
                console.log("Successfully submitted picks:", response.data);
            })
            .catch(error => {
                console.error("Error submitting picks:", error);
            });
    
        // Reset isLock state and close the modal
        setIsLock(false);
        setShowModal(false);
    };    
      
    const handleAddMatchup = () => {
        // Debugging logs to verify data
        console.log("Teams:", teams);
        console.log("New Matchup:", newMatchup);
    
        // Ensure you're getting valid IDs for teams
        const awayTeam = teams.find(t => t.abbreviation === newMatchup.away_team);
        const homeTeam = teams.find(t => t.abbreviation === newMatchup.home_team);
    
        if (!awayTeam || !homeTeam) {
            console.error("Invalid team abbreviation provided");
            return;
        }
    
        const matchupToSend = {
            ...newMatchup,
            week_number: parseInt(newMatchup.week_number.split(' ')[1]), 
            away_team: awayTeam.id, 
            home_team: homeTeam.id,  
            away_team_spread: parseFloat(newMatchup.away_team_spread),
            home_team_spread: parseFloat(newMatchup.home_team_spread),
        };
    
        // Validate the data before sending
        if (!matchupToSend.week_number || !matchupToSend.away_team || !matchupToSend.home_team) {
            console.error("Validation Error: Missing required fields");
            return;
        }

        console.log("Sending this data to server:", matchupToSend);

        api.post('/api/weeklymatchups/', matchupToSend)
            .then(response => {
                console.log("Server responded with:", response.data);
                // Successfully added the new matchup to the backend
                setWeeklyMatchups([...weeklyMatchups, response.data]);
                setNewMatchup({
                    week_number: '',
                    away_team: '',
                    home_team: '',
                    away_team_spread: '',
                    home_team_spread: ''
                });
            })
            .catch(error => {
                // Handle any errors
                console.error('Error adding new matchup:', error);
                // If the error response has data, log that as well
                if (error.response && error.response.data) {
                    console.error('Server responded with:', error.response.data);
                }
            });

    };
    

    
// Return Functions
//----------------------------------------------------------------------------------------------------
    return (
        <div>
        <h2>User Dashboard</h2>

        <div>
            <h3>Add New Matchup</h3>
            <select
            name="week_number"
            value={newMatchup.week_number}
            onChange={handleNewMatchupChange}
            >
            <option value="" disabled>Select Week</option>
            {weekOptions.map((week, index) => (
                <option key={index} value={week}>{week}</option>
            ))}
            </select>
            <select
            name="away_team"
            value={newMatchup.away_team}
            onChange={handleNewMatchupChange}
            >
            <option value="" disabled>Select Away Team</option>
            {teams.map((team, index) => (
                <option key={index} value={team.abbreviation}>{team.name}</option>
            ))}
            </select>
            <select
            name="home_team"
            value={newMatchup.home_team}
            onChange={handleNewMatchupChange}
            >
            <option value="" disabled>Select Home Team</option>
            {teams.map((team, index) => (
                <option key={index} value={team.abbreviation}>{team.name}</option>
            ))}
            </select>
            <input
            type="text"
            name="away_team_spread"
            value={newMatchup.away_team_spread}
            onChange={handleNewMatchupChange}
            placeholder="Away Team Spread"
            />
            <input
            type="text"
            name="home_team_spread"
            value={newMatchup.home_team_spread}
            onChange={handleNewMatchupChange}
            placeholder="Home Team Spread"
            />
            <p />
            <button onClick={handleAddMatchup}>Add Matchup</button>
            <p />
        </div>

        <div>
            <label>Select Week: </label>
            <select value={selectedWeek} onChange={handleWeekChange}>
            <option value="" disabled>Select a week</option>
            {weekOptions.map((week, index) => (
                <option key={index} value={week}>{week}</option>
            ))}
            </select>
            <p />
        </div>


        {showModal && (
            <>
                <div style={overlayStyle}></div>
                <div style={modalStyle}>
                <h3>Select a team</h3>
                <select onChange={handleTeamSelection}>
                    <option value="" disabled>Select Team</option>
                    <option value={homeTeam}>{homeTeam}</option>
                    <option value={awayTeam}>{awayTeam}</option>
                </select>
                <div>
                    <label>
                    <input 
                        type="checkbox" 
                        checked={isLock} 
                        onChange={(e) => setIsLock(e.target.checked)}
                    />
                    Is this a lock?
                    </label>
                </div>
                <button onClick={handleConfirm}>Confirm</button>
                <button onClick={handleModalClose}>Cancel</button>
                </div>
            </>
            )}

        <div>
            {weeklyMatchups.map((matchup, index) => (
            <div key={index}>
                <span>
                {matchup.away_team_display} ({matchup.away_team_spread > 0 ? "+" : ""}{matchup.away_team_spread}) vs {matchup.home_team_display} ({matchup.home_team_spread > 0 ? "+" : ""}{matchup.home_team_spread})
                </span>
                <br />
                <span>Week: {matchup.week_number}</span>
                <br />
                <span>Created By: {matchup.created_by}</span>
                <br />
                <button onClick={() => handleSelectMatchup(matchup.id)}>Select Matchup</button>
                {matchup.created_by === username && (
                <button onClick={() => handleDeleteMatchup(matchup.id)}>Delete</button>
                )}
                <p />
            </div>
            ))}
        </div>
        
        <button onClick={handleSubmitPicks}>Submit Picks</button>
        </div>
    );
}
    
    export default UserDashboard;