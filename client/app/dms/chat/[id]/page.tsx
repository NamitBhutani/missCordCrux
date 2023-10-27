import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
import RealtimeChats from "@/customComponents/RealtimeChats";
import redis from "@/lib/redis";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];
type Message = {
  from: string;
  chat: string;
};
type ChatLoadData = {
  chat: Message;
  timestamp: string;
};
export default async function Chats({ params }: { params: { id: String } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const keyChats = `chats:${params.id}`;

  async function getChatsLoadData() {
    // Check if chats data is cached
    const cachedChats = await redis.lrange(keyChats, 0, -1);

    if (cachedChats.length > 0) {
      // Data found in cache, parse and return it
      const chats: ChatLoadData[] = cachedChats.map((chat) => JSON.parse(chat));
      return chats;
      // const chats = JSON.parse(cachedChats);
      // return chats;
    } else {
      // Data not found in cache, fetch it from the database
      const { data: chatsLoadData, error: chatsError } = await supabase
        .from("chats")
        .select("chat, timestamp")
        .eq("channel", params.id)
        .order("timestamp", { ascending: true })
        .range(0, 5);

      if (chatsLoadData) {
        // Store the fetched chats data in the cache for future use
        const chats = chatsLoadData.map((chat) => JSON.stringify(chat));

        if (chats && chats.length > 0) {
          // const chatStrings: string[] = chats.map((chat) =>
          //   JSON.stringify(chat)
          // );
          await redis.ltrim(keyChats, -1, -1);
          await redis.rpush(keyChats, ...chats);
          await redis.expire(keyChats, 60);
        }

        return chatsLoadData;
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
    initialChats: (await getChatsLoadData()) as unknown as ChatLoadData[],
    initialMembers: membersLoadData,
    isAdmin: (adminLoadData && adminLoadData.admin === user?.email) as boolean,
  };

  return (
    <>
      <RealtimeChats params={paramsForChild} />
    </>
  );
}
