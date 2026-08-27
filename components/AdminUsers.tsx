"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Search, UserPlus, BookOpen, Calendar } from "lucide-react";
import AdminGrantPoints from "./AdminGrantPoints";
import LoadingSkeleton from "./LoadingSkeleton";

interface UserWithReadings extends Profile {
  reading_count: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithReadings[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithReadings | null>(null);

  const loadUsers = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) { window.location.href = "/dashboard"; return; }

    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: readings } = await supabase.from("readings").select("user_id");

    const readingCounts: Record<string, number> = {};
    readings?.forEach((r: { user_id: string }) => {
      readingCounts[r.user_id] = (readingCounts[r.user_id] || 0) + 1;
    });

    const enriched = (profiles || []).map((p: Profile & { id: string }) => ({
      ...p,
      reading_count: readingCounts[p.id] || 0,
    })) as UserWithReadings[];

    setUsers(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      u.display_name?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
    );
  }, [search, users]);

  if (loading) return <LoadingSkeleton variant="list" />;

  return (
    <div className="tab-content">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">ผู้ใช้</h1>
          <p className="page-sub">{users.length} ผู้ใช้ทั้งหมด</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="ค้นหาชื่อ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ paddingLeft: "38px" }}
        />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><UserPlus size={22} /></div>
            <div className="empty-title">ไม่พบผู้ใช้</div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="list-item w-full text-left"
              >
                <div className="item-icon" style={{ background: u.is_admin ? "var(--amber-soft)" : "var(--blue-soft)" }}>
                  <span className="text-[13px] font-bold" style={{ color: u.is_admin ? "var(--amber)" : "var(--blue)" }}>
                    {(u.display_name || "U")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold truncate">{u.display_name || "ไม่ระบุชื่อ"}</span>
                    {u.is_admin && <span className="badge badge-amber">แอดมิน</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-muted mt-0.5">
                    <span>{u.points} แต้ม</span>
                    <span className="flex items-center gap-1"><BookOpen size={10} />{u.reading_count} ครั้ง</span>
                    <span className="flex items-center gap-1"><Calendar size={10} />{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <AdminGrantPoints
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onGrant={() => { setSelectedUser(null); loadUsers(); }}
        />
      )}
    </div>
  );
}
