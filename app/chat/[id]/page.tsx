"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];
type Message = {
  from: string;
  chat: string;
  time: Date;
};
export default function Chats({ params }: { params: { id: String } }) {
  const sendNewChat = async () => {
    const updatedChats = [
      ...(chat as unknown as Message[]),
      { from: userName, chat: newChat, time: Date.now() },
    ];

    const { error } = await supabase
      .from("chats")
      .update({ chat: updatedChats as Chats })
      .eq("channel", params.id);
  };
  const supabase = createClientComponentClient<Database>();
  const [userName, setUserName] = useState<string>("");
  const [newChat, setnewChat] = useState<string>("");
  const [chat, setChat] = useState<Chats | null>(null);
  useEffect(() => {
    const loadCurrentChats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserName(user?.user_metadata.name || "");
      console.log(JSON.stringify(user));
      const { data: chatsLoadData } = await supabase
        .from("chats")
        .select("chat")
        .eq("channel", params.id)
        .single();

      setChat(chatsLoadData?.chat || null);
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
          setChat((chats) => {
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
  }, [supabase, setChat]);
  return (
    <div>
      Chats:
      {JSON.stringify(chat)}
      <input
        type="text"
        value={newChat}
        onChange={(e) => setnewChat(e.target.value)}
      />
      <button onClick={sendNewChat}>Send New Chat</button>
    </div>
  );
}
