"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];
type Message = {
  from: string;
  chat: string;
  time: Date;
};
const formatDate = (timestamp: Date): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export default function RealtimeChats({
  params,
}: {
  params: { id: String; username: string; initialChats: Chats };
}) {
  const supabase = createClientComponentClient<Database>();
  const sendNewChat = async () => {
    const updatedChats = [
      ...(chat as unknown as Message[]),
      { from: params.username, chat: newChat, time: Date.now() },
    ];

    const { error } = await supabase
      .from("chats")
      .update({ chat: updatedChats as Chats })
      .eq("channel", params.id);
  };

  const [newChat, setnewChat] = useState<string>("");
  const [chat, setChat] = useState<Chats | null>(params.initialChats);

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
    <>
      <div className="p-4 border rounded shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Chats:</h2>
        <div>
          {(chat as unknown as Message[])?.map((message, index) => (
            <div key={index} className="mb-2">
              <p className="text-white">{message?.chat}</p>
              <p className="text-white" suppressHydrationWarning>
                {message.from === params.username
                  ? `From: You, Time: ${formatDate(message.time)} `
                  : `From: ${message.from}, Time: ${formatDate(message.time)}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border rounded shadow-md mt-4">
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Type a new chat"
            value={newChat}
            onChange={(e) => setnewChat(e.target.value)}
            className="mr-2 px-4 py-2 rounded border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
          />
          <Button
            onClick={sendNewChat}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send New Chat
          </Button>
        </div>
      </div>
    </>
  );
}
