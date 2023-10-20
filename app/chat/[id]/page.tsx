"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];

export default function Chats({ params }: { params: { id: String } }) {
  const sendNewChat = async () => {};
  const supabase = createClientComponentClient<Database>();
  const [chats, setChats] = useState<Chats | null>(null);
  useEffect(() => {
    const loadCurrentChats = async () => {
      const { data: chatsLoadData } = await supabase
        .from("chats")
        .select("chat")
        .eq("channel", params.id)
        .single();

      setChats(chatsLoadData?.chat || null);
    };
    loadCurrentChats();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("*")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats" },
        (payload) => {
          setChats((chats) => {
            if (payload.new) {
              return payload.new.chat;
            }
            return chats;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, setChats]);
  return (
    <div>
      Chats:
      {JSON.stringify(chats)}
      <input type="text" />
      <button onClick={sendNewChat}>Send New Chat</button>
    </div>
  );
}
