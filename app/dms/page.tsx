"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
type Dms = Database["public"]["Tables"]["dms"]["Row"]["with"];
const chatUUID = uuidv4();
export default function DMS() {
  const addNewDM = async () => {
    try {
      if (!newDMEmail) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: idData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", user?.email || "")
        .single();

      const { data: dmsData, error } = await supabase
        .from("dms")
        .select("with")
        .single();

      if (error) {
        console.error(error);
        return;
      }
      console.log(dmsData);

      const emails = JSON.parse(JSON.stringify(dmsData.with));
      const updatedEmails = { ...emails, [newDMEmail]: chatUUID };

      console.log(JSON.stringify(updatedEmails));

      const { error: chatChannelError } = await supabase
        .from("chats")
        .insert({ channel: chatUUID });

      const { error: updateError } = await supabase
        .from("dms")
        .update({ with: updatedEmails })
        .eq("id", idData?.id || "");

      if (updateError) {
        console.error(updateError);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addNewGroupDM = async () => {};
  const supabase = createClientComponentClient<Database>();
  const [dms, setDms] = useState<Dms | null>(null);
  const [newDMEmail, setNewDMEmail] = useState<string>("");

  useEffect(() => {
    const loadCurrentDMS = async () => {
      const { data: dmsLoadData } = await supabase
        .from("dms")
        .select("with")
        .single();

      setDms(dmsLoadData?.with || null);
    };
    loadCurrentDMS();
  }, []);
  //initial load

  useEffect(() => {
    const channel = supabase
      .channel("*")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "dms" },
        (payload) => {
          setDms((dms) => {
            if (payload.new) {
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
  }, [supabase, setDms]);

  //realtime load as a new dm is added

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        {dms ? (
          <ul className="mb-4">
            <h1 className="text-2xl mb-4">DMS</h1>
            {Object.entries(dms).map(([email, channel]) => (
              <li key={email} className="mb-2">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                  <Link href={`/chat/${channel}`} className="text-white">
                    {email}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No dms found.</p>
        )}
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
          value={newDMEmail}
          onChange={(e) => setNewDMEmail(e.target.value)}
          placeholder="Enter emails separated by commas"
          className="mr-2"
        />
        <Button
          onClick={addNewGroupDM}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          New Group DM
        </Button>
      </div>
    </div>
  );
}
