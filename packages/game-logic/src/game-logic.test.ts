import { describe, it, expect } from 'vitest';
import { decideWinner, isValidMove, doesMoveWin } from '../src/game-logic';

describe('game-logic', () => {
  describe('decideWinner', () => {
    it('should return draw for same moves', () => {
      const result = decideWinner('rock', 'rock');
      expect(result.winner).toBe('draw');
      expect(result.player1Move).toBe('rock');
      expect(result.player2Move).toBe('rock');
    });

    it('should determine rock beats beer', () => {
      const result = decideWinner('rock', 'beer');
      expect(result.winner).toBe('player1');
      expect(result.player1Move).toBe('rock');
      expect(result.player2Move).toBe('beer');
    });

    it('should determine beer beats paper', () => {
      const result = decideWinner('beer', 'paper');
      expect(result.winner).toBe('player1');
      expect(result.player1Move).toBe('beer');
      expect(result.player2Move).toBe('paper');
    });

    it('should determine paper beats rock', () => {
      const result = decideWinner('paper', 'rock');
      expect(result.winner).toBe('player1');
      expect(result.player1Move).toBe('paper');
      expect(result.player2Move).toBe('rock');
    });

    it('should handle reverse case (beer loses to rock)', () => {
      const result = decideWinner('beer', 'rock');
      expect(result.winner).toBe('player2');
      expect(result.player1Move).toBe('beer');
      expect(result.player2Move).toBe('rock');
    });

    it('should handle all possible combinations', () => {
      // Test all combinations systematically
      const testCases = [
        ['rock', 'paper', 'player2'],
        ['rock', 'beer', 'player1'],
        ['paper', 'rock', 'player1'],
        ['paper', 'beer', 'player2'],
        ['beer', 'rock', 'player2'],
        ['beer', 'paper', 'player1'],
      ];

      testCases.forEach(([moveA, moveB, expectedWinner]) => {
        const result = decideWinner(moveA as any, moveB as any);
        expect(result.winner).toBe(expectedWinner);
      });
    });
  });

  describe('isValidMove', () => {
    it('should return true for valid moves', () => {
      expect(isValidMove('rock')).toBe(true);
      expect(isValidMove('paper')).toBe(true);
      expect(isValidMove('beer')).toBe(true);
    });

    it('should return false for invalid moves', () => {
      expect(isValidMove('scissors')).toBe(false);
      expect(isValidMove('spock')).toBe(false);
      expect(isValidMove('')).toBe(false);
      expect(isValidMove('invalid')).toBe(false);
    });
  });

  describe('doesMoveWin', () => {
    it('should return true for winning combinations', () => {
      expect(doesMoveWin('rock', 'beer')).toBe(true);
      expect(doesMoveWin('beer', 'paper')).toBe(true);
      expect(doesMoveWin('paper', 'rock')).toBe(true);
    });

    it('should return false for losing combinations', () => {
      expect(doesMoveWin('beer', 'rock')).toBe(false);
      expect(doesMoveWin('paper', 'beer')).toBe(false);
      expect(doesMoveWin('rock', 'paper')).toBe(false);
    });

    it('should return false for tie', () => {
      expect(doesMoveWin('rock', 'rock')).toBe(false);
      expect(doesMoveWin('paper', 'paper')).toBe(false);
      expect(doesMoveWin('beer', 'beer')).toBe(false);
    });
  });
});