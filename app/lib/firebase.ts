// Real Firebase implementation
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { getDatabase, ref, push, onValue, off } from "firebase/database";
import {
  GameRoom,
  Player,
  Card,
  ChatMessage,
  CARD_ITEMS,
} from "@/app/types/game";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Generate a random card
export const generateRandomCard = (): Card => {
  const item = CARD_ITEMS[Math.floor(Math.random() * CARD_ITEMS.length)];
  return {
    id: Math.random().toString(36).substring(2, 15),
    name: item.name,
    icon: item.icon,
    arrow: Math.random() > 0.5 ? "left" : "right",
  };
};

// Generate unique cards for a round (no duplicates)
export const generateUniqueCards = (count: number): Card[] => {
  if (count > CARD_ITEMS.length) {
    throw new Error(
      `Cannot generate ${count} unique cards. Only ${CARD_ITEMS.length} card types available.`
    );
  }

  const shuffledItems = [...CARD_ITEMS].sort(() => Math.random() - 0.5);
  return shuffledItems.slice(0, count).map((item) => ({
    id: Math.random().toString(36).substring(2, 15),
    name: item.name,
    icon: item.icon,
    arrow: Math.random() > 0.5 ? "left" : "right",
  }));
};

// Create a new game room
export const createGameRoom = async (
  roomId: string,
  hostPlayer: Player
): Promise<GameRoom> => {
  // Assign position to host player
  hostPlayer.position = 0;

  const room: GameRoom = {
    id: roomId,
    players: { [hostPlayer.id]: hostPlayer },
    gameState: "waiting",
    currentTurn: null,
    currentRound: 0,
    maxPlayers: 10,
    minPlayers: 3,
    createdAt: Date.now(),
    cardsVisible: true,
  };

  // Save to Firestore
  await setDoc(doc(db, "gameRooms", roomId), room);

  // Add system message to Realtime Database
  const chatRef = ref(rtdb, `chat/${roomId}`);
  await push(chatRef, {
    id: Math.random().toString(36).substring(2, 15),
    playerId: "system",
    playerName: "System",
    message: `${hostPlayer.name} created the room`,
    timestamp: Date.now(),
    type: "system",
  });

  return room;
};

// Join a game room
export const joinGameRoom = async (
  roomId: string,
  player: Player
): Promise<GameRoom> => {
  const roomRef = doc(db, "gameRooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found");
  }

  const room = roomSnap.data() as GameRoom;

  if (Object.keys(room.players).length >= room.maxPlayers) {
    throw new Error("Room is full");
  }

  // Assign position to new player
  const existingPositions = Object.values(room.players).map(
    (p) => p.position || 0
  );
  const nextPosition = Math.max(...existingPositions) + 1;
  player.position = nextPosition;

  // Add player to room
  room.players[player.id] = player;
  await updateDoc(roomRef, { players: room.players });

  // Add system message
  const chatRef = ref(rtdb, `chat/${roomId}`);
  await push(chatRef, {
    id: Math.random().toString(36).substring(2, 15),
    playerId: "system",
    playerName: "System",
    message: `${player.name} joined the room`,
    timestamp: Date.now(),
    type: "system",
  });

  return room;
};

// Get game room
export const getGameRoom = async (roomId: string): Promise<GameRoom | null> => {
  const roomSnap = await getDoc(doc(db, "gameRooms", roomId));
  return roomSnap.exists() ? (roomSnap.data() as GameRoom) : null;
};

// Start game
export const startGame = async (roomId: string): Promise<GameRoom> => {
  const roomRef = doc(db, "gameRooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found");
  }

  const room = roomSnap.data() as GameRoom;
  const playerCount = Object.keys(room.players).length;

  if (playerCount < room.minPlayers) {
    throw new Error(`Need at least ${room.minPlayers} players to start`);
  }

  // Generate unique cards for all players (no duplicates in a round)
  const playerIds = Object.keys(room.players);
  const firstPlayerId = playerIds[0];
  const numPlayers = playerIds.length;

  // Calculate total cards needed: each player gets 1, first player gets 1 extra
  const totalCardsNeeded = numPlayers + 1;
  const uniqueCards = generateUniqueCards(totalCardsNeeded);

  let cardIndex = 0;
  Object.values(room.players).forEach((player) => {
    player.cards = [uniqueCards[cardIndex++]];
    player.isReady = false;
  });

  // Give the first player an additional card right away (visible during memorization)
  room.players[firstPlayerId].cards.push(uniqueCards[cardIndex]);
  room.currentTurn = firstPlayerId;

  room.gameState = "memorizing";
  room.cardsVisible = true; // Cards are visible during memorization

  await updateDoc(roomRef, {
    players: room.players,
    gameState: room.gameState,
    cardsVisible: room.cardsVisible,
  });

  // Add system message
  const chatRef = ref(rtdb, `chat/${roomId}`);
  await push(chatRef, {
    id: Math.random().toString(36).substring(2, 15),
    playerId: "system",
    playerName: "System",
    message: "Game started! Memorize your cards and click Ready when done.",
    timestamp: Date.now(),
    type: "system",
  });

  return room;
};

