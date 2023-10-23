import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
import RealtimeGroupChats from "@/customComponents/RealtimeGroupChats";
type Chats = Database["public"]["Tables"]["group_chats"]["Row"]["chat"];

export default async function Chats({ params }: { params: { id: String } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: chatsLoadData } = await supabase
    .from("group_chats")
    .select("chat")
    .eq("channel", params.id)
    .single();

  const paramsForChild = {
    id: params.id,
    username: user?.user_metadata.name,
    initialChats: chatsLoadData?.chat as unknown as Chats,
  };
  return (
    <>
      <RealtimeGroupChats params={paramsForChild} />
    </>
  );
}
