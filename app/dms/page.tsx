"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
type Dms = Database["public"]["Tables"]["dms"]["Row"]["with"];
interface DmsState {
  emails: string[];
}
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
      const updatedEmails = [...emails.emails, newDMEmail];

      console.log(JSON.stringify(updatedEmails));

      const { error: updateError } = await supabase
        .from("dms")
        .update({ with: { emails: updatedEmails } })
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
    <div>
      {dms ? (
        <ul>
          {dms.emails.map((email: string, index: number) => (
            <li key={index}>
              <a href={`/chat/1`}>{email}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No emails found.</p>
      )}
      <button onClick={addNewDM}>New DM</button>
      <input
        type="text"
        value={newDMEmail}
        onChange={(e) => setNewDMEmail(e.target.value)}
      />
      <button onClick={addNewGroupDM}>New Group DM</button>
    </div>
  );
}
