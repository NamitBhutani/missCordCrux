import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/codelib/database.types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: id } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user?.email || "")
    .single();

  const { error } = await supabase
    .from("chats")
    .insert({ id: id?.id, with: formData.get("with"), channel: "private" });

  if (!error) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error });
  }
}
