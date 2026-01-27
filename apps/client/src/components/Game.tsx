import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { Room, Round, Move, MOVE_DISPLAY } from "@rock-paper-beer/game-logic";

const MOVE_TIMEOUT_MS = 10000; // 10 seconds

const Game: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [message, setMessage] = useState("");
  const [isStartingRound, setIsStartingRound] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    // Request room data when component mounts
    socket.emit("getRoom", { roomId });

    // Listen for room updates
    socket.on("roomUpdated", ({ room }) => {
      setRoom(room);
    });

    socket.on("roomData", ({ room }) => {
      setRoom(room);
    });

    socket.on("roundStarted", ({ room, timeoutMs }) => {
      setRoom(room);
      setSelectedMove(null);
      setMessage("");
      setIsStartingRound(false);
      // Start countdown timer
      setTimeLeft(Math.ceil((timeoutMs || MOVE_TIMEOUT_MS) / 1000));
    });

    socket.on("moveSubmitted", ({ room, timeout, playerId }) => {
      setRoom(room);
      if (timeout && playerId) {
        setMessage("Time's up! Random move submitted.");
      }
    });

    socket.on("roundFinished", ({ room }) => {
      setRoom(room);
      setTimeLeft(null); // Clear timer when round ends
    });

    socket.on("playerDisconnected", ({ playerId, room }) => {
      setRoom(room);
      setMessage("Opponent disconnected");
      setTimeLeft(null);
    });

    socket.on("error", ({ message }) => {
      setMessage(message);
      setIsStartingRound(false);
    });

    return () => {
      socket.off("roomUpdated");
      socket.off("roomData");
      socket.off("roundStarted");
      socket.off("moveSubmitted");
      socket.off("roundFinished");
      socket.off("playerDisconnected");
      socket.off("error");
    };
  }, [socket, roomId, room?.gamePhase]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft]);

  const startRound = () => {
    if (!socket || !roomId) return;

    setIsStartingRound(true);
    setMessage("");
    socket.emit("startRound", { roomId });
  };

  const submitMove = (move: Move) => {
    if (!socket || !roomId) return;

    setSelectedMove(move);
    socket.emit("submitMove", { roomId, move });
  };

  const getCurrentRound = (): Round | null => {
    if (!room || room.rounds.length === 0) return null;
    return room.rounds[room.rounds.length - 1];
  };

  const getMyPlayerIndex = (): number => {
    if (!room || !socket) return -1;
    return room.players.findIndex((p) => p.id === socket.id);
  };

  const getOpponent = () => {
    if (!room || !socket) return null;
    return room.players.find((p) => p.id !== socket.id);
  };

  const getCurrentResult = () => {
    const currentRound = getCurrentRound();
    if (!currentRound || !currentRound.result) return null;

    const myIndex = getMyPlayerIndex();
    if (myIndex === -1) return currentRound.result;

    const result = currentRound.result;
    const isPlayer1 = myIndex === 0;

    if (result.winner === "draw") return result;

    const winner = isPlayer1 ? "player1" : "player2";
    const loser = isPlayer1 ? "player2" : "player1";

    return {
      ...result,
      winner: result.winner === winner ? "player1" : "player2",
    };
  };

  const renderMoveButtons = () => {
    const currentRound = getCurrentRound();
    const myIndex = getMyPlayerIndex();
    // Using object property access instead of Map.has() for serialized data
    const hasSubmitted = currentRound?.moves && socket?.id ? socket.id in currentRound.moves : false;

    if (room?.gamePhase !== "round" || !currentRound || hasSubmitted) {
      return null;
    }

    return (
      <div>
        <h3>Choose Your Move:</h3>
        {/* Countdown Timer */}
        {timeLeft !== null && (
          <div
            style={{
              fontSize: "2em",
              color: timeLeft <= 3 ? "#ef4444" : "var(--accent-gold)",
              marginBottom: "15px",
              animation: timeLeft <= 3 ? "flash 0.5s infinite" : "none",
            }}
          >
            ⏱️ {timeLeft}s
          </div>
        )}
        <div className="game-board">
          {(["rock", "paper", "beer"] as Move[]).map((move) => (
            <button
              key={move}
              className="btn move-btn"
              onClick={() => submitMove(move)}
              disabled={selectedMove !== null}
            >
              {MOVE_DISPLAY[move].emoji}
              <span>{MOVE_DISPLAY[move].label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render avatar from SVG string
  const renderAvatar = (avatar?: string, size: number = 60) => {
    if (!avatar) return null;
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid var(--accent-gold)",
          background: "var(--bg-light)",
        }}
        dangerouslySetInnerHTML={{ __html: avatar }}
      />
    );
  };

  const renderGameStatus = () => {
    if (!room) return null;

    const opponent = getOpponent();
    const currentRound = getCurrentRound();
    const myIndex = getMyPlayerIndex();

    // Get current player info
    const myPlayer = myIndex !== -1 ? room.players[myIndex] : null;

    return (
      <div style={{ marginBottom: "30px" }}>
        {/* Opponent area (top) */}
        <div className="player-status" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {renderAvatar(opponent?.avatar)}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>
              {opponent?.name || "Waiting for opponent..."}
              <span className={`status-indicator ${opponent ? "connected" : "waiting"}`}></span>
            </h3>
            {currentRound?.moves && opponent?.id && opponent.id in currentRound.moves && (
              <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>Move submitted!</p>
            )}
          </div>
        </div>

        {/* VS divider */}
        <div style={{ textAlign: "center", margin: "15px 0", color: "var(--accent-gold)", fontSize: "1.5em" }}>
          ⚔️ VS ⚔️
        </div>

        {/* Your area (bottom) */}
        <div className="player-status" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {renderAvatar(myPlayer?.avatar)}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>
              {myPlayer?.name || "You"}
              <span className="status-indicator connected"></span>
            </h3>
            {currentRound?.moves && socket?.id && socket.id in currentRound.moves && (
              <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>Move submitted!</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const currentRound = getCurrentRound();
    if (!currentRound?.result) return null;

    const result = getCurrentResult();
    if (!result) return null;

    const isDraw = result.winner === "draw";
    const isWin = result.winner === "player1";

    return (
      <div className={`result-display ${isDraw ? "" : isWin ? "win" : "lose"}`}>
        <h2>{isDraw ? "It's a Draw!" : isWin ? "You Win! 🎉" : "You Lose! 💔"}</h2>
        <div className="moves-comparison">
          <div>{MOVE_DISPLAY[result.player1Move].emoji}</div>
          <div className="vs">VS</div>
          <div>{MOVE_DISPLAY[result.player2Move].emoji}</div>
        </div>
      </div>
    );
  };

  const renderControls = () => {
    if (!room) return null;

    const opponent = getOpponent();
    const canStart = room.players.length === 2 && room.gamePhase === "waiting";

    return (
      <div style={{ marginTop: "30px" }}>
        {canStart && (
          <button className="btn btn-primary" onClick={startRound} disabled={isStartingRound}>
            {isStartingRound ? "Starting..." : "Start Round"}
          </button>
        )}

        {room.gamePhase === "reveal" && (
          <div>
            {renderResults()}
            <button className="btn btn-primary" onClick={startRound} style={{ marginTop: "20px" }}>
              Play Again
            </button>
          </div>
        )}
      </div>
    );
  };

  // Show loading state when starting round
  if (isStartingRound) {
    return (
      <div className="game-container game-screen">
        <h2>Starting battle arena...</h2>
        <p className="waiting-text">🍺</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="game-container game-screen">
        <h2>Loading room...</h2>
        <p className="waiting-text">🍺</p>
      </div>
    );
  }

  return (
    <div className="game-container game-screen">
      <h2>Room Code:</h2>
      <div className="room-code">{room.code || roomId}</div>
      {room.code && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-secondary)" }}>
          Share this link: <code style={{ background: "var(--bg-medium)", padding: "2px 4px", borderRadius: "4px" }}>
            {window.location.origin}/join/{room.code}
          </code>
        </div>
      )}

      {message && (
        <div
          style={{
            background: "var(--accent-gold)",
            color: "var(--bg-darkest)",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "20px",
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      )}

      {renderGameStatus()}
      {renderMoveButtons()}
      {renderControls()}

      <div style={{ marginTop: "40px" }}>
        <button className="btn" onClick={() => navigate("/")} style={{ fontSize: "12px" }}>
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default Game;