// Player ready
export const setPlayerReady = async (
  roomId: string,
  playerId: string
): Promise<GameRoom> => {
  const roomRef = doc(db, "gameRooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found");
  }

  const room = roomSnap.data() as GameRoom;

  if (room.players[playerId]) {
    room.players[playerId].isReady = true;
  }

  // Check if all players are ready
  const allReady = Object.values(room.players).every(
    (player) => player.isReady
  );

  if (allReady && room.gameState === "memorizing") {
    // Start the actual game
    room.gameState = "playing";
    room.cardsVisible = false; // Hide ALL cards (including own cards)

    // First player already has 2 cards from startGame, so no need to add another
    await updateDoc(roomRef, {
      players: room.players,
      gameState: room.gameState,
      currentTurn: room.currentTurn,
      cardsVisible: room.cardsVisible,
    });

    // Add system message
    const chatRef = ref(rtdb, `chat/${roomId}`);
    await push(chatRef, {
      id: Math.random().toString(36).substring(2, 15),
      playerId: "system",
      playerName: "System",
      message: `${
        room.players[room.currentTurn!]?.name || "Unknown Player"
      }&apos;s turn! Choose a card to pass.`,
      timestamp: Date.now(),
      type: "system",
    });
  } else {
    await updateDoc(roomRef, { players: room.players });
  }

  return room;
};

// Pass a card
export const passCard = async (
  roomId: string,
  playerId: string,
  cardId: string,
  declaredItem: string
): Promise<GameRoom> => {
  const roomRef = doc(db, "gameRooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found");
  }

  const room = roomSnap.data() as GameRoom;
  const player = room.players[playerId];

  if (!player || player.cards.length !== 2) {
    throw new Error("Not your turn - you must have 2 cards to pass");
  }

  const cardIndex = player.cards.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) {
    throw new Error("Card not found");
  }

  const card = player.cards[cardIndex];
  player.cards.splice(cardIndex, 1);

  // Find next player based on arrow direction
  // Sort players by position to maintain consistent order
  const sortedPlayers = Object.values(room.players).sort(
    (a, b) => (a.position || 0) - (b.position || 0)
  );
  const sortedPlayerIds = sortedPlayers.map((p) => p.id);
  const currentIndex = sortedPlayerIds.indexOf(playerId);
  let nextIndex: number;

  if (card.arrow === "right") {
    // Right arrow: pass to next player in position order
    nextIndex = (currentIndex + 1) % sortedPlayerIds.length;
  } else {
    // Left arrow: pass to previous player in position order (with wrap-around)
    nextIndex =
      (currentIndex - 1 + sortedPlayerIds.length) % sortedPlayerIds.length;
  }

  const nextPlayerId = sortedPlayerIds[nextIndex];
  const nextPlayer = room.players[nextPlayerId];

  // Give card to next player (always goes to left position - pass position)
  nextPlayer.cards.unshift(card); // Add to beginning (left position)

  // No need to set currentTurn - the next player automatically becomes active when they have 2 cards

  // Give next player a new card if they don't have 2 cards (goes to right position - keep position)
  // During the game, players should already have their cards, this is just for safety
  if (nextPlayer.cards.length < 2) {
    // Generate a new unique card that's not already in play
    const existingCardNames = new Set();
    Object.values(room.players).forEach((p) => {
      p.cards.forEach((c) => existingCardNames.add(c.name));
    });

    const availableItems = CARD_ITEMS.filter(
      (item) => !existingCardNames.has(item.name)
    );
    if (availableItems.length > 0) {
      const randomItem =
        availableItems[Math.floor(Math.random() * availableItems.length)];
      nextPlayer.cards.push({
        id: Math.random().toString(36).substring(2, 15),
        name: randomItem.name,
        icon: randomItem.icon,
        arrow: Math.random() > 0.5 ? "left" : "right",
      });
    }
  }

  await updateDoc(roomRef, {
    players: room.players,
  });

  // Add declaration message
  const chatRef = ref(rtdb, `chat/${roomId}`);
  await push(chatRef, {
    id: Math.random().toString(36).substring(2, 15),
    playerId: playerId,
    playerName: player.name,
    message: `I'm passing a ${declaredItem}`,
    timestamp: Date.now(),
    type: "declaration",
  });

  return room;
};

