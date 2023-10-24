"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/codelib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserSelector from "./UserSelector";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];
type Message = {
  from: string;
  chat: string;
  time: Date;
};
type MembersLoadData = Array<{ member: string }> | null;

const formatDate = (timestamp: Date): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export default function RealtimeChats({
  params,
}: {
  params: {
    id: String;
    username: string;
    initialChats: Chats;
    initialMembers: MembersLoadData;
    isAdmin: boolean;
  };
}) {
  const supabase = createClientComponentClient<Database>();
  const handleSelectionChange = (selectedUsers: string[]) => {
    setIsUserSelectorOpen(false);
    setNewMembersID(selectedUsers);
  };
  const sendNewChat = async () => {
    await fetch("/add/chat", {
      method: "post",
      body: JSON.stringify({
        chat: chat,
        username: params.username,
        newChat: newChat,
        id: params.id,
      }),
    });
  };
  const addNewMembers = async () => {
    console.log(newMembersID);
  };
  const uploadNewFile = async () => {
    if (!image) {
      return;
    }
    const fileName = uuidv4();
    await supabase.storage
      .from("chat-uploads")
      .upload(`${params.id}/${fileName}.png`, image);

    const { data, error } = await supabase.storage
      .from("chat-uploads")
      .createSignedUrl(`${params.id}/${fileName}.png`, 60, { download: true });
    setnewChat(data?.signedUrl || "");
  };
  const [isUploadSelectorVisible, setIsUploadSelectorVisible] =
    useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [newChat, setnewChat] = useState<string>("");
  const [chat, setChat] = useState<Chats | null>(params.initialChats);
  const [newMembersID, setNewMembersID] = useState<string[]>([]);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState<boolean>(false);
  useEffect(() => {
    const channel = supabase
      .channel("*")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats" },
        (payload) => {
          setChat((chats) => {
            if (payload.new) {
              // console.log(payload.new.chat);
              return [...payload.new.chat];
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
      <div>
        <div>
          <div>
            <h2>Chats:</h2>
            <div>
              {(chat as unknown as Message[])?.map((message, index) => (
                <div key={index} className="mb-2">
                  <p>{message?.chat}</p>
                  <p suppressHydrationWarning>
                    {message.from === params.username
                      ? `From: You, Time: ${formatDate(message.time)} `
                      : `From: ${message.from}, Time: ${formatDate(
                          message.time
                        )}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div>
              <Input
                type="text"
                placeholder="Type a new chat"
                value={newChat}
                onChange={(e) => setnewChat(e.target.value)}
              />
              <Button onClick={sendNewChat}>Send New Chat</Button>
              {isUploadSelectorVisible && (
                <Input
                  type="file"
                  id="image"
                  name="image"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              )}
              <Button
                onClick={() => {
                  setIsUploadSelectorVisible(!isUploadSelectorVisible),
                    uploadNewFile();
                }}
              >
                Upload File
              </Button>
            </div>
          </div>
        </div>
        <div>
          <h2>Members:</h2>
          <ul>
            {params.initialMembers?.map((member, index) => (
              <li key={index}>
                <Badge variant="secondary">{member.member}</Badge>
              </li>
            ))}
          </ul>
          {params.isAdmin && (
            <div>
              {isUserSelectorOpen && (
                <UserSelector onSelectionChange={handleSelectionChange} />
              )}
              <Button onClick={() => setIsUserSelectorOpen(true)}>
                Select New Members
              </Button>
              <Button onClick={addNewMembers}>Add</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
