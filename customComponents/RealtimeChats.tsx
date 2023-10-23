"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
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
    const updatedChats = [
      ...(chat as unknown as Message[]),
      { from: params.username, chat: newChat, time: Date.now() },
    ];

    const { error } = await supabase
      .from("chats")
      .update({ chat: updatedChats as Chats })
      .eq("channel", params.id);
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
      <div className="flex">
        <div className="w-2/3 pr-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Chats:</h2>
            <div>
              {(chat as unknown as Message[])?.map((message, index) => (
                <div key={index} className="mb-2">
                  <p className="text-white">{message?.chat}</p>
                  <p className="text-white" suppressHydrationWarning>
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
          <div className="p-4 border rounded shadow-md mt-4">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Type a new chat"
                value={newChat}
                onChange={(e) => setnewChat(e.target.value)}
                className="mr-2 px-4 py-2 rounded border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={sendNewChat}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Send New Chat
              </button>
              {isUploadSelectorVisible && (
                <Input
                  type="file"
                  id="image"
                  name="image"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              )}
              <button
                onClick={() => {
                  setIsUploadSelectorVisible(!isUploadSelectorVisible),
                    uploadNewFile();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
        <div className="w-1/3">
          <h2 className="text-2xl font-semibold mb-4">Members:</h2>
          <ul>
            {params.initialMembers?.map((member, index) => (
              <li key={index} className="text-white">
                {member.member}
              </li>
            ))}
          </ul>
          {params.isAdmin && (
            <div>
              {isUserSelectorOpen && (
                <UserSelector onSelectionChange={handleSelectionChange} />
              )}
              <button
                onClick={() => setIsUserSelectorOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Select New Members
              </button>
              <button
                onClick={addNewMembers}
                className="bg-blue-500 hover-bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
