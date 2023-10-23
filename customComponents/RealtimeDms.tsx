"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
import { v5 as uuidv5 } from "uuid";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserSelector from "./UserSelector";
type Dms = Database["public"]["Tables"]["dms"]["Row"]["id"];
type RearrangedItem = {
  id: string;
};
export default function RealtimeDms({
  props,
}: {
  props: {
    id: string;
    email: string;
    initialDms: RearrangedItem[];
    children: React.ReactNode;
  };
}) {
  const supabase = createClientComponentClient<Database>();
  function generateUUIDFromValues(values: string[]) {
    const uniqueString = values.join("");
    const namespace = "1b671a64-40d5-491e-99b0-da01ff1f3341";
    const generatedUUID = uuidv5(uniqueString, namespace);
    return generatedUUID;
  }
  const addNewDM = async () => {
    try {
      if (!newMembersID) {
        return;
      }
      const newDMId = generateUUIDFromValues(newMembersID);
      const { data: currentDMIds, error } = await supabase
        .from("dms")
        .select("id");
      if (error) {
        console.log(error);
      } else console.log(currentDMIds);

      if (currentDMIds?.some((item) => item.id === newDMId)) {
        console.log("DM already exists");
        return;
      } else {
        const { error: sw } = await supabase.from("dms").insert({
          id: newDMId,
          admin: props.email,
        });
        if (sw) {
          console.log(sw);
        }
        const { error: u } = await supabase.from("dm_members").insert({
          id: newDMId,
          member: props.email,
        });
        newMembersID.forEach(async (member) => {
          const { error: p } = await supabase.from("dm_members").insert({
            id: newDMId,
            member: member,
          });
        });
        const { error: chatInsertError } = await supabase.from("chats").insert({
          channel: newDMId,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [dms, setDms] = useState<RearrangedItem[] | null>(props.initialDms);
  const [newMembersID, setNewMembersID] = useState<string[]>([]);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState<boolean>(false);

  const handleSelectionChange = (selectedUsers: string[]) => {
    setIsUserSelectorOpen(false);
    setNewMembersID(selectedUsers);
  };

  useEffect(() => {
    const channel = supabase
      .channel("dms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dms" },
        (payload) => {
          setDms((dms) => {
            if (payload.new) {
              return payload.new.id;
            }
            return dms;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <>
      <div className="flex flex-row h-screen">
        {/* Sidebar for DMs */}
        <div className="w-1/4 p-4 border-r">
          <div className="mb-4">
            <h1 className="text-2xl mb-2">DMS</h1>
            {dms &&
              dms.map((dm) => (
                <div key={dm.id}>
                  <Link href={`/dms/chat/${dm.id}`}>Open DM</Link>
                </div>
              ))}
          </div>
          {isUserSelectorOpen && (
            <UserSelector onSelectionChange={handleSelectionChange} />
          )}
        </div>

        {/* Main content area for chat messages */}
        <div className="w-3/4 p-4">{props.children}</div>
      </div>

      <div className="flex items-center justify-between p-4">
        <Button
          onClick={() => setIsUserSelectorOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Select Members for the DM!
        </Button>
        <Button
          onClick={addNewDM}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Start a New DM!
        </Button>
      </div>
    </>
  );
}
