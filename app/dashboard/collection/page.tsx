"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import CardCollection from "@/components/CardCollection";

export default function CollectionPage() {
  const [userId, setUserId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    const supabase=createClient();
    supabase.auth.getUser().then(({data}: { data: { user: { id: string } | null } })=>{
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });
  },[]);
  if (loading) return <DashboardShell><div className="p-8"><div className="shimmer h-[160px]" /></div></DashboardShell>;
  if (!userId) return <DashboardShell><div className="p-8 text-center text-[13px]" style={{color:"var(--text-muted)"}}>กรุณาเข้าสู่ระบบ</div></DashboardShell>;
  return (
    <DashboardShell>
      <div className="px-4 pt-6 pb-28 md:px-8 max-w-[880px] mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-[24px] font-extrabold" style={{color:"var(--text)"}}>คอลเลกชันไพ่ของคุณ</h1>
          <p className="text-[13px]" style={{color:"var(--text-secondary)"}}>78 ใบ · สะสมไพ่ที่เคยเปิด เจอไพ่เด่นและธาตุของตัวเอง</p>
        </div>
        <CardCollection userId={userId} />
      </div>
    </DashboardShell>
  );
}
