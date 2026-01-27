import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './styles/gameboy.css';

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
          </Routes>
        </SocketProvider>
      </main>
    </div>
  );
}

export default App;