import React from 'react';
import { Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './styles/gameboy.css';

// Component to handle room code from URL
const JoinRoomHandler: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (roomCode) {
      // Store the room code in sessionStorage so Lobby can use it
      sessionStorage.setItem('pendingRoomCode', roomCode);
      navigate('/', { replace: true });
    }
  }, [roomCode, navigate]);

  return <div>Loading...</div>;
};

function App() {
  return (
    <div className="app">
      <header>
        <h1>🍺 Rock Paper Beer 🍺</h1>
      </header>
      <main>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/room/:roomId" element={<Game />} />
            <Route path="/join/:roomCode" element={<JoinRoomHandler />} />
          </Routes>
        </SocketProvider>
      </main>
    </div>
  );
}

export default App;