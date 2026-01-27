import { Move, RoundResult } from './types';

/**
 * Determine the winner of a round based on Rock Paper Beer rules.
 * 
 * Rules:
 * Rock 🪨 beats Beer 🍺
 * Beer 🍺 beats Paper 📄  
 * Paper 📄 beats Rock 🪨
 * 
 * @param moveA - First player's move
 * @param moveB - Second player's move
 * @returns RoundResult with winner and moves
 */
export function decideWinner(moveA: Move, moveB: Move): RoundResult {
  // If moves are the same, it's a draw
  if (moveA === moveB) {
    return {
      winner: 'draw',
      player1Move: moveA,
      player2Move: moveB,
    };
  }

  // Define winning relationships
  const winsAgainst: Record<Move, Move> = {
    rock: 'beer',    // Rock beats Beer
    beer: 'paper',    // Beer beats Paper
    paper: 'rock',    // Paper beats Rock
  };

  // Check if moveA beats moveB
  if (winsAgainst[moveA] === moveB) {
    return {
      winner: 'player1',
      player1Move: moveA,
      player2Move: moveB,
    };
  }

  // If moveA doesn't beat moveB, then moveB must beat moveA
  return {
    winner: 'player2',
    player1Move: moveA,
    player2Move: moveB,
  };
}

/**
 * Validate if a string is a valid move
 */
export function isValidMove(move: string): move is Move {
  return ['rock', 'paper', 'beer'].includes(move);
}

/**
 * Get a random valid move (useful for testing or AI)
 */
export function getRandomMove(): Move {
  const moves: Move[] = ['rock', 'paper', 'beer'];
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Check if a move beats another move (returns boolean)
 */
export function doesMoveWin(move: Move, againstMove: Move): boolean {
  const winsAgainst: Record<Move, Move> = {
    rock: 'beer',
    beer: 'paper',
    paper: 'rock',
  };
  return winsAgainst[move] === againstMove;
}