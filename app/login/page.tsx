"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LoginPage() {
  const { user, loading, loginWithGoogle, setGamerTag } = useAuth();
  const [gamerTagInput, setGamerTagInput] = useState("");
  const [isSettingGamerTag, setIsSettingGamerTag] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user && user.gamerTag) {
      // User is authenticated and has a gamer tag, redirect to home
      router.push("/");
    } else if (user && !user.gamerTag) {
      // User is authenticated but needs to set gamer tag
      setIsSettingGamerTag(true);
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await loginWithGoogle();
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  const handleGamerTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gamerTagInput.trim().length < 3) {
      setError("Gamer tag must be at least 3 characters long");
      return;
    }
    if (gamerTagInput.trim().length > 20) {
      setError("Gamer tag must be 20 characters or less");
      return;
    }

    setGamerTag(gamerTagInput.trim());
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20">
        {!isSettingGamerTag ? (
          // Login Form
          <div className="text-center">
            <div className="text-6xl mb-6">🃏</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bluff Card Game
            </h1>
            <p className="text-white/70 mb-8">
              Play the ultimate bluffing card game with friends!
            </p>

            {error && (
              <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-6 border border-red-500/50">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <p className="text-white/50 text-sm mt-6">
              No account needed - just sign in with Google to get started!
            </p>
          </div>
        ) : (
          // Gamer Tag Setup Form
          <div className="text-center">
            <div className="text-4xl mb-6">🎮</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Choose Your Gamer Tag
            </h2>
            <p className="text-white/70 mb-6">
              This is how other players will see you in the game
            </p>

            {error && (
              <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-6 border border-red-500/50">
                {error}
              </div>
            )}

            <form onSubmit={handleGamerTagSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={gamerTagInput}
                  onChange={(e) => setGamerTagInput(e.target.value)}
                  placeholder="Enter your gamer tag..."
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  autoFocus
                  maxLength={20}
                />
                <p className="text-white/50 text-sm mt-2">
                  3-20 characters, letters and numbers only
                </p>
              </div>

              <button
                type="submit"
                disabled={gamerTagInput.trim().length < 3}
                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Continue to Game
              </button>
            </form>

            {user && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-white/50 text-sm">
                  Signed in as {user.displayName || user.email}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
