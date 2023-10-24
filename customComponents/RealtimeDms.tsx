"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
import { v5 as uuidv5 } from "uuid";
import { badgeVariants } from "@/components/ui/badge";
import redis from "@/lib/redis";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserSelector from "./UserSelector";

type RearrangedItem = {
  id: string;
};
export default function RealtimeDms({
  props,
}: {
  props: {
    email: string;
    initialDms: RearrangedItem[];
    children: React.ReactNode;
  };
}) {
  const supabase = createClientComponentClient<Database>();
  const addNewDM = async () => {
    await fetch("/add/dm", {
      method: "post",
      body: JSON.stringify({ newMembersID: newMembersID, email: props.email }),
    });
  };

  const [dms, setDms] = useState<RearrangedItem[]>(props.initialDms);
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
        { event: "INSERT", schema: "public", table: "dm_members" },
        (payload) => {
          setDms((dms) => {
            if (payload.new) {
              // return [...dms, payload.new.id];
              if (payload.new.member === props.email) {
                // If the "member" column matches the user's email, add the ID to the state.
                return [...dms, { id: payload.new.id }];
              }
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
    <div>
      {/* Sidebar for DMs */}
      <div>
        <h1>DMS</h1>
        <div>
          {dms &&
            dms.map((dm) => (
              <div key={dm.id}>
                <Link href={`/dms/chat/${dm.id}`} className={badgeVariants()}>
                  DM name goes here
                </Link>
              </div>
            ))}
        </div>

        {isUserSelectorOpen && (
          <UserSelector onSelectionChange={handleSelectionChange} />
        )}
      </div>

      {/* Main content area for chat messages */}
      <div>{props.children}</div>

      {/* Buttons on the right */}
      <div>
        <Button
          onClick={() => setIsUserSelectorOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4"
        >
          Select Members for DM
        </Button>
        <Button
          onClick={addNewDM}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Start a New DM
        </Button>
      </div>
    </div>
  );
}
