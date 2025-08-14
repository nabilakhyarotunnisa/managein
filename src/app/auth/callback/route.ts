import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const { event, session } = await request.json();
  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookie = request.cookies.get(name);
          return cookie ? cookie.value : undefined;
        },
        set: (name: string, value: string, options?: any) => {
          res.cookies.set(name, value, options);
        },
        remove: (name: string, options?: any) => {
          res.cookies.set(name, "", options);
        },
      },
    }
  );

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    await supabase.auth.setSession({
      access_token: session?.access_token ?? "",
      refresh_token: session?.refresh_token ?? "",
    });
  }
  if (event === "SIGNED_OUT") await supabase.auth.signOut();

  return res;
}
