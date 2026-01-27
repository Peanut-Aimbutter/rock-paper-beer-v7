import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const Lobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState('');
  
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  const createRoom = () => {
    if (!playerName.trim() || !socket) return;
    
    setIsCreating(true);
    setMessage('');
    
    socket.emit('createRoom', { playerName: playerName.trim() });
    
    socket.once('roomCreated', ({ room }) => {
      setIsCreating(false);
      navigate(`/room/${room.id}`);
    });
    
    socket.once('error', ({ message }) => {
      setIsCreating(false);
      setMessage(message);
    });
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomId.trim() || !socket) return;
    
    setIsJoining(true);
    setMessage('');
    
    socket.emit('joinRoom', { 
      roomId: roomId.trim(), 
      playerName: playerName.trim() 
    });
    
    socket.once('roomUpdated', ({ room }) => {
      setIsJoining(false);
      navigate(`/room/${room.id}`);
    });
    
    socket.once('error', ({ message }) => {
      setIsJoining(false);
      setMessage(message);
    });
  };

  if (!connected) {
    return (
      <div className="lobby-container game-screen">
        <h2>Connecting to server...</h2>
        <p className="waiting-text">🍺</p>
      </div>
    );
  }

  return (
    <div className="lobby-container game-screen">
      <div>
        <h2>Welcome to Rock Paper Beer!</h2>
        <p style={{ marginBottom: '30px' }}>Create a room or join an existing one</p>
        
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="playerName" style={{ display: 'block', marginBottom: '10px' }}>
            Your Name:
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            style={{
              background: 'var(--bg-medium)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-color)',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '16px',
              fontFamily: 'inherit',
              width: '250px',
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Create New Room</h3>
          <button
            className="btn btn-primary"
            onClick={createRoom}
            disabled={!playerName.trim() || isCreating}
            style={{ marginBottom: '10px' }}
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <div>
          <h3>Join Existing Room</h3>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="roomId" style={{ display: 'block', marginBottom: '10px' }}>
              Room Code:
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room code"
              style={{
                background: 'var(--bg-medium)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-color)',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'inherit',
                width: '250px',
                marginBottom: '10px',
              }}
            />
          </div>
          <button
            className="btn"
            onClick={joinRoom}
            disabled={!playerName.trim() || !roomId.trim() || isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {message && (
          <div style={{
            background: 'var(--accent-gold)',
            color: 'var(--bg-darkest)',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '20px',
            fontWeight: 'bold',
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;