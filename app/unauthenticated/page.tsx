import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/codelib/database.types";
import { redirect } from "next/navigation";
export default async function Unauthenticated() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    redirect("/dms");
  }
  return (
    <div>
      <h1>Unauthenticated</h1>
    </div>
  );
}