// Call bluff
export const callBluff = async (
  roomId: string,
  callerId: string,
  targetPlayerId: string,
  lastCardId: string
): Promise<GameRoom> => {
  const roomRef = doc(db, "gameRooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found");
  }

  const room = roomSnap.data() as GameRoom;

  // Get the last declaration from chat
  return new Promise((resolve) => {
    const chatRef = ref(rtdb, `chat/${roomId}`);
    onValue(
      chatRef,
      async (snapshot) => {
        const chatData = snapshot.val();
        const messages = chatData
          ? (Object.values(chatData) as ChatMessage[])
          : [];
        const lastDeclaration = messages
          .filter((msg) => msg.type === "declaration")
          .pop();

        if (!lastDeclaration) {
          throw new Error("No declaration found");
        }

        // Find the card that was passed
        const targetPlayer = room.players[targetPlayerId];
        const declaredItem = lastDeclaration.message.split("a ")[1];
        const passedCard = targetPlayer.cards.find(
          (card) => card.id === lastCardId
        );

        if (!passedCard) {
          throw new Error("Card not found");
        }

        const isBluff =
          passedCard.name.toLowerCase() !== declaredItem.toLowerCase();

        let winner: string;
        let message: string;

        if (isBluff) {
          // Bluff was correctly called
          winner = callerId;
          room.players[callerId].score += 1;
          message = `${room.players[callerId].name} correctly called bluff and wins the round!`;
        } else {
          // Bluff call was wrong
          winner = targetPlayerId;
          room.players[targetPlayerId].score += 1;
          message = `${room.players[callerId].name} was wrong! ${room.players[targetPlayerId].name} wins the round!`;
        }

        // Set bluff result for in-game announcement
        room.bluffResult = {
          show: true,
          message: message,
          isCorrectCall: isBluff,
          callerName: room.players[callerId]?.name || "Unknown Player",
          targetName: room.players[targetPlayerId]?.name || "Unknown Player",
          actualCard: passedCard.name,
          declaredCard: declaredItem,
        };

        // Update room with bluff result first
        await updateDoc(roomRef, {
          players: room.players,
          bluffResult: room.bluffResult,
        });

        // Add system message
        await push(chatRef, {
          id: Math.random().toString(36).substring(2, 15),
          playerId: "system",
          playerName: "System",
          message: message,
          timestamp: Date.now(),
          type: "system",
        });

        // Auto-hide bluff result and reset round after 5 seconds
        setTimeout(async () => {
          // Reset for next round with unique cards
          const playerIds = Object.keys(room.players);
          const numPlayers = playerIds.length;
          const totalCardsNeeded = numPlayers + 1;
          const uniqueCards = generateUniqueCards(totalCardsNeeded);

          let cardIndex = 0;
          Object.values(room.players).forEach((player) => {
            player.cards = [uniqueCards[cardIndex++]];
            player.isReady = false;
          });

          // Give the winner (who goes first) an additional card
          room.players[winner].cards.push(uniqueCards[cardIndex]);

          room.gameState = "memorizing";
          room.cardsVisible = true; // Show cards again for memorization
          room.currentTurn = winner; // Winner goes first next round
          room.currentRound += 1;
          room.bluffResult = {
            show: false,
            message: message,
            isCorrectCall: isBluff,
            callerName: room.players[callerId]?.name || "Unknown Player",
            targetName: room.players[targetPlayerId]?.name || "Unknown Player",
            actualCard: passedCard.name,
            declaredCard: declaredItem,
          };

          await updateDoc(roomRef, {
            players: room.players,
            gameState: room.gameState,
            currentTurn: room.currentTurn,
            currentRound: room.currentRound,
            cardsVisible: room.cardsVisible,
            bluffResult: room.bluffResult,
          });

          // Add new round message
          await push(chatRef, {
            id: Math.random().toString(36).substring(2, 15),
            playerId: "system",
            playerName: "System",
            message: `New round started! ${
              room.players[winner]?.name || "Unknown Player"
            } goes first.`,
            timestamp: Date.now(),
            type: "system",
          });
        }, 5000);

        resolve(room);
      },
      { onlyOnce: true }
    );
  });
};

// Chat functions
export const addChatMessage = async (
  roomId: string,
  message: ChatMessage
): Promise<void> => {
  const chatRef = ref(rtdb, `chat/${roomId}`);
  await push(chatRef, message);
};

export const getChatMessages = async (
  roomId: string
): Promise<ChatMessage[]> => {
  return new Promise((resolve) => {
    const chatRef = ref(rtdb, `chat/${roomId}`);
    onValue(
      chatRef,
      (snapshot) => {
        const data = snapshot.val();
        const messages = data ? (Object.values(data) as ChatMessage[]) : [];
        resolve(messages.sort((a, b) => a.timestamp - b.timestamp));
      },
      { onlyOnce: true }
    );
  });
};

// Real-time subscriptions
export const subscribeToRoom = (
  roomId: string,
  callback: (room: GameRoom) => void
): (() => void) => {
  const roomRef = doc(db, "gameRooms", roomId);

  const unsubscribe = onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as GameRoom);
    }
  });

  return unsubscribe;
};

export const subscribeToChat = (
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const chatRef = ref(rtdb, `chat/${roomId}`);

  const unsubscribe = onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    const messages = data ? (Object.values(data) as ChatMessage[]) : [];
    callback(messages.sort((a, b) => a.timestamp - b.timestamp));
  });

  return () => off(chatRef, "value", unsubscribe);
};
