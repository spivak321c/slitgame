import { Elysia, t } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { calculateLetterStates, WORDS_BANK_4, WORDS_BANK_5, WORDS_BANK_6 } from './src/types';

// State and types for real-time duels
interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
  guesses: string[]; // actual secret guesses (never leaked to opponent)
  colorsGrid: ('correct' | 'present' | 'absent')[][]; // color blocks sent to opponent
  status: 'playing' | 'won' | 'lost';
  finishedTime?: number; // ms since match start
  disconnectedAt?: number; // grace timer start
}

interface ActiveRoom {
  id: string;
  difficulty: 'easy' | 'classic' | 'hard';
  wordLength: number;
  attemptsLimit: number;
  secretWord: string;
  players: Record<string, RoomPlayer>;
  status: 'waiting' | 'active' | 'finished';
  winnerId: string | 'draw' | null;
  matchStartedAt?: number;
  createdAt: number;
}

// In-memory registry of active duel rooms
const activeRooms = new Map<string, ActiveRoom>();

// Helper: pick random word
function selectRandomWord(difficulty: 'easy' | 'classic' | 'hard'): string {
  if (difficulty === 'easy') {
    return WORDS_BANK_4[Math.floor(Math.random() * WORDS_BANK_4.length)];
  } else if (difficulty === 'hard') {
    return WORDS_BANK_6[Math.floor(Math.random() * WORDS_BANK_6.length)];
  }
  return WORDS_BANK_5[Math.floor(Math.random() * WORDS_BANK_5.length)];
}

// Helper: generate compact lobby representation for client dashboard
function getLobbyList() {
  const list = [];
  for (const room of activeRooms.values()) {
    if (room.status === 'waiting' || room.status === 'active') {
      const playersList = Object.values(room.players).map(p => ({
        username: p.username,
        avatar: p.avatar,
      }));
      list.push({
        id: room.id,
        difficulty: room.difficulty,
        status: room.status,
        players: playersList,
      });
    }
  }
  return list;
}

// Helper: broadcast lobby status to all players currently in the landing page / dashboard
const lobbySubscribers = new Set<any>();

function broadcastLobbyState() {
  const msg = JSON.stringify({
    type: 'LOBBY_STATE',
    rooms: getLobbyList(),
  });
  for (const ws of lobbySubscribers) {
    try {
      ws.send(msg);
    } catch {
      lobbySubscribers.delete(ws);
    }
  }
}

// Helper: Settle duel results
function settleDuel(room: ActiveRoom) {
  room.status = 'finished';
  const players = Object.values(room.players);
  if (players.length < 2) {
    // If only one player left, they win by default
    const survivor = players[0];
    if (survivor) {
      room.winnerId = survivor.id;
      survivor.status = 'won';
    } else {
      room.winnerId = 'draw';
    }
    return;
  }

  const [p1, p2] = players;

  // Determine winner based on rules:
  // 1. Success over Failure
  const p1Solved = p1.status === 'won';
  const p2Solved = p2.status === 'won';

  if (p1Solved && !p2Solved) {
    room.winnerId = p1.id;
  } else if (!p1Solved && p2Solved) {
    room.winnerId = p2.id;
  } else if (p1Solved && p2Solved) {
    // Both solved! Compare attempts first
    const p1Attempts = p1.guesses.length;
    const p2Attempts = p2.guesses.length;

    if (p1Attempts < p2Attempts) {
      room.winnerId = p1.id;
    } else if (p2Attempts < p1Attempts) {
      room.winnerId = p2.id;
    } else {
      // Tiebreaker: time taken (smaller is better)
      const p1Time = p1.finishedTime || Infinity;
      const p2Time = p2.finishedTime || Infinity;

      if (p1Time < p2Time) {
        room.winnerId = p1.id;
      } else if (p2Time < p1Time) {
        room.winnerId = p2.id;
      } else {
        room.winnerId = 'draw';
      }
    }
  } else {
    // Neither solved
    room.winnerId = 'draw';
  }
}

// Start Elysia
const port = process.env.PORT || 3001;
const app = new Elysia();

// In Production, serve the compiled React build (dist directory)
app.use(staticPlugin({
  assets: './dist',
  prefix: '/'
}));

// Fallback HTML router for SPA (client-side routing support)
app.get('/', () => Bun.file('./dist/index.html'));

