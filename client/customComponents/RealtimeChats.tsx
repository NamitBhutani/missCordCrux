"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/codelib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
//const UserSelector = dynamic(() => import("@/customComponents/UserSelector"));
import toast from "react-hot-toast";
const regex = /^https:\/\/mdfwcmjgyognahhbvewj\.supabase\.co.*\.png$/;
type Message = {
  from: string;
  chat: string;
};
type ChatLoadData = {
  chat: Message;
  timestamp: string;
  pkey: number;
};
type DateTimeFormatOptions = {};
type MembersLoadData = Array<{ member: string }> | null;

function formatTimestamp(isoTimestamp: string) {
  const date = new Date(isoTimestamp);
  const options: DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return date.toLocaleDateString("en-US", options);
}

export default function RealtimeChats({
  params,
}: {
  params: {
    id: String;
    username: string;
    initialChats: ChatLoadData[];
    initialMembers: MembersLoadData;
    isAdmin: boolean;
  };
}) {
  const supabase = createClientComponentClient<Database>();

  // const handleSelectionChange = (selectedUsers: string[]) => {
  //   setIsUserSelectorOpen(false);
  //   setNewMembersID(selectedUsers);
  // };
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

    const { data } = await supabase.storage
      .from("chat-uploads")
      .getPublicUrl(`${params.id}/${fileName}.png`);
    setnewChat(data?.publicUrl || "");
  };
  const [isUploadSelectorVisible, setIsUploadSelectorVisible] =
    useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [newChat, setnewChat] = useState<string>("");
  const [chat, setChat] = useState<ChatLoadData[] | null>(params.initialChats);
  const firstChatRef = useRef(null);
  // const [members, setMembers] = useState<MembersLoadData>(
  //   params.initialMembers
  // );
  //const [newMembersID, setNewMembersID] = useState<string[]>([]);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState<boolean>(false);
  useEffect(() => {
    const channel = supabase
      .channel("*")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `channel=eq.${params.id}`,
        },
        (payload) => {
          if (payload.new) {
            setChat((chat) => {
              return [
                ...(chat as ChatLoadData[]),
                {
                  chat: payload.new.chat,
                  timestamp: payload.new.timestamp,
                  pkey: payload.new.pkey,
                },
              ];
            });
          } else
            setChat((chat) => {
              return chat;
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, setChat]);

  //Lazy Loading Code
  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (chat && chat.length > 0) {
            const firstChat = chat[0];
            const firstTimestamp = firstChat.timestamp;

            fetchOlderChats(firstTimestamp);
          }
        }
      },
      { rootMargin: "20px" }
    );
    useEffect(() => {
      if (firstChatRef.current) {
        observer.observe(firstChatRef.current);
      }

      return () => {
        if (firstChatRef.current) {
          observer.unobserve(firstChatRef.current);
        }
      };
    }, [firstChatRef]);
  }
  const fetchOlderChats = async (timestamp: string) => {
    const { data, error } = await supabase
      .from("chats")
      .select("chat,timestamp")
      .lt("timestamp", timestamp)
      .order("timestamp", { ascending: true })
      .range(0, 10); // Load the next 10 older chats

    if (data) {
      setChat((chat) => {
        return [...(data as ChatLoadData[]), ...(chat as ChatLoadData[])];
      });
    }
  };
  return (
    <>
      <div
        className="flex flex-row justify-between "
        style={{ width: "100%", height: "86%" }}
      >
        <div
          className=" flex flex-col justify-between border"
          style={{ width: "80%" }}
        >
          <div className="">
            <h2>Chats:</h2>
            <div
              className=" flex flex-col justify-evenly "
              // style={{ height: "60vh" }}
            >
              {(chat as unknown as ChatLoadData[])?.map((message, index) => (
                <div
                  key={message.pkey}
                  ref={index === 0 ? firstChatRef : null}
                  className=""
                  // style={{
                  //   width: "100%",
                  //   overflow: "hidden",
                  // }}
                >
                  <p className="" style={{ overflowWrap: "anywhere" }}>
                    {regex.test(message.chat.chat) ? (
                      <Image
                        src={message.chat.chat}
                        width={500}
                        height={500}
                        alt="Picture of the author"
                      />
                    ) : (
                      message.chat.chat
                    )}
                  </p>
                  <p suppressHydrationWarning>
                    {message.chat.from === params.username
                      ? `From: You, Time: ${formatTimestamp(
                          message.timestamp
                        )} `
                      : `From: ${message.chat.from}, Time: ${formatTimestamp(
                          message.timestamp
                        )}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className=" flex flex-col justify-evenly items-center">
              <Input
                type="text"
                placeholder="Type a new chat"
                value={newChat}
                onChange={(e) => setnewChat(e.target.value)}
                className="mb-2"
              />

              <div className="py-2">
                <Button
                  onClick={() => {
                    sendNewChat();
                  }}
                >
                  Send
                </Button>
              </div>
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
                className="mb-2"
              >
                Upload
              </Button>
            </div>
          </div>
        </div>

        <div style={{ width: "20%" }}>
          <p>Members:</p>
          <div
            className="flex flex-col justify-between px-2"
            style={{ height: "96%", width: "100%" }}
          >
            <div>
              <ul>
                {params.initialMembers?.map((member, index) => (
                  <div key={index} className="flex flex-row justify-center">
                    <div className="pr-2">
                      <Badge variant="secondary">{member.member}</Badge>
                    </div>
                    {params.isAdmin && (
                      <Button
                        onClick={() => {
                          kickMembers(member.member);
                        }}
                      >
                        Kick
                      </Button>
                    )}
                  </div>
                ))}
              </ul>
            </div>
            {params.isAdmin && (
              <Button
                onClick={() => setIsUserSelectorOpen(!isUserSelectorOpen)}
                className="mr-2"
              >
                Invite
              </Button>
            )}

            {isUserSelectorOpen && <p>{`/dms/join/${params.id}`}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
