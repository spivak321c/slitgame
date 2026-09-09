import { Opponent } from '../types';

export interface DuelRoom {
  id: string;
  host: Opponent;
  handle: string;
  stake: number;
  minutes: number;
  slices: number;
  sliceTotal: number;
  isYours?: boolean;
  isFull?: boolean;
}

// No live duel rooms exist yet. The backend (planned) will populate this list.
// Until then the lobby shows an honest empty state and players can still challenge
// the built-in AI rivals from the constants below, which are game-design content.
export const OPEN_DUEL_ROOMS: DuelRoom[] = [];

export const addDuelRoom = (room: DuelRoom) => {
  OPEN_DUEL_ROOMS.unshift(room);
};

export const waitingRoomCount = () =>
  OPEN_DUEL_ROOMS.filter(r => !r.isFull).length;
