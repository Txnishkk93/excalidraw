"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Plus, Search, MoreVertical, Layout, Settings } from "lucide-react";

interface Room {
  id: number;
  title: string | null;
  slug: string;
  backgroundColor: string | null;
  updatedAt: string;
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const fetchRooms = async () => {
      try {
        const data = await apiFetch("/api/v1/rooms");
        setRooms(data.rooms);
      } catch (err: any) {
        if (err.message === "Unauthorized") {
          localStorage.removeItem("token");
          router.push("/signin");
        } else {
          setError("Failed to load canvases.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [router]);

  const handleCreateCanvas = async () => {
    try {
      const title = `Untitled Canvas ${Math.floor(Math.random() * 1000)}`;
      const data = await apiFetch("/api/v1/room", {
        method: "POST",
        body: JSON.stringify({ name: title }),
      });
      router.push(`/canvas/${data.roomId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create canvas.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/signin");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-color)]">
      {/* Topbar */}
      <header className="flex h-16 items-center justify-between border-b border-[var(--border-color)] px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-nova-ink)] text-white font-bold tracking-tighter">
            N
          </div>
          <span className="font-semibold text-[var(--text-color)]">NOVA</span>
        </div>
        
        <div className="flex w-full max-w-md items-center gap-2 radius-pill border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-1.5 focus-within:border-[var(--color-nova-ink)] transition-colors">
          <Search size={16} className="text-[var(--muted-color)]" />
          <input 
            type="text" 
            placeholder="Search canvases..." 
            className="w-full bg-transparent text-sm outline-none placeholder-[var(--muted-color)]"
          />
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="text-sm font-medium text-[var(--muted-color)] hover:text-[var(--text-color)]">
            Sign out
          </button>
          <div className="h-8 w-8 radius-pill bg-[var(--color-nova-accent)] text-white flex items-center justify-center text-sm font-medium">
            U
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-12 max-w-7xl mx-auto w-full">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Good evening.</h1>
            <p className="text-[var(--muted-color)]">Here are your recent workspaces.</p>
          </div>
          <button 
            onClick={handleCreateCanvas}
            className="flex items-center gap-2 radius-pill bg-[var(--color-nova-ink)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus size={18} />
            New canvas
          </button>
        </div>

        {/* Canvases Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="radius-card border border-[var(--border-color)] p-4 animate-pulse">
                <div className="aspect-video w-full radius-container bg-[var(--bg-soft)] mb-4"></div>
                <div className="h-4 w-2/3 bg-[var(--bg-soft)] radius-pill mb-2"></div>
                <div className="h-3 w-1/3 bg-[var(--bg-soft)] radius-pill"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[var(--border-color)] radius-card">
            <Layout size={48} className="text-[var(--border-color)] mb-4" />
            <h3 className="text-lg font-medium mb-1">Your workspace is empty.</h3>
            <p className="text-sm text-[var(--muted-color)] mb-6">Create your first canvas and start thinking visually.</p>
            <button 
              onClick={handleCreateCanvas}
              className="radius-pill border border-[var(--border-color)] px-4 py-2 text-sm font-medium hover:bg-[var(--bg-soft)] transition-colors"
            >
              Create canvas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rooms.map((room) => (
              <div 
                key={room.id} 
                onClick={() => router.push(`/canvas/${room.id}`)}
                className="group cursor-pointer radius-card border border-[var(--border-color)] p-3 transition-all hover:border-[var(--color-nova-ink)] hover:shadow-sm bg-[var(--bg-color)]"
              >
                <div 
                  className="aspect-video w-full radius-container mb-4 border border-[var(--border-color)]"
                  style={{ backgroundColor: room.backgroundColor || "var(--bg-soft)" }}
                ></div>
                <div className="flex items-start justify-between px-1">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--text-color)] mb-1 truncate max-w-[200px]">
                      {room.title || room.slug}
                    </h3>
                    <p className="text-xs text-[var(--muted-color)]">
                      Edited {new Date(room.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-[var(--muted-color)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--text-color)]" onClick={(e) => { e.stopPropagation(); }}>
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
