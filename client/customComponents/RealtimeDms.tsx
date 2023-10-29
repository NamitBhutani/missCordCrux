"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Database } from "@/codelib/database.types";
import { badgeVariants } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
const UserSelector = dynamic(() => import("@/customComponents/UserSelector"));

import toast from "react-hot-toast";
type RearrangedItem = {
  id: string;
  name: string;
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
    const res = await fetch("/add/dm", {
      method: "post",
      body: JSON.stringify({
        newMembersID: newMembersID,
        email: props.email,
        currentDms: dms,
      }),
    });
    const data = await res.json();
    if (data.status === 200) {
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }
    setNewMembersID([]);
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
        {
          event: "INSERT",
          schema: "public",
          table: "dm_members",
          filter: `member=eq.${props.email}`,
        },
        (payload) => {
          setDms((dms) => {
            if (payload.new) {
              // return [...dms, payload.new.id];
              // If the "member" column matches the user's email, add the ID to the state.
              return [...dms, { id: payload.new.id, name: payload.new.name }];
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
    <div className=" flex flex-row justify-evenly" style={{ height: "86vh" }}>
      {/* Left Column for DMs */}
      <div className=" flex flex-col  justify-between">
        <div className="flex flex-col justify-around flex-nowrap">
          {dms &&
            dms.map((dm) => (
              <div key={dm.id} className="py-2 ">
                <Link
                  key={dm.id}
                  prefetch={true}
                  href={`/dms/chat/${dm.id}`}
                  className={badgeVariants()}
                >
                  {dm.name}
                </Link>
              </div>
            ))}
        </div>
        <div className="flex flex-col items-center">
          <div className="py-1 ">
            {/* <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white "
                  onClick={() => {
                    setIsUserSelectorOpen(true);
                  }}
                >
                  Select Members
                </Button>
              </DialogTrigger>
              <DialogContent>
                {isUserSelectorOpen && (
                  <UserSelector onSelectionChange={handleSelectionChange} />
                )}
              </DialogContent>
            </Dialog> */}
            {/* <Button
              className="bg-blue-500 hover:bg-blue-600 text-white "
              onClick={() => {
                setIsUserSelectorOpen(true);
              }}
            >
              open
            </Button> */}

            <UserSelector onSelectionChange={handleSelectionChange} />
          </div>
          <div className="py-1">
            <Button
              onClick={addNewDM}
              className="bg-blue-500 hover:bg-blue-600 text-white "
            >
              Start DM
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column for Chats */}
      <div className="px-2 border" style={{ width: "94%" }}>
        <div>{props.children}</div>
      </div>
    </div>
  );
}
