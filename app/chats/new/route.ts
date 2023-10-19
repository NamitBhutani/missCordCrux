import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/codelib/database.types";
const { v4: uuidv4 } = require('uuid');


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
  const { data: channelsAndWith } = await supabase
    .from("chats")
    .select('channels,with')
    .eq("id", id?.id || "")
    .single();


  const newChannel = uuidv4();
  console.log(JSON.stringify(channelsAndWith));
  const email = formData.get("email")
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("email")
    .eq("email", email as string);
  if (profilesError) {
    return NextResponse.json({ error: profilesError });
  }
  if (channelsAndWith && profilesData && profilesData.length > 0) {
    const withArray = channelsAndWith.with || [];
    const channelsArray = channelsAndWith.channels || [];

    const updatedWithArray = [...withArray, email as string];
    const updatedChannelsArray = [...channelsArray, newChannel];

    const { error } = await supabase
      .from("chats")
      .update({ id: id?.id, with: updatedWithArray, channels: updatedChannelsArray })
      .eq("id", id?.id || "");
    if (!error) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error });
    }
  }


}
