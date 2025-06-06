

export interface Card {
  id: string;
  iconName: string; // Store icon name as string instead of component
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
  isComputer?: boolean;
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
  { name: "Apple", iconName: "Apple" },
  { name: "Car", iconName: "Car" },
  { name: "Book", iconName: "Book" },
  { name: "Phone", iconName: "Smartphone" },
  { name: "Cat", iconName: "Cat" },
  { name: "Tree", iconName: "TreePine" },
  { name: "House", iconName: "Home" },
  { name: "Guitar", iconName: "Guitar" },
  { name: "Pizza", iconName: "Pizza" },
  { name: "Camera", iconName: "Camera" },
  { name: "Flower", iconName: "Flower" },
  { name: "Clock", iconName: "Clock" },
  { name: "Laptop", iconName: "Laptop" },
  { name: "Coffee", iconName: "Coffee" },
  { name: "Bicycle", iconName: "Bike" },
  { name: "Sunglasses", iconName: "Glasses" },
  { name: "Shoes", iconName: "Footprints" },
  { name: "Watch", iconName: "Watch" },
  { name: "Balloon", iconName: "Heart" },
  { name: "Umbrella", iconName: "Umbrella" },
  { name: "Candle", iconName: "Flame" },
  { name: "Butterfly", iconName: "Bug" },
  { name: "Keyboard", iconName: "Keyboard" },
  { name: "Glasses", iconName: "GlassesIcon" },
  { name: "Hat", iconName: "HardHat" },
  { name: "Basketball", iconName: "CircleDot" },
  { name: "Pen", iconName: "Pen" },
  { name: "Dice", iconName: "Dice1" },
  { name: "Headphones", iconName: "Headphones" },
  { name: "Backpack", iconName: "Backpack" },
];

// Icon mapping for client-side resolution
export const ICON_MAP = {
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
  Footprints: Shoes,
  Watch,
  Heart: Balloon,
  Umbrella,
  Flame: Candle,
  Bug: Butterfly,
  Keyboard,
  GlassesIcon: Glasses2,
  HardHat: Hat,
  CircleDot: Basketball,
  Pen,
  Dice1: Dice,
  Headphones,
  Backpack,
};
