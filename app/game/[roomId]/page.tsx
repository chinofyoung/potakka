"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { GameRoom, Player, Card, ChatMessage, ICON_MAP } from "@/app/types/game";
import { useAuth } from "@/app/contexts/AuthContext";
import AuthGuard from "@/app/components/AuthGuard";
import {
  createGameRoom,
  joinGameRoom,
  startGame,
  setPlayerReady,
  passCard,
  callBluff,
  addChatMessage,
  subscribeToRoom,
  subscribeToChat,
  addComputerPlayer,
  processComputerTurns,
  processComputerReadiness,
} from "@/app/lib/firebase";

// Card component
function GameCard({
  card,
  isVisible,
  isSelectable,
  isSelected,
  onClick,
}: {
  card: Card;
  isVisible: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  // Resolve icon component from iconName
  const IconComponent = ICON_MAP[card.iconName as keyof typeof ICON_MAP];

  return (
    <div
      className={`relative transition-all duration-300 ${
        isSelected ? "ring-2 ring-cyan-400 scale-110" : ""
      } ${
        isSelectable
          ? "cursor-pointer hover:scale-105 hover:ring-2 hover:ring-yellow-400"
          : "cursor-default"
      }`}
      onClick={isSelectable ? onClick : undefined}
    >
      <div className="w-20 h-28 md:w-24 md:h-32 bg-white rounded-lg shadow-lg overflow-hidden">
        {isVisible ? (
          <>
            <div className="w-full h-20 md:h-24 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              {IconComponent && <IconComponent size={32} className="text-gray-700" />}
            </div>
            <div className="text-center p-1">
              <p className="text-xs font-bold text-gray-800 truncate">
                {card.name}
              </p>
              <div className="flex justify-center">
                <span className="text-lg">
                  {card.arrow === "left" ? "←" : "→"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex flex-col items-center justify-center">
            <div className="text-white text-2xl mb-1">🃏</div>
            <div className="text-white text-lg">
              {card.arrow === "left" ? "←" : "→"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Player position component
function PlayerPosition({
  player,
  isCurrentTurn,
  cards,
  room,
}: {
  player: Player;
  isCurrentTurn: boolean;
  cards: Card[];
  room: GameRoom;
}) {
  const canSeeCards = room.cardsVisible; // Only show cards when explicitly visible (memorization phase)

  return (
    <div
      className={`flex flex-col items-center space-y-3 p-3 rounded-xl border-2 min-w-[140px] ${
        isCurrentTurn
          ? "border-yellow-400 bg-yellow-400/10 shadow-lg"
          : "border-white/20 bg-white/5"
      }`}
    >
      {/* Player info */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <div
            className={`w-3 h-3 rounded-full ${
              player.isReady ? "bg-green-400" : "bg-gray-400"
            }`}
          ></div>
          <span
            className={`font-semibold text-sm ${
              isCurrentTurn ? "text-yellow-200" : "text-white"
            }`}
          >
            {player.name}
          </span>
          {player.isHost && <span className="text-yellow-400">👑</span>}
          {player.isComputer && <span className="text-blue-400">🤖</span>}
        </div>

        {/* Card count and turn indicator */}
        <div className="text-xs space-y-1">
          <div
            className={`${
              isCurrentTurn ? "text-yellow-300 font-bold" : "text-white/60"
            }`}
          >
            {cards.length} card{cards.length !== 1 ? "s" : ""}
            {isCurrentTurn && " • YOUR TURN"}
          </div>

          {/* Arrow summary */}
          {cards.length > 0 && (
            <div className="text-white/50 text-xs">
              {canSeeCards ? (
                <>
                  ←{cards.filter((c) => c.arrow === "left").length} •
                  {cards.filter((c) => c.arrow === "right").length}→
                </>
              ) : (
                "🔄 arrows hidden"
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player cards */}
      <div className="flex space-x-1">
        {cards.map((card) => {
          return (
            <div key={card.id} className="flex flex-col items-center">
              <GameCard
                card={card}
                isVisible={canSeeCards}
              />
              {/* Show arrow under each card when visible */}
              {canSeeCards && (
                <div className="text-xs mt-1 text-white/70">
                  {card.arrow === "left" ? "←" : "→"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Score */}
      <div className="text-center">
        <div className="text-xs text-white/60">Score: {player.score}</div>
      </div>
    </div>
  );
}

function GamePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const roomId = params.roomId as string;
  const playerName = user?.gamerTag || searchParams.get("name") || "";
  const isHost = searchParams.get("host") === "true";

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [playerId] = useState(() =>
    Math.random().toString(36).substring(2, 15)
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [declaration, setDeclaration] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize room
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        const player: Player = {
          id: playerId,
          name: playerName,
          cards: [],
          isReady: false,
          score: 0,
          isHost: isHost,
        };

        let gameRoom: GameRoom | null = null;

        if (isHost) {
          gameRoom = await createGameRoom(roomId, player);
        } else {
          gameRoom = await joinGameRoom(roomId, player);
        }

        if (!gameRoom) {
          setError("Room not found");
          return;
        }

        setRoom(gameRoom);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    if (roomId && playerName) {
      initializeRoom();
    }
  }, [roomId, playerName, isHost, playerId]);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return;

    const unsubscribeRoom = subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);
    });

    const unsubscribeChat = subscribeToChat(roomId, (messages) => {
      setChatMessages(messages);
    });

    return () => {
      unsubscribeRoom();
      unsubscribeChat();
    };
  }, [roomId]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Process computer player actions when room state changes
  useEffect(() => {
    if (room) {
      if (room.gameState === "memorizing") {
        // Handle computer readiness during memorizing phase
        const timer = setTimeout(() => {
          processComputerReadiness(roomId).catch(console.error);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else if (room.gameState === "playing") {
        // Handle computer turns during playing phase
        const timer = setTimeout(() => {
          processComputerTurns(roomId).catch(console.error);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [room, roomId]);

  const currentPlayer = room?.players[playerId];
  const isMyTurn =
    currentPlayer?.cards.length === 2 && room?.gameState === "playing";
  const canCallBluff = (() => {
    if (room?.gameState !== "playing") {
      return false;
    }

    // Get the last declaration to see who made it
    const lastDeclaration = chatMessages
      .filter((msg) => msg.type === "declaration")
      .pop();

    if (!lastDeclaration) {
      return false;
    }

    // Only the player who just made the declaration cannot call bluff
    // All other players can call bluff (including the one who received the card)
    return lastDeclaration.playerId !== playerId;
  })();

  // Get all cards currently in play (for declaration dropdown)
  const getCardsInPlay = () => {
    if (!room) return [];

    const allCards: Card[] = [];
    Object.values(room.players).forEach((player) => {
      allCards.push(...player.cards);
    });

    // Get unique card names
    const uniqueCardNames = [...new Set(allCards.map((card) => card.name))];
    return uniqueCardNames.sort();
  };

  const cardsInPlay = getCardsInPlay();

  const handleStartGame = async () => {
    try {
      await startGame(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    }
  };

  const handleAddComputerPlayer = async () => {
    try {
      await addComputerPlayer(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add computer player");
    }
  };

  const handleReady = async () => {
    try {
      await setPlayerReady(roomId, playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set ready");
    }
  };

  const handlePassCard = async () => {
    if (!selectedCard || !declaration.trim()) {
      alert("Please select a card to pass and choose what you're declaring!");
      return;
    }

    // Find target player for confirmation
    const card = currentPlayer?.cards.find((c) => c.id === selectedCard);
    if (!card) return;

    const sortedPlayers = Object.values(room?.players || {}).sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );
    const currentIndex = sortedPlayers.findIndex((p) => p.id === playerId);
    let targetIndex;

    if (card.arrow === "right") {
      targetIndex = (currentIndex + 1) % sortedPlayers.length;
    } else {
      targetIndex =
        (currentIndex - 1 + sortedPlayers.length) % sortedPlayers.length;
    }

    const targetPlayer = sortedPlayers[targetIndex];

    const confirmed = confirm(
      `Are you sure you want to pass this card to ${targetPlayer?.name} and declare it as "${declaration}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await passCard(roomId, playerId, selectedCard, declaration);
      setSelectedCard(null);
      setDeclaration("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pass card");
    }
  };

  const handleCallBluff = async () => {
    const lastDeclaration = chatMessages
      .filter((msg) => msg.type === "declaration")
      .pop();
    if (lastDeclaration) {
      const targetPlayerId = lastDeclaration.playerId;
      const targetPlayer = room?.players[targetPlayerId];
      const declaredItem = lastDeclaration.message.split("a ")[1];

      const confirmed = confirm(
        `Are you sure you want to call bluff on ${targetPlayer?.name}?\n\nThey declared: "${declaredItem}"\n\nIf you're wrong, they get a point. If you're right, you get a point.`
      );

      if (!confirmed) return;

      try {
        // Find the target player and their last received card
        if (targetPlayer && targetPlayer.cards.length > 0) {
          const lastCardId =
            targetPlayer.cards[targetPlayer.cards.length - 1].id;
          await callBluff(roomId, playerId, targetPlayerId, lastCardId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to call bluff");
      }
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const message: ChatMessage = {
      id: Math.random().toString(36).substring(2, 15),
      playerId: playerId,
      playerName: playerName,
      message: chatInput,
      timestamp: Date.now(),
      type: "chat",
    };

    try {
      await addChatMessage(roomId, message);
      setChatInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Arrange players in a horizontal line for better arrow visibility
  const arrangePlayersInLine = () => {
    if (!room) return [];

    const players = Object.values(room.players).sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );

    return players.map((player, index) => {
      const hasCurrentTurn =
        player.cards.length === 2 && room.gameState === "playing";

      return {
        player,
        hasCurrentTurn,
        index,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const arrangedPlayers = arrangePlayersInLine();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                🃏 Room: {roomId}
              </h1>
              <p className="text-white/70">
                Round {room.currentRound + 1} • {room.gameState} •{" "}
                {room.cardsVisible ? "Cards Visible" : "Cards Hidden"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70">
                Players: {Object.keys(room.players).length}/{room.maxPlayers}
              </p>
              {room.gameState === "waiting" && currentPlayer?.isHost && (
                <div className="flex flex-col space-y-2 mt-2">
                  {Object.keys(room.players).length < room.maxPlayers && (
                    <button
                      onClick={handleAddComputerPlayer}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm"
                    >
                      🤖 Add Computer Player
                    </button>
                  )}
                  <button
                    onClick={handleStartGame}
                    disabled={Object.keys(room.players).length < room.minPlayers}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                  >
                    Start Game
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bluff Result Modal */}
        {room.bluffResult?.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="text-6xl mb-4">
                {room.bluffResult.isCorrectCall ? "🎉" : "😔"}
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {room.bluffResult.isCorrectCall
                  ? "Correct Call!"
                  : "Wrong Call!"}
              </h2>
              <p className="text-gray-700 mb-2">
                <strong>{room.bluffResult.callerName}</strong> called bluff on{" "}
                <strong>{room.bluffResult.targetName}</strong>
              </p>
              <p className="text-gray-700 mb-4">
                Declared: <strong>{room.bluffResult.declaredCard}</strong>
                <br />
                Actual: <strong>{room.bluffResult.actualCard}</strong>
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {room.bluffResult.message}
              </p>
              <button
                onClick={() => {
                  // This will be handled by automatic timeout or game state change
                }}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Game Area */}
          <div className="lg:col-span-3">
            {/* Game Status Bar */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/20">
              <div className="text-center text-white">
                <div className="text-2xl mb-2">🃏 Potakka.</div>
                <p className="text-sm opacity-70 mb-2">
                  Round {room.currentRound + 1}
                </p>

                {/* Game State Info */}
                <div className="space-y-1">
                  {room.gameState === "waiting" && (
                    <p className="text-yellow-300">Waiting for players...</p>
                  )}
                  {room.gameState === "memorizing" && (
                    <p className="text-cyan-300">
                      Memorize all cards! Then press Ready.
                    </p>
                  )}
                  {room.gameState === "playing" && (
                    <>
                      <p className="text-orange-300 font-bold">
                        {(() => {
                          const playerWithTwoCards = Object.values(
                            room.players
                          ).find((p) => p.cards.length === 2);
                          return playerWithTwoCards
                            ? `${playerWithTwoCards.name}'s turn (2 cards)`
                            : "Waiting for turn...";
                        })()}
                      </p>
                      <p className="text-white/60 text-sm">
                        Cards in play: {cardsInPlay.join(", ")}
                      </p>
                      <p className="text-yellow-300 text-xs">
                        All cards are face down - use your memory!
                      </p>
                      {(() => {
                        const lastDeclaration = chatMessages
                          .filter((msg) => msg.type === "declaration")
                          .pop();
                        if (lastDeclaration) {
                          return (
                            <p className="text-red-300 text-xs mt-1 animate-pulse">
                              {lastDeclaration.playerName} just declared -
                              Others can call bluff!
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Players in Horizontal Line */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4 text-center">
                Players & Cards Flow
              </h3>
              <div className="flex justify-center items-center space-x-8 overflow-x-auto pb-4">
                {arrangedPlayers.map(({ player, hasCurrentTurn, index }) => (
                  <div key={player.id} className="flex items-center">
                    {/* Player */}
                    <div className="flex-shrink-0">
                      <PlayerPosition
                        player={player}
                        isCurrentTurn={hasCurrentTurn}
                        cards={player.cards}
                        room={room}
                      />
                    </div>

                    {/* Flow indicator to next player */}
                    {index < arrangedPlayers.length - 1 && (
                      <div className="mx-3 flex flex-col items-center justify-center">
                        <div className="text-white/40 text-xs mb-1">flow</div>
                        <div className="text-xl text-gray-400">→</div>
                        <div className="text-white/40 text-xs mt-1">next</div>
                      </div>
                    )}

                    {/* Show wrap-around indicator for last player */}
                    {index === arrangedPlayers.length - 1 &&
                      arrangedPlayers.length > 1 && (
                        <div className="mx-3 flex flex-col items-center justify-center">
                          <div className="text-white/40 text-xs mb-1">wrap</div>
                          <div className="text-xl text-gray-400">↶</div>
                          <div className="text-white/40 text-xs mt-1">
                            around
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* Your Hand */}
            {currentPlayer && currentPlayer.cards.length > 0 && (
              <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-3">
                  Your Hand {!room.cardsVisible && "(Face Down - Use Memory!)"}
                  {isMyTurn && room.gameState === "playing" && (
                    <div className="text-sm text-yellow-300 mt-1">
                      👆 Select a card to pass and choose what to declare
                    </div>
                  )}
                  {/* Temporary status check */}
                  <div className="text-xs text-white/60 mt-1">
                    Status: {isMyTurn ? "MY TURN" : "NOT MY TURN"} | State:{" "}
                    {room.gameState} | My Cards:{" "}
                    {currentPlayer?.cards.length || 0} | Turn Logic:{" "}
                    {currentPlayer?.cards.length === 2
                      ? "2 CARDS = MY TURN"
                      : "1 CARD = WAIT"}
                  </div>
                </h3>
                <div className="flex justify-center space-x-4 mb-4">
                  {currentPlayer.cards.map((card) => {
                    return (
                      <div key={card.id} className="flex flex-col items-center">
                        <div
                          className={`relative transition-all duration-300 ${
                            selectedCard === card.id
                              ? "ring-4 ring-cyan-400 scale-110"
                              : ""
                          } ${
                            isMyTurn && room.gameState === "playing"
                              ? "cursor-pointer hover:scale-105 hover:ring-2 hover:ring-yellow-400"
                              : "cursor-not-allowed opacity-60"
                          }`}
                          onClick={() => {
                            if (isMyTurn && room.gameState === "playing") {
                              setSelectedCard(card.id);
                            }
                          }}
                        >
                          <GameCard
                            card={card}
                            isVisible={room.cardsVisible}
                            isSelectable={false} // Handle clicking at this level instead
                            isSelected={false}
                            onClick={undefined}
                          />
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          {room.gameState === "playing" ? (
                            isMyTurn ? (
                              selectedCard === card.id ? (
                                <span className="text-green-400 font-bold">
                                  ✅ WILL PASS{" "}
                                  {room.cardsVisible
                                    ? card.arrow === "left"
                                      ? "←"
                                      : "→"
                                    : "?"}
                                </span>
                              ) : (
                                <span className="text-yellow-400">
                                  👆 CLICK TO SELECT
                                </span>
                              )
                            ) : (
                              "⏳ NOT YOUR TURN"
                            )
                          ) : (
                            ""
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Game Actions */}
                <div className="flex justify-between items-start w-full px-4">
                  {/* Left side - Ready button or Pass controls */}
                  <div className="flex-1">
                    {room.gameState === "memorizing" &&
                      !currentPlayer.isReady && (
                        <div className="flex justify-center">
                          <button
                            onClick={handleReady}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
                          >
                            I&apos;m Ready! ✓
                          </button>
                        </div>
                      )}

                    {/* Pass controls - only show when it's player's turn */}
                    {isMyTurn && room.gameState === "playing" && (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="text-white text-sm text-center">
                          <div>
                            Selected: {selectedCard ? "YES" : "NO"} |
                            Declaration: {declaration || "NONE"}
                          </div>
                          {selectedCard &&
                            (() => {
                              const card = currentPlayer?.cards.find(
                                (c) => c.id === selectedCard
                              );
                              if (!card) return null;

                              // Find target player based on arrow direction
                              const sortedPlayers = Object.values(
                                room.players
                              ).sort(
                                (a, b) => (a.position || 0) - (b.position || 0)
                              );
                              const currentIndex = sortedPlayers.findIndex(
                                (p) => p.id === playerId
                              );
                              let targetIndex;

                              if (card.arrow === "right") {
                                targetIndex =
                                  (currentIndex + 1) % sortedPlayers.length;
                              } else {
                                targetIndex =
                                  (currentIndex - 1 + sortedPlayers.length) %
                                  sortedPlayers.length;
                              }

                              const targetPlayer = sortedPlayers[targetIndex];

                              return (
                                <div className="text-cyan-300 text-xs mt-1">
                                  Card will go{" "}
                                  {card.arrow === "left" ? "←" : "→"} to{" "}
                                  <strong>{targetPlayer.name}</strong>
                                </div>
                              );
                            })()}
                        </div>
                        <div className="flex items-center space-x-3">
                          <select
                            value={declaration}
                            onChange={(e) => setDeclaration(e.target.value)}
                            className="px-3 py-2 rounded border text-gray-800 min-w-[200px] bg-white"
                          >
                            <option value="">
                              Select what you&apos;re passing...
                            </option>
                            {cardsInPlay.map((cardName) => (
                              <option key={cardName} value={cardName}>
                                {cardName}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handlePassCard}
                            disabled={!selectedCard || !declaration.trim()}
                            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
                          >
                            {selectedCard && declaration.trim()
                              ? `Pass Card & Declare "${declaration}"`
                              : "Select Card & Declaration"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show waiting message when not player's turn */}
                    {!isMyTurn && room.gameState === "playing" && (
                      <div className="text-center text-gray-400 italic">
                        Waiting for your turn... You need 2 cards to play.
                      </div>
                    )}

                    {/* Status message when bluff can't be called */}
                    {room?.gameState === "playing" &&
                      !canCallBluff &&
                      chatMessages.some(
                        (msg) => msg.type === "declaration"
                      ) && (
                        <div className="text-center text-white/60 text-sm">
                          {(() => {
                            const lastDeclaration = chatMessages
                              .filter((msg) => msg.type === "declaration")
                              .pop();
                            if (lastDeclaration?.playerId === playerId) {
                              return "You can't call bluff on your own declaration";
                            }
                            return "Waiting for someone to call bluff...";
                          })()}
                        </div>
                      )}
                  </div>

                  {/* Right side - Call Bluff button */}
                  <div className="flex-shrink-0 ml-4">
                    {canCallBluff && (
                      <button
                        onClick={handleCallBluff}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors animate-pulse"
                      >
                        🚨 Call Bluff!
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 h-fit">
            <h3 className="text-lg font-bold text-white mb-3">Chat</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-2 rounded text-sm ${
                    message.type === "system"
                      ? "bg-blue-500/20 text-blue-200"
                      : message.type === "declaration"
                      ? "bg-orange-500/20 text-orange-200 font-semibold border border-orange-400"
                      : "bg-white/20 text-white"
                  }`}
                >
                  <span className="font-semibold">{message.playerName}: </span>
                  <span>{message.message}</span>
                  {message.type === "declaration" && (
                    <div className="text-orange-100 text-xs mt-1">
                      📢 Declaration - Others can call bluff!
                    </div>
                  )}
                </div>
              ))}
              {/* Invisible element to scroll to */}
              <div ref={chatMessagesEndRef} />
            </div>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded border text-gray-800 text-sm"
              />
              <button
                onClick={sendChatMessage}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-3 rounded text-sm"
              >
                Send
              </button>
            </div>

            {/* Scores Section */}
            <div className="border-t border-white/20 pt-4">
              <h4 className="text-md font-bold text-white mb-2">Scoreboard</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {Object.values(room.players)
                  .sort((a, b) => b.score - a.score)
                  .map((player) => (
                    <div
                      key={player.id}
                      className={`flex justify-between items-center p-2 rounded text-sm ${
                        player.id === playerId
                          ? "bg-cyan-500/20 text-cyan-200"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <span className="flex items-center">
                        {player.isHost && (
                          <span className="text-yellow-400 mr-1">👑</span>
                        )}
                        {player.isComputer && (
                          <span className="text-blue-400 mr-1">🤖</span>
                        )}
                        {player.name}
                        {player.id === playerId && (
                          <span className="ml-1 text-cyan-300">(You)</span>
                        )}
                      </span>
                      <span className="font-bold">{player.score}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <AuthGuard>
      <GamePageContent />
    </AuthGuard>
  );
}
