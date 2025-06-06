import { LucideIcon } from "lucide-react";

export interface Card {
  id: string;
  icon: LucideIcon;
  name: string;
  arrow: "left" | "right";
  isVisible?: boolean;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isReady: boolean;
  score: number;
  isHost: boolean;
  position?: number;
}

export interface GameRoom {
  id: string;
  players: { [playerId: string]: Player };
  gameState: "waiting" | "memorizing" | "playing" | "round_end" | "game_over";
  currentTurn: string | null;
  currentRound: number;
  maxPlayers: number;
  minPlayers: number;
  createdAt: number;
  cardsVisible: boolean;
  bluffResult?: {
    show: boolean;
    message: string;
    isCorrectCall: boolean;
    callerName: string;
    targetName: string;
    actualCard: string;
    declaredCard: string;
  };
}

export interface GameAction {
  type: "pass_card" | "call_bluff" | "declare_item" | "ready";
  playerId: string;
  data?: unknown;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: "chat" | "system" | "declaration";
}

export const CARD_ITEMS = [
  {
    name: "Apple",
    image:
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop",
  },
  {
    name: "Car",
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop",
  },
  {
    name: "Book",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
  },
  {
    name: "Phone",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
  },
  {
    name: "Cat",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
  },
  {
    name: "Tree",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  },
  {
    name: "House",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
  },
  {
    name: "Guitar",
    image:
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop",
  },
  {
    name: "Pizza",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
  },
  {
    name: "Camera",
    image:
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop",
  },
  {
    name: "Flower",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop",
  },
  {
    name: "Clock",
    image:
      "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop",
  },
  {
    name: "Laptop",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
  },
  {
    name: "Coffee",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
  },
  {
    name: "Bicycle",
    image:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
  },
  {
    name: "Sunglasses",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop",
  },
  {
    name: "Shoes",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",
  },
  {
    name: "Watch",
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop",
  },
  {
    name: "Balloon",
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop",
  },
  {
    name: "Umbrella",
    image:
      "https://images.unsplash.com/photo-1495314736024-fa5e4b37b979?w=400&h=300&fit=crop",
  },
  {
    name: "Candle",
    image:
      "https://images.unsplash.com/photo-1495375961506-9f04b2a9e5e8?w=400&h=300&fit=crop",
  },
  {
    name: "Butterfly",
    image:
      "https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=400&h=300&fit=crop",
  },
  {
    name: "Keyboard",
    image:
      "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop",
  },
  {
    name: "Glasses",
    image:
      "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?w=400&h=300&fit=crop",
  },
  {
    name: "Hat",
    image:
      "https://images.unsplash.com/photo-1520629120409-debd7e4092bb?w=400&h=300&fit=crop",
  },
  {
    name: "Basketball",
    image:
      "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&h=300&fit=crop",
  },
  {
    name: "Pen",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop",
  },
  {
    name: "Dice",
    image:
      "https://images.unsplash.com/photo-1520990269980-0ad8bb5d9d97?w=400&h=300&fit=crop",
  },
  {
    name: "Headphones",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
  },
  {
    name: "Backpack",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
  },
];
