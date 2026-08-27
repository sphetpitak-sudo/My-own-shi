"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Mail, Lock, Save, Loader2, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AccountSettingsProps {
  userId: string;
}

export default function AccountSettings({ userId }: AccountSettingsProps) {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? "");
        const meta = user.user_metadata;
        if (meta?.avatar_url) setAvatarUrl(meta.avatar_url);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", userId)
        .single();

      if (profile) {
        setDisplayName(profile.display_name ?? "");
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      }
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: displayName, avatar_url: avatarUrl })
      .eq("id", userId);

    await supabase.auth.updateUser({
      data: { display_name: displayName, avatar_url: avatarUrl },
    });

    if (profileError) {
      setMessage({ type: "error", text: "ไม่สามารถบันทึกได้" });
    } else {
      setMessage({ type: "success", text: "บันทึกสำเร็จ" });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "รหัสผ่านไม่ตรงกัน" });
      return;
    }

    setChangingPassword(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "เปลี่ยนรหัสผ่านสำเร็จ" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-[100px] w-full rounded-2xl" />
        <div className="shimmer h-[180px] w-full rounded-2xl" />
        <div className="shimmer h-[180px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Message Toast */}
      {message && (
        <div
          className="flex items-center gap-2 p-3.5 rounded-xl text-[13px] font-medium animate-in"
          style={{
            background: message.type === "success" ? "var(--green-soft)" : "var(--red-soft)",
            color: message.type === "success" ? "var(--green)" : "var(--red)",
            border: `1px solid ${message.type === "success" ? "rgba(45, 122, 79, 0.1)" : "rgba(194, 65, 48, 0.1)"}`,
          }}
        >
          {message.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <div className="card p-6">
        <div className="sec-title mb-5">ข้อมูลโปรไฟล์</div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--primary), #a78bfa)",
              boxShadow: "0 4px 16px rgba(109, 40, 217, 0.2)",
            }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={64} height={64} unoptimized className="w-full h-full object-cover" />
            ) : (
              <User size={26} className="text-white" />
            )}
          </div>
          <div>
            <div className="text-[14px] font-semibold" style={{ color: "var(--text-secondary)" }}>
              รูปโปรไฟล์
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              ดึงรูปจากบัญชี Google ของคุณ
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="field mb-5">
          <label className="label">ชื่อที่แสดง</label>
          <input
            type="text"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ใส่ชื่อของคุณ"
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="btn btn-primary w-full"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {/* Account Section */}
      <div className="card p-6">
        <div className="sec-title mb-5">บัญชี</div>

        {/* Email */}
        <div className="field mb-5">
          <label className="label">อีเมล</label>
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-[13px]"
            style={{ background: "var(--bg)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <Mail size={14} style={{ color: "var(--text-muted)" }} />
            {email}
          </div>
        </div>

        {/* Change Password */}
        <div className="sec-title text-[14px] mb-4">เปลี่ยนรหัสผ่าน</div>

        <div className="field mb-3">
          <label className="label">รหัสผ่านใหม่</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="password"
              className="input"
              style={{ paddingLeft: "38px" }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="ใส่รหัสผ่านใหม่"
            />
          </div>
        </div>

        <div className="field mb-5">
          <label className="label">ยืนยันรหัสผ่านใหม่</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="password"
              className="input"
              style={{ paddingLeft: "38px" }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="ใส่รหัสผ่านใหม่อีกครั้ง"
            />
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={changingPassword || !newPassword}
          className="btn btn-ghost w-full"
        >
          {changingPassword ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          {changingPassword ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
        </button>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="btn btn-ghost w-full"
        style={{ color: "var(--red)", borderColor: "var(--red-soft)" }}
      >
        <LogOut size={15} />
        ออกจากระบบ
      </button>
    </div>
  );
}
