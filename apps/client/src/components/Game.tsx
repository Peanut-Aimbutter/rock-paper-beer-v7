import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { Room, Round, Move, MOVE_DISPLAY } from "@rock-paper-beer/game-logic";

const Game: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [message, setMessage] = useState("");
  const [isStartingRound, setIsStartingRound] = useState(false);

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

    socket.on("roundStarted", ({ room }) => {
      setRoom(room);
      setSelectedMove(null);
      setMessage("");
      setIsStartingRound(false);
    });

    socket.on("moveSubmitted", ({ room }) => {
      setRoom(room);
    });

    socket.on("roundFinished", ({ room }) => {
      setRoom(room);
    });

    socket.on("playerDisconnected", ({ playerId, room }) => {
      setRoom(room);
      setMessage("Opponent disconnected");
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
    const hasSubmitted = currentRound?.moves.has(socket?.id || "");

    if (room?.gamePhase !== "round" || !currentRound || hasSubmitted) {
      return null;
    }

    return (
      <div>
        <h3>Choose Your Move:</h3>
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

  const renderGameStatus = () => {
    if (!room) return null;

    const opponent = getOpponent();
    const currentRound = getCurrentRound();
    const myIndex = getMyPlayerIndex();

    // Get current player info
    const myPlayer = myIndex !== -1 ? room.players[myIndex] : null;

    return (
      <div style={{ marginBottom: "30px" }}>
        <div className="player-status">
          <h3>
            {myPlayer?.name || "You"}
            <span className="status-indicator connected"></span>
          </h3>
          {currentRound?.moves.has(socket?.id || "") && <p>Move submitted!</p>}
        </div>

        <div className="player-status">
          <h3>
            {opponent?.name || "Waiting for opponent..."}
            <span className={`status-indicator ${opponent ? "connected" : "waiting"}`}></span>
          </h3>
          {currentRound?.moves.has(opponent?.id || "") && <p>Move submitted!</p>}
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
      <div className="room-code">{roomId}</div>

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
