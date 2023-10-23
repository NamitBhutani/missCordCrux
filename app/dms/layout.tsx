import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import type { Database } from "@/codelib/database.types";
import RealtimeDms from "@/customComponents/RealtimeDms";
type RearrangedItem = {
  id: string;
};
let payload: any;
export default async function DMS({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/unauthenticated");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: idData } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user?.email || "")
    .single();

  //load dms where the logged user is a member
  const { data: dmsLoadData } = await supabase
    .from("dm_members")
    .select("id")
    .eq("member", user?.email || "");

  const params = {
    id: idData?.id as string,
    email: user?.email as string,
    initialDms: dmsLoadData as RearrangedItem[],
    children: children,
  };

  return (
    <>
      <RealtimeDms props={params} />
      {/* {children} */}
    </>
  );
}
