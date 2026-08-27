"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import AccountSettings from "@/components/AccountSettings";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <div className="p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="shimmer h-[120px] w-full rounded-2xl" />
            <div className="shimmer h-[200px] w-full rounded-2xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!userId) {
    return (
      <DashboardShell>
        <div className="p-4 md:p-8">
          <div className="empty">
            <div className="empty-title">กรุณาเข้าสู่ระบบ</div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="page-header">
            <h1 className="page-title">ตั้งค่าบัญชี</h1>
            <p className="page-sub">จัดการข้อมูลส่วนตัวและความปลอดภัย</p>
          </div>
          <AccountSettings userId={userId} />
        </div>
      </div>
    </DashboardShell>
  );
}
