"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import { User, Lock, Mail, Shield, Save, CheckCircle, AlertCircle, Hash, KeyRound, Trash2, AlertTriangle } from "lucide-react";

export default function Settings() {
  const { t, lang } = useLang();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [hasPassword, setHasPassword] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setUserId(user.id);
        setDisplayName(user.user_metadata?.display_name || "");
        const emailIdentity = user.identities?.find((i: { provider: string }) => i.provider === "email");
        setHasPassword(!!emailIdentity);
      }
    })();
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });
    if (error) setProfileMsg({ type: "error", text: error.message });
    else setProfileMsg({ type: "success", text: t.profile_updated });
    setProfileLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: "error", text: t.password_not_match });
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: t.password_min_6 });
      setPasswordLoading(false);
      return;
    }

    if (hasPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) {
        setPasswordMsg({ type: "error", text: t.wrong_password });
        setPasswordLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg({ type: "error", text: error.message });
    } else {
      setPasswordMsg({ type: "success", text: hasPassword ? t.password_changed : t.password_set });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setHasPassword(true);
    }
    setPasswordLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== email) return;
    setDeleteLoading(true);
    setDeleteMsg(null);
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deleteEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMsg({ type: "error", text: data.error || t.failed });
        setDeleteLoading(false);
        return;
      }
      setDeleteLoading(false);
      setDeleteMsg({ type: "success", text: t.account_deleted });
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch {
      setDeleteMsg({ type: "error", text: t.network_error });
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Profile Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[11px] flex items-center justify-center" style={{ background: "var(--bg)" }}>
            <User size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold">{t.profile}</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{t.manage_profile}</p>
          </div>
        </div>

        {profileMsg && (
          <div className="mb-4 p-3.5 rounded-xl flex items-center gap-2 text-[13px] font-medium"
            style={{ background: profileMsg.type === "success" ? "var(--green-soft)" : "var(--red-soft)", color: profileMsg.type === "success" ? "var(--green)" : "var(--red)" }}>
            {profileMsg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="field">
            <label className="label flex items-center gap-1.5"><Mail size={12} /> {t.email_label}</label>
            <input type="email" value={email} disabled className="input opacity-60 cursor-not-allowed" />
          </div>

          <div className="field">
            <label className="label flex items-center gap-1.5"><Hash size={12} /> {t.user_id}</label>
            <input type="text" value={userId} disabled className="input opacity-60 cursor-not-allowed font-mono text-[13px]" />
          </div>

          <div className="field">
            <label className="label flex items-center gap-1.5"><User size={12} /> {t.display_name}</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="input"               placeholder={t.display_name} />
          </div>

          <button type="submit" disabled={profileLoading} className="btn btn-primary w-full">
            <Save size={15} />
            {profileLoading ? t.loading : t.update_profile}
          </button>
        </form>
      </div>

      {/* Security Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[11px] flex items-center justify-center" style={{ background: "var(--amber-soft)" }}>
            <Shield size={18} style={{ color: "var(--amber)" }} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold">{hasPassword ? t.security : t.set_password}</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{hasPassword ? t.change_password_sub : t.set_password_sub}</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="mb-4 p-3.5 rounded-xl flex items-center gap-2 text-[13px] font-medium"
            style={{ background: passwordMsg.type === "success" ? "var(--green-soft)" : "var(--red-soft)", color: passwordMsg.type === "success" ? "var(--green)" : "var(--red)" }}>
            {passwordMsg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {hasPassword && (
            <div className="field">
              <label className="label flex items-center gap-1.5"><Lock size={12} /> {t.current_password}</label>
              <input type="password" required minLength={6} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="input" placeholder="••••••••" />
            </div>
          )}

          <div className="field">
            <label className="label flex items-center gap-1.5"><KeyRound size={12} /> {t.new_password}</label>
            <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="input" placeholder="••••••••" />
          </div>

          <div className="field">
            <label className="label flex items-center gap-1.5"><Lock size={12} /> {t.confirm_new_password}</label>
            <input type="password" required minLength={6} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="input" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={passwordLoading} className="btn btn-primary w-full">
            <Lock size={15} />
            {passwordLoading ? t.loading : hasPassword ? t.change_password : t.set_password}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border border-[var(--red)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[11px] flex items-center justify-center" style={{ background: "var(--red-soft)" }}>
            <AlertTriangle size={18} style={{ color: "var(--red)" }} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: "var(--red)" }}>{t.danger_zone}</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{t.danger_zone_sub}</p>
          </div>
        </div>

        {deleteMsg && (
          <div className="mb-4 p-3.5 rounded-xl flex items-center gap-2 text-[13px] font-medium"
            style={{ background: deleteMsg.type === "success" ? "var(--green-soft)" : "var(--red-soft)", color: deleteMsg.type === "success" ? "var(--green)" : "var(--red)" }}>
            {deleteMsg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {deleteMsg.text}
          </div>
        )}

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="btn w-full !border-red-500 !text-red-500 hover:!bg-[var(--red-soft)]">
            <Trash2 size={15} />
            {t.delete_account}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{t.confirm_delete_desc}</p>
            <div className="field">
              <label className="label">{t.type_email_confirm}</label>
              <input type="email" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)}
                className="input" placeholder={email} autoFocus />
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={deleteEmail !== email || deleteLoading}
                className="btn flex-1 !border-red-500 !text-red-500 hover:!bg-[var(--red-soft)] disabled:opacity-40">
                <Trash2 size={15} />
                {deleteLoading ? t.loading : t.confirm_delete}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteEmail(""); setDeleteMsg(null); }}
                className="btn btn-ghost flex-1">
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}