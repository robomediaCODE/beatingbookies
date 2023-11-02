import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';  // Importing react-toastify for notifications
import 'react-toastify/dist/ReactToastify.css';  // Importing CSS for react-toastify

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
    const [showNotification, setShowNotification] = useState(false);  // State to control notification visibility
    const [finalPicks, setFinalPicks] = useState({});


    useEffect(() => {
      console.log("Predictions state after team selection:", predictions);
    }, [predictions]);

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
    
          // Reset dropdown selection to force user to make a choice
          if (predictions[selectedMatchupId]) {
            delete predictions[selectedMatchupId].prediction;
          }
        }
    };
    
    const handleModalClose = () => {
      setShowModal(false);
      setIsLock(false);  // Reset the lock state when modal is closed
    };
  
    const handleTeamSelection = (event) => {
      const selectedTeam = event.target.value;
      console.log("Selected team:", selectedTeam);
  
      setPredictions(prevPredictions => ({
        ...prevPredictions,
        [selectedMatchupId]: {
            ...prevPredictions[selectedMatchupId],
            prediction: selectedTeam
        }
     }));
    
    };

    const handleWeekChange = (event) => {
        setSelectedWeek(event.target.value);
    };

    const fetchExistingPicks = async (week) => {
      try {
        const response = await api.get(`/api/existingPicks/?week=${week}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching existing picks:", error);
      }
      return null;
    };

    const handleSubmitPicks = () => {
      const payload = {
          week_number: selectedWeek,
          picks: finalPicks,
      };
  
      api.post('/api/submitPicks/', payload)
        .then(response => {
            toast.success('Picks submitted successfully!');
            
            // Reset the finalPicks state
            setFinalPicks({});
            setPredictions({});
        })
        .catch(error => {
            if (error.response && error.response.status === 400) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Error submitting picks. Try logging out and back in.');
            }
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
            // Refetch the weekly matchups to update the list
            api.get(`/api/weeklymatchups/?week=${selectedWeek}&use_abbreviation=true`)
              .then(response => {
                setWeeklyMatchups(response.data);
              })
              .catch(error => {
                console.error("Error refetching weekly matchups:", error);
              });
      
            // Display toast to notify the user that the matchup has been deleted
            toast.success('Matchup deleted successfully!');
          })
          .catch(error => {
            // Handle any errors
            console.error('Error deleting matchup:', error);
            toast.error('Error deleting matchup');  // Display error toast
          });
      };

      // Add this useEffect inside your component
      useEffect(() => {
        console.log("Current predictions state after Confirm (useEffect):", predictions);
      }, [predictions]);

      const handleConfirm = async () => {
        console.log("Current predictions state before Confirm:", predictions);
        console.log('Current isLock state:', isLock);
        console.log('homeTeam:', homeTeam);
        console.log('awayTeam:', awayTeam);
          
        // Fetch existing picks for the selected week
        const existingPicks = await fetchExistingPicks(selectedWeek);
          
        // Check if there's already a lock
        const existingLock = existingPicks?.some(pick => pick.is_locked);
        if (isLock && existingLock) {
            toast.error('Only one lock is allowed per week.');
            return;
        }
          
        // Check for the total number of picks including existing ones
        const totalExistingPicks = existingPicks?.length || 0;
        const totalNewPicks = Object.keys(predictions).length;
        if ((totalExistingPicks + totalNewPicks) > 3) {
            toast.error('You can make only 3 picks per week.');
            return;
        }
          
        // Update only the isLocked state for the selected matchup
        setPredictions(prevPredictions => ({
          ...prevPredictions,
          [selectedMatchupId]: {
              ...prevPredictions[selectedMatchupId],
              is_locked: isLock
          }
        }));
        
        // Debug log for the new picks
        console.log("New picks to be set:", predictions);
    
        // Update the finalPicks state
        setFinalPicks(prevPicks => ({
            ...prevPicks,
            [selectedMatchupId]: {
                prediction: predictions[selectedMatchupId]?.prediction,
                is_locked: isLock
            }
        }));
    
        // Reset isLock state and close the modal
        setIsLock(false);
        setShowModal(false);
          
        // Display toast to notify the user that their prediction has been saved
        toast.success('Prediction saved successfully!');
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
            
            // Refetch the weekly matchups to update the list
            api.get(`/api/weeklymatchups/?week=${selectedWeek}&use_abbreviation=true`)
                .then(response => {
                setWeeklyMatchups(response.data);
                })
                .catch(error => {
                console.error("Error refetching weekly matchups:", error);
                });
        
            // Reset the form fields
            setNewMatchup({
                week_number: '',
                away_team: '',
                home_team: '',
                away_team_spread: '',
                home_team_spread: ''
            });
        
            // Display toast to notify the user that the matchup has been added
            toast.success('Matchup added successfully!');
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
            <ToastContainer />
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
                <select onChange={handleTeamSelection} value={predictions[selectedMatchupId]?.prediction || ''}>
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