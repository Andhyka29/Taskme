"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async () => {
    if (!name.trim() || !password.trim()) {
      alert("Silakan isi nama dan password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: isRegisterMode ? "register" : "login",
          name: name.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Terjadi kesalahan");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      router.replace("/dashboard");
    } catch (error) {
      console.error("Auth error:", error);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920')] bg-cover bg-center">
      <div className="absolute inset-0 bg-overlay" />
      <div className="relative glass p-10 rounded-3xl w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          {isRegisterMode ? "Daftar" : "Login"}
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 transition-all disabled:opacity-50"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 transition-all disabled:opacity-50"
          />
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary  py-3 rounded-xl text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Memuat..." : isRegisterMode ? "Daftar" : "Masuk"}
          </button>

          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            disabled={loading}
            className="w-full btn-secondary py-3 rounded-xl text-white font-semibold disabled:opacity-50"
          >
            {isRegisterMode ? "Sudah punya akun? Masuk" : "Daftar"}
          </button>
        </div>
      </div>
    </div>
  );
  }