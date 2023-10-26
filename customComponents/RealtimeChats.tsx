"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import type { Database } from "@/codelib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const UserSelector = dynamic(() => import("@/customComponents/UserSelector"));
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];
import toast from "react-hot-toast";
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
    const res = await fetch("/add/chat", {
      method: "post",
      body: JSON.stringify({
        chat: chat,
        username: params.username,
        newChat: newChat,
        id: params.id,
      }),
    });
    const data = await res.json();
    if (data.status === 200) {
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }
    setnewChat("");
  };

  const kickMembers = async (member: string) => {
    const res = await fetch("/kick", {
      method: "post",
      body: JSON.stringify({
        member: member,
        isAdmin: params.isAdmin,
        id: params.id,
      }),
    });
    const data = await res.json();
    if (data.status === 200) {
      toast.success(data.message);
      window.location.reload();
    } else {
      toast.error(data.message);
    }

    // console.log(newMembersID);
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
  // const [members, setMembers] = useState<MembersLoadData>(
  //   params.initialMembers
  // );
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
  // useEffect(() => {
  //   const channel = supabase
  //     .channel("members")
  //     .on(
  //       "postgres_changes",
  //       { event: "DELETE", schema: "public", table: "dm_members" },
  //       (payload) => {
  //         setMembers((members) => {
  //           if (payload) {
  //             console.log(payload);
  //             //   return [...payload.new.chat];
  //             window.
  //           }
  //           return members;
  //         });
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [supabase, setChat]);
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
              <Button
                onClick={() => {
                  sendNewChat();
                }}
              >
                Send New Chat
              </Button>
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
                <div>
                  <Badge variant="secondary">{member.member}</Badge>
                  <Button
                    onClick={() => {
                      kickMembers(member.member);
                    }}
                  >
                    kik
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {params.isAdmin && (
            <div>
              <Button
                onClick={() => setIsUserSelectorOpen(!isUserSelectorOpen)}
              >
                Show invite link
              </Button>
              {isUserSelectorOpen && (
                <p>{`/dms/join/${params.id}`}</p>
                // <UserSelector onSelectionChange={handleSelectionChange} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
