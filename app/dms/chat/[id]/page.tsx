import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
import RealtimeChats from "@/customComponents/RealtimeChats";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];

export default async function Chats({ params }: { params: { id: String } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: chatsLoadData } = await supabase
    .from("chats")
    .select("chat")
    .eq("channel", params.id)
    .single();
  const { data: membersLoadData } = await supabase
    .from("dm_members")
    .select("member")
    .eq("id", params.id);
  const { data: adminLoadData } = await supabase
    .from("dms")
    .select("admin")
    .eq("id", params.id)
    .single();
  const paramsForChild = {
    id: params.id,
    username: user?.user_metadata.name,
    initialChats: chatsLoadData?.chat as unknown as Chats,
    initialMembers: membersLoadData,
    isAdmin: (adminLoadData && adminLoadData.admin === user?.email) as boolean,
  };
  return (
    <>
      <RealtimeChats params={paramsForChild} />
    </>
  );
}
