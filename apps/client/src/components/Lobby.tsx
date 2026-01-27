import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import multiavatar from "@multiavatar/multiavatar";

// Generate random avatar seeds for selection
const generateAvatarSeeds = (baseName: string): string[] => {
  const seeds: string[] = [];
  for (let i = 0; i < 6; i++) {
    seeds.push(`${baseName}_${i}_${Date.now()}`);
  }
  return seeds;
};

const Lobby: React.FC = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [avatarSeeds, setAvatarSeeds] = useState<string[]>([]);
  const [shareableLink, setShareableLink] = useState("");

  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  // Check for pending room code from URL
  React.useEffect(() => {
    const pendingCode = sessionStorage.getItem('pendingRoomCode');
    if (pendingCode) {
      setRoomId(pendingCode.toUpperCase());
      sessionStorage.removeItem('pendingRoomCode');
    }
  }, []);

  // Generate new avatar options when name changes
  useEffect(() => {
    if (playerName.trim()) {
      setAvatarSeeds(generateAvatarSeeds(playerName.trim()));
      setSelectedAvatarIndex(0);
    }
  }, [playerName]);

  // Generate avatar SVGs
  const avatars = useMemo(() => {
    return avatarSeeds.map((seed) => multiavatar(seed));
  }, [avatarSeeds]);

  const selectedAvatar = avatars[selectedAvatarIndex] || "";

  const refreshAvatars = () => {
    if (playerName.trim()) {
      setAvatarSeeds(generateAvatarSeeds(playerName.trim() + Math.random()));
      setSelectedAvatarIndex(0);
    }
  };

  const createRoom = () => {
    if (!playerName.trim() || !socket) return;

    setIsCreating(true);
    setMessage("");

    socket.emit("createRoom", { 
      playerName: playerName.trim(),
      avatar: selectedAvatar,
    });

    socket.once("roomCreated", ({ room }) => {
      setIsCreating(false);
      navigate(`/room/${room.id}`);
    });

    socket.once("error", ({ message }) => {
      setIsCreating(false);
      setMessage(message);
    });
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomId.trim() || !socket) return;

    setIsJoining(true);
    setMessage("");

    // Use roomCode for short codes (8 chars or less), roomId for full UUIDs
    const isShortCode = roomId.trim().length <= 8;
    socket.emit("joinRoom", {
      ...(isShortCode ? { roomCode: roomId.trim() } : { roomId: roomId.trim() }),
      playerName: playerName.trim(),
      avatar: selectedAvatar,
    });

    socket.once("roomUpdated", ({ room }) => {
      setIsJoining(false);
      navigate(`/room/${room.id}`);
    });

    socket.once("error", ({ message }) => {
      setIsJoining(false);
      setMessage(message);
    });
  };

  if (!connected) {
    return (
      <div className="lobby-container game-screen">
        <h2>Connecting to server...</h2>
        <p className="waiting-text">🍺</p>
        <div
          style={{
            background: "var(--bg-medium)",
            padding: "10px",
            margin: "20px 0",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          <p>Debug: Socket connection status: {connected ? "Connected" : "Disconnected"}</p>
          <p>Checking server at: http://localhost:3001</p>
          <p>Open browser console for more details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-container game-screen">
      <div>
        <h2>Welcome to Rock Paper Beer!</h2>
        <p style={{ marginBottom: "30px" }}>Create a room or join an existing one</p>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="playerName" style={{ display: "block", marginBottom: "10px" }}>
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
              background: "var(--bg-medium)",
              color: "var(--text-primary)",
              border: "2px solid var(--border-color)",
              padding: "10px",
              borderRadius: "4px",
              fontSize: "16px",
              fontFamily: "inherit",
              width: "250px",
            }}
          />
        </div>

        {/* Avatar Selection */}
        {playerName.trim() && avatars.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h3>Choose Your Avatar:</h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              {avatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatarIndex(index)}
                  style={{
                    width: "70px",
                    height: "70px",
                    padding: "5px",
                    border: selectedAvatarIndex === index 
                      ? "3px solid var(--accent-gold)" 
                      : "2px solid var(--border-color)",
                    borderRadius: "8px",
                    background: selectedAvatarIndex === index 
                      ? "var(--bg-light)" 
                      : "var(--bg-medium)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  dangerouslySetInnerHTML={{ __html: avatar }}
                />
              ))}
            </div>
            <button
              className="btn"
              onClick={refreshAvatars}
              style={{ marginTop: "15px", fontSize: "12px" }}
            >
              🔄 Refresh Avatars
            </button>
          </div>
        )}

        <div style={{ marginBottom: "30px" }}>
          <h3>Create New Room</h3>
          <button
            className="btn btn-primary"
            onClick={createRoom}
            disabled={!playerName.trim() || isCreating}
            style={{ marginBottom: "10px" }}
          >
            {isCreating ? "Creating..." : "Create Room"}
          </button>
        </div>

        <div>
          <h3>Join Existing Room</h3>
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="roomId" style={{ display: "block", marginBottom: "10px" }}>
              Room Code:
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter room code (e.g., ABC12345)"
              maxLength={8}
              style={{
                background: "var(--bg-medium)",
                color: "var(--text-primary)",
                border: "2px solid var(--border-color)",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "16px",
                fontFamily: "inherit",
                width: "250px",
                marginBottom: "10px",
                textTransform: "uppercase",
              }}
            />
          </div>
          <button
            className="btn"
            onClick={joinRoom}
            disabled={!playerName.trim() || !roomId.trim() || isJoining}
          >
            {isJoining ? "Joining..." : "Join Room"}
          </button>
        </div>

        {message && (
          <div
            style={{
              background: "var(--accent-gold)",
              color: "var(--bg-darkest)",
              padding: "10px",
              borderRadius: "4px",
              marginTop: "20px",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
