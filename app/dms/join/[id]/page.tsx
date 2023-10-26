"use client";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
import { redirect } from "next/navigation";
export default async function Join({ params }: { params: { id: String } }) {
  const supabase = createClientComponentClient<Database>({});
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const joinDM = async () => {
    if (!user) {
      redirect("/unauthenticated");
    }
    const res = await fetch("/add/member", {
      method: "post",
      body: JSON.stringify({
        member: user?.email,
        id: params.id,
      }),
    });
    const data = await res.json();
    if (data.status === 200) {
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }
  };
  return (
    <div>
      <Button onClick={joinDM}>Join DM!</Button>
    </div>
  );
}
