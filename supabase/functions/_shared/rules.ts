/**
 * Slotword duel rules — shared by the submit_guess Edge Function.
 *
 * calculateLetterStates is an EXACT port of the one in src/types.ts (the
 * proven solo-mode implementation, originally shared with server.ts).
 * scripts/test-duel-rules.mts guards against drift between the two copies.
 */

export type LetterState = 'correct' | 'present' | 'absent';

export function calculateLetterStates(
  guess: string,
  answer: string
): LetterState[] {
  const length = answer.length;
  const states: LetterState[] = Array(length).fill('absent');
  const answerLetterCount: Record<string, number> = {};

  for (let i = 0; i < length; i++) {
    const char = answer[i];
    if (guess[i] === char) {
      states[i] = 'correct';
    } else {
      answerLetterCount[char] = (answerLetterCount[char] || 0) + 1;
    }
  }

  for (let i = 0; i < length; i++) {
    if (states[i] !== 'correct') {
      const char = guess[i];
      if (answerLetterCount[char] && answerLetterCount[char] > 0) {
        states[i] = 'present';
        answerLetterCount[char]--;
      }
    }
  }

  return states;
}
