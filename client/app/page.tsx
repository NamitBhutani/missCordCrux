import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import Login from "./login/page";
import UserSelector from "@/customComponents/UserSelector";
export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 rounded shadow-md">
          <div className="text-center">Welcome, {user?.user_metadata.name}</div>

          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/profile"
          >
            Profile
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/dms">
            Dms
          </Link>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <Login />
      </div>
    );
  }
}
