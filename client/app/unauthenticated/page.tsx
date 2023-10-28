import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
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
      <h1>Please login to access this part of the website!</h1>
      <form action="/auth/login" method="post">
        <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Log In
        </Button>
      </form>
    </div>
  );
}
