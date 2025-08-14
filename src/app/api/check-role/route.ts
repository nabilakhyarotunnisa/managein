import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // user aktif
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) return NextResponse.json({ ok:false, error:userErr.message }, { status:500 });
  if (!user)   return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  // role + employee_id
  const [{ data: profRows, error: profErr }, { data: empRows, error: empErr }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).limit(1),
    supabase.from("employees").select("id").eq("user_id", user.id).order("created_at",{ascending:false}).limit(1),
  ]);

  if (profErr) return NextResponse.json({ ok:false, error: profErr.message }, { status:500 });
  if (empErr)  return NextResponse.json({ ok:false, error: empErr.message }, { status:500 });

  const role = profRows?.[0]?.role ?? "employee";
  const employeeId = empRows?.[0]?.id ?? null;

  const isAdmin   = role === "admin";
  const isManager = role === "manager";
  const isApprover = isAdmin || isManager;

  return NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
    role,
    isAdmin,
    isManager,
    isApprover,
    employeeId,
  });
}