// WebSocket endpoint for the Real-time Duel Arena
app.ws('/arena', {
  open(ws) {
    console.log(`[WS-OPEN] Socket established: ${ws.id}`);
    lobbySubscribers.add(ws);
    // Send immediate lobby list to newly opened connection
    ws.send(JSON.stringify({
      type: 'LOBBY_STATE',
      rooms: getLobbyList(),
    }));
  },

  message(ws, rawMsg: any) {
    let msg: { type: string; payload?: any };
    try {
      msg = typeof rawMsg === 'string' ? JSON.parse(rawMsg) : rawMsg;
    } catch {
      console.error('[WS-ERROR] Failed to parse JSON message');
      return;
    }

    const { type, payload } = msg;

    switch (type) {
      case 'SUBSCRIBE_LOBBY': {
        lobbySubscribers.add(ws);
        ws.send(JSON.stringify({
          type: 'LOBBY_STATE',
          rooms: getLobbyList(),
        }));
        break;
      }

      case 'CREATE_ROOM': {
        const { difficulty, username, avatar } = payload || {};
        const id = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        let wordLength = 5;
        let attemptsLimit = 6;
        if (difficulty === 'easy') {
          wordLength = 4;
          attemptsLimit = 5;
        } else if (difficulty === 'hard') {
          wordLength = 6;
          attemptsLimit = 7;
        }

        const secretWord = selectRandomWord(difficulty);
        console.log(`[CREATE-ROOM] ID: ${id} | Difficulty: ${difficulty} | Secret: ${secretWord}`);

        const player: RoomPlayer = {
          id: ws.id,
          username: username || 'Anonymous',
          avatar: avatar || '🎮',
          guesses: [],
          colorsGrid: [],
          status: 'playing',
        };

        const room: ActiveRoom = {
          id,
          difficulty: difficulty || 'classic',
          wordLength,
          attemptsLimit,
          secretWord,
          players: { [ws.id]: player },
          status: 'waiting',
          winnerId: null,
          createdAt: Date.now(),
        };

        activeRooms.set(id, room);
        
        // Associate ws with room
        ws.subscribe(`room-${id}`);
        
        // Notify client
        ws.send(JSON.stringify({
          type: 'ROOM_CREATED',
          roomId: id,
          room: {
            id,
            difficulty: room.difficulty,
            wordLength,
            attemptsLimit,
            players: Object.values(room.players).map(p => ({ id: p.id, username: p.username, avatar: p.avatar, status: p.status, colorsGrid: p.colorsGrid })),
            status: room.status,
          }
        }));

        broadcastLobbyState();
        break;
      }

      case 'JOIN_ROOM': {
        const { roomId, username, avatar } = payload || {};
        const room = activeRooms.get(roomId);

        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found.' }));
          return;
        }

        if (room.status !== 'waiting' || Object.keys(room.players).length >= 2) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full or already active.' }));
          return;
        }

        // Add second player
        const player: RoomPlayer = {
          id: ws.id,
          username: username || 'Anonymous',
          avatar: avatar || '🎮',
          guesses: [],
          colorsGrid: [],
          status: 'playing',
        };

        room.players[ws.id] = player;
        room.status = 'active';
        room.matchStartedAt = Date.now();

        ws.subscribe(`room-${roomId}`);

        console.log(`[JOIN-ROOM] Player ${username} joined ${roomId}. Match active!`);

        // Send full sync states to BOTH players
        const syncMessage = JSON.stringify({
          type: 'ROOM_STATE',
          room: {
            id: room.id,
            difficulty: room.difficulty,
            wordLength: room.wordLength,
            attemptsLimit: room.attemptsLimit,
            status: room.status,
            matchStartedAt: room.matchStartedAt,
            players: Object.values(room.players).map(p => ({
              id: p.id,
              username: p.username,
              avatar: p.avatar,
              status: p.status,
              colorsGrid: p.colorsGrid,
              remainingAttempts: room.attemptsLimit - p.guesses.length,
            })),
          }
        });

        app.server?.publish(`room-${roomId}`, syncMessage);
        broadcastLobbyState();
        break;
      }

      case 'SUBMIT_GUESS': {
        const { roomId, guess } = payload || {};
        const room = activeRooms.get(roomId);

        if (!room || room.status !== 'active') {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Active match not found.' }));
          return;
        }

        const player = room.players[ws.id];
        if (!player || player.status !== 'playing') {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'You are not active in this match.' }));
          return;
        }

        const sanitizedGuess = guess.toUpperCase();
        if (sanitizedGuess.length !== room.wordLength) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid word length.' }));
          return;
        }

        // Apply server-authoritative guess verification
        const colors = calculateLetterStates(sanitizedGuess, room.secretWord);
        player.guesses.push(sanitizedGuess);
        player.colorsGrid.push(colors);

        const isSolved = sanitizedGuess === room.secretWord;
        const attemptsUsed = player.guesses.length;
        const isOutOfAttempts = attemptsUsed >= room.attemptsLimit;

        if (isSolved) {
          player.status = 'won';
          player.finishedTime = Date.now() - (room.matchStartedAt || Date.now());
        } else if (isOutOfAttempts) {
          player.status = 'lost';
          player.finishedTime = Date.now() - (room.matchStartedAt || Date.now());
        }

        // 1. Reply to guesser with secret visual evaluation info
        ws.send(JSON.stringify({
          type: 'GUESS_RESULT',
          colors,
          isSolved,
          remainingAttempts: room.attemptsLimit - attemptsUsed,
        }));

        // Check if both players have finished
        const allFinished = Object.values(room.players).every(p => p.status !== 'playing');

        if (allFinished) {
          settleDuel(room);
        }

        // 2. Broadcast updated ROOM_STATE with sync boards to both clients
        const syncMessage = JSON.stringify({
          type: 'ROOM_STATE',
          room: {
            id: room.id,
            difficulty: room.difficulty,
            wordLength: room.wordLength,
            attemptsLimit: room.attemptsLimit,
            status: room.status,
            winnerId: room.winnerId,
            matchStartedAt: room.matchStartedAt,
            players: Object.values(room.players).map(p => ({
              id: p.id,
              username: p.username,
              avatar: p.avatar,
              status: p.status,
              colorsGrid: p.colorsGrid,
              remainingAttempts: room.attemptsLimit - p.guesses.length,
              finishedTime: p.finishedTime,
            })),
          }
        });

        app.server?.publish(`room-${roomId}`, syncMessage);
        
        if (room.status === 'finished') {
          // Send final match over event
          const matchOverMessage = JSON.stringify({
            type: 'MATCH_OVER',
            roomId: room.id,
            winnerId: room.winnerId,
            secretWord: room.secretWord,
          });
          app.server?.publish(`room-${roomId}`, matchOverMessage);
          
          // Cleanup finished room after 10 seconds
          setTimeout(() => {
            activeRooms.delete(roomId);
            broadcastLobbyState();
          }, 10000);
        }
        break;
      }

      case 'LEAVE_ROOM': {
        const { roomId } = payload || {};
        const room = activeRooms.get(roomId);

        if (room) {
          console.log(`[LEAVE-ROOM] Player left room: ${roomId}`);
          ws.unsubscribe(`room-${roomId}`);
          
          const player = room.players[ws.id];
          if (player) {
            delete room.players[ws.id];
          }

          const playersCount = Object.keys(room.players).length;

          if (playersCount === 0) {
            activeRooms.delete(roomId);
          } else if (room.status === 'active') {
            // Player left active match -> Other player wins by forfeit
            settleDuel(room);
            const syncMessage = JSON.stringify({
              type: 'ROOM_STATE',
              room: {
                id: room.id,
                difficulty: room.difficulty,
                wordLength: room.wordLength,
                attemptsLimit: room.attemptsLimit,
                status: room.status,
                winnerId: room.winnerId,
                matchStartedAt: room.matchStartedAt,
                players: Object.values(room.players).map(p => ({
                  id: p.id,
                  username: p.username,
                  avatar: p.avatar,
                  status: p.status,
                  colorsGrid: p.colorsGrid,
                  remainingAttempts: room.attemptsLimit - p.guesses.length,
                })),
              }
            });
            app.server?.publish(`room-${roomId}`, syncMessage);
            app.server?.publish(`room-${roomId}`, JSON.stringify({
              type: 'MATCH_OVER',
              roomId: room.id,
              winnerId: room.winnerId,
              secretWord: room.secretWord,
              message: 'Opponent disconnected / left the match.',
            }));

            setTimeout(() => {
              activeRooms.delete(roomId);
              broadcastLobbyState();
            }, 5000);
          }

          broadcastLobbyState();
        }
        break;
      }
    }
  },

  close(ws) {
    console.log(`[WS-CLOSE] Socket disconnected: ${ws.id}`);
    lobbySubscribers.delete(ws);

    // Search active matches to clean up or trigger disconnect loss
    for (const [roomId, room] of activeRooms.entries()) {
      if (room.players[ws.id]) {
        console.log(`[WS-DISCONNECT] Cleanup socket player from active room: ${roomId}`);
        ws.unsubscribe(`room-${roomId}`);

        if (room.status === 'waiting') {
          // If still waiting, remove the player/room immediately
          delete room.players[ws.id];
          if (Object.keys(room.players).length === 0) {
            activeRooms.delete(roomId);
          }
          broadcastLobbyState();
        } else if (room.status === 'active') {
          // Active match -> Convert disconnect into forfeit / forfeit-loss
          const disconnectedPlayer = room.players[ws.id];
          disconnectedPlayer.status = 'lost';
          
          // Trigger disconnect grace settle
          settleDuel(room);
          
          const syncMessage = JSON.stringify({
            type: 'ROOM_STATE',
            room: {
              id: room.id,
              difficulty: room.difficulty,
              wordLength: room.wordLength,
              attemptsLimit: room.attemptsLimit,
              status: room.status,
              winnerId: room.winnerId,
              matchStartedAt: room.matchStartedAt,
              players: Object.values(room.players).map(p => ({
                id: p.id,
                username: p.username,
                avatar: p.avatar,
                status: p.status,
                colorsGrid: p.colorsGrid,
                remainingAttempts: room.attemptsLimit - p.guesses.length,
              })),
            }
          });
          app.server?.publish(`room-${roomId}`, syncMessage);
          app.server?.publish(`room-${roomId}`, JSON.stringify({
            type: 'MATCH_OVER',
            roomId: room.id,
            winnerId: room.winnerId,
            secretWord: room.secretWord,
            message: 'Opponent disconnected from server.',
          }));

          // Cleanup shortly after
          setTimeout(() => {
            activeRooms.delete(roomId);
            broadcastLobbyState();
          }, 5000);
        }
      }
    }
  }
});

// Start Elysia listen
app.listen(port);
console.log(`[SERVER-START] Slotword Elysia server running on http://localhost:${port}`);
