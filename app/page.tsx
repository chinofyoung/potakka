"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.gamerTag)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const createRoom = () => {
    if (!user?.gamerTag) {
      alert("Please set your gamer tag first");
      return;
    }
    // Generate a random room code
    const newRoomCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    router.push(
      `/game/${newRoomCode}?name=${encodeURIComponent(user.gamerTag)}&host=true`
    );
  };

  const joinRoom = () => {
    if (!user?.gamerTag) {
      alert("Please set your gamer tag first");
      return;
    }
    if (!roomCode.trim()) {
      alert("Please enter room code");
      return;
    }
    router.push(
      `/game/${roomCode.toUpperCase()}?name=${encodeURIComponent(
        user.gamerTag
      )}`
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !user.gamerTag) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">🃏 Bluff Card Game</h1>
          <button
            onClick={handleLogout}
            className="text-white/70 hover:text-white text-sm underline"
          >
            Logout
          </button>
        </div>

        <div className="mb-6 text-center">
          <p className="text-white/80">
            Welcome back,{" "}
            <span className="text-cyan-400 font-bold">{user.gamerTag}</span>!
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={createRoom}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🎮 Create New Room
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/70">OR</span>
            </div>
          </div>

          <div>
            <label className="block text-white mb-2 font-semibold">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
              maxLength={6}
            />
          </div>

          <button
            onClick={joinRoom}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🚪 Join Room
          </button>
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-white font-semibold mb-3">How to Play:</h3>
          <div className="text-white/80 text-sm space-y-1">
            <p>• 3-10 players per room</p>
            <p>• Memorize your card, then pass cards</p>
            <p>• Declare what you&apos;re passing (truth or bluff!)</p>
            <p>• Call out bluffs to win points</p>
          </div>
        </div>
      </div>
    </div>
  );
}
