import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import type { Database } from "@/codelib/database.types";
import RealtimeDms from "@/customComponents/RealtimeDms";
type Dms = Database["public"]["Tables"]["dms"]["Row"]["with"];
type GroupDms = Database["public"]["Tables"]["group_dms"]["Row"]["with_group"];

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

  const userID = idData?.id || "";
  const { data: dmsLoadData } = await supabase
    .from("dms")
    .select("with")
    .eq("id", userID)
    .single();

  const { data: groupDmsLoadData } = await supabase
    .from("group_dms")
    .select("with_group")
    .eq("id", userID)
    .single();

  const params = {
    id: idData?.id as string,
    initialDms: dmsLoadData?.with as unknown as Dms,
    initialGroupDms: groupDmsLoadData?.with_group as unknown as GroupDms,
    children: children,
  };

  return (
    <>
      <RealtimeDms props={params} />
      {/* {children} */}
    </>
  );
}
