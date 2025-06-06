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

import {
  Apple,
  Car,
  Book,
  Smartphone,
  Cat,
  TreePine,
  Home,
  Guitar,
  Pizza,
  Camera,
  Flower,
  Clock,
  Laptop,
  Coffee,
  Bike,
  Glasses,
  Footprints as Shoes,
  Watch,
  Heart as Balloon,
  Umbrella,
  Flame as Candle,
  Bug as Butterfly,
  Keyboard,
  GlassesIcon as Glasses2,
  HardHat as Hat,
  CircleDot as Basketball,
  Pen,
  Dice1 as Dice,
  Headphones,
  Backpack,
} from "lucide-react";

export const CARD_ITEMS = [
  { name: "Apple", icon: Apple },
  { name: "Car", icon: Car },
  { name: "Book", icon: Book },
  { name: "Phone", icon: Smartphone },
  { name: "Cat", icon: Cat },
  { name: "Tree", icon: TreePine },
  { name: "House", icon: Home },
  { name: "Guitar", icon: Guitar },
  { name: "Pizza", icon: Pizza },
  { name: "Camera", icon: Camera },
  { name: "Flower", icon: Flower },
  { name: "Clock", icon: Clock },
  { name: "Laptop", icon: Laptop },
  { name: "Coffee", icon: Coffee },
  { name: "Bicycle", icon: Bike },
  { name: "Sunglasses", icon: Glasses },
  { name: "Shoes", icon: Shoes },
  { name: "Watch", icon: Watch },
  { name: "Balloon", icon: Balloon },
  { name: "Umbrella", icon: Umbrella },
  { name: "Candle", icon: Candle },
  { name: "Butterfly", icon: Butterfly },
  { name: "Keyboard", icon: Keyboard },
  { name: "Glasses", icon: Glasses2 },
  { name: "Hat", icon: Hat },
  { name: "Basketball", icon: Basketball },
  { name: "Pen", icon: Pen },
  { name: "Dice", icon: Dice },
  { name: "Headphones", icon: Headphones },
  { name: "Backpack", icon: Backpack },
];
