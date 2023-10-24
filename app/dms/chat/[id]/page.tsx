import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
import RealtimeChats from "@/customComponents/RealtimeChats";
import redis from "@/lib/redis";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];

export default async function Chats({ params }: { params: { id: String } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const keyChats = `chats:${params.id}`;
  // const keyMembers = `members:${params.id}`;
  // const keyAdmin = `admin:${params.id}`;

  async function getChatsLoadData() {
    // Check if chats data is cached
    const cachedChats = await redis.lrange(keyChats, 0, -1);

    if (cachedChats.length > 0) {
      // Data found in cache, parse and return it
      const chats = cachedChats.map((chat) => JSON.parse(chat));
      return chats;
    } else {
      // Data not found in cache, fetch it from the database
      const { data: chatsLoadData, error: chatsError } = await supabase
        .from("chats")
        .select("chat")
        .eq("channel", params.id)
        .single();

      if (chatsLoadData) {
        // Store the fetched chats data in the cache for future use
        const chats = chatsLoadData.chat;

        if (chats && chats.length > 0) {
          const chatStrings: string[] = chats.map((chat) =>
            JSON.stringify(chat)
          );
          await redis.rpush(keyChats, ...chatStrings);
          await redis.expire(keyChats, 60);
        }

        return chats;
      } else if (chatsError) {
        console.error(chatsError);
      }
    }
  }

  // Fetch membersLoadData and adminLoadData from the database
  const { data: membersLoadData, error: membersError } = await supabase
    .from("dm_members")
    .select("member")
    .eq("id", params.id);

  const { data: adminLoadData, error: adminError } = await supabase
    .from("dms")
    .select("admin")
    .eq("id", params.id)
    .single();

  const paramsForChild = {
    id: params.id,
    username: user?.user_metadata.name,
    initialChats: (await getChatsLoadData()) as unknown as Chats,
    initialMembers: membersLoadData,
    isAdmin: (adminLoadData && adminLoadData.admin === user?.email) as boolean,
  };

  return (
    <>
      <RealtimeChats params={paramsForChild} />
    </>
  );
}
