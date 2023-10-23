"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
type Dms = Database["public"]["Tables"]["dms"]["Row"]["with"];
type GroupDms = Database["public"]["Tables"]["group_dms"]["Row"]["with_group"];
const chatUUID = uuidv4();
const groupChatUUID = uuidv4();
export default function RealtimeDms({
  props,
}: {
  props: {
    id: string;
    initialDms: Dms;
    initialGroupDms: GroupDms;
    children: React.ReactNode;
  };
}) {
  const supabase = createClientComponentClient<Database>();
  const addNewDM = async () => {
    try {
      if (!newDMEmail) {
        return;
      }

      const { data: dmsData, error } = await supabase
        .from("dms")
        .select("with")
        .eq("id", props.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }
      //console.log(dmsData);

      const emails = JSON.parse(JSON.stringify(dmsData.with));
      const updatedEmails = { ...emails, [newDMEmail]: chatUUID };

      //console.log(JSON.stringify(updatedEmails));

      const { error: chatChannelError } = await supabase
        .from("chats")
        .insert({ channel: chatUUID });

      const { error: updateError } = await supabase
        .from("dms")
        .update({ with: updatedEmails })
        .eq("id", props.id);

      if (updateError) {
        console.error(updateError);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addNewGroupDM = async () => {
    const { data: groupDmsData, error } = await supabase
      .from("group_dms")
      .select("with_group")
      .eq("id", props.id)
      .single();

    if (error) {
      console.error("uwuw" + JSON.stringify(error));
      return;
    }

    const emails = JSON.parse(JSON.stringify(groupDmsData.with_group));
    const updatedEmails = { ...emails, [groupChatUUID]: newGroupDMEmails };
    // console.log("ue" + JSON.stringify(updatedEmails));
    const { error: chatChannelError } = await supabase
      .from("group_chats")
      .insert({ channel: groupChatUUID });

    const { error: updateError } = await supabase
      .from("group_dms")
      .update({ with_group: updatedEmails })
      .eq("id", props.id);
  };

  const [dms, setDms] = useState<Dms | null>(props.initialDms);
  const [groupDms, setGroupDms] = useState<GroupDms | null>(
    props.initialGroupDms
  );
  const [newDMEmail, setNewDMEmail] = useState<string>("");

  const [newGroupDMEmails, setNewGroupDMEmails] = useState<string[]>([""]);

  useEffect(() => {
    const channel = supabase
      .channel("dms")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "dms" },
        (payload) => {
          setDms((dms) => {
            if (payload.new) {
              console.log("ter" + payload.new);
              return payload.new.with;
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

  useEffect(() => {
    const channel = supabase
      .channel("group-dms")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "group_dms" },
        (payload) => {
          setGroupDms((dms) => {
            if (payload.new) {
              return payload.new.with_group;
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
              Object.entries(dms).map(([email, channel]) => (
                <div key={channel} className="mb-2">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                    <Link href={`/chat/${channel}`} className="text-white">
                      {email}
                    </Link>
                  </Button>
                </div>
              ))}
          </div>

          <div className="mb-4">
            <h1 className="text-2xl mb-2">Group DMS</h1>
            {groupDms &&
              Object.entries(groupDms).map(([channel, emails]) => (
                <div key={channel} className="mb-2">
                  <Button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                    <Link href={`/groupchat/${channel}`} className="text-white">
                      {emails.join(", ")}
                    </Link>
                  </Button>
                </div>
              ))}
          </div>
        </div>

        {/* Main content area for chat messages */}
        <div className="w-3/4 p-4">{props.children}</div>
      </div>

      <div className="flex items-center justify-between p-4">
        <Input
          type="text"
          value={newDMEmail}
          onChange={(e) => setNewDMEmail(e.target.value)}
          placeholder="Enter email to start a new DM!"
          className="mr-2"
        />
        <Button
          onClick={addNewDM}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          New DM
        </Button>
      </div>

      <div className="flex items-center justify-between p-4">
        <Input
          type="text"
          value={newGroupDMEmails}
          onChange={(e) => {
            const emailsArray = e.target.value.split(",");
            setNewGroupDMEmails(emailsArray);
          }}
          placeholder="Enter emails separated by commas without spaces"
          className="mr-2"
        />
        <Button
          onClick={addNewGroupDM}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          New Group DM
        </Button>
      </div>
    </>
  );
}
