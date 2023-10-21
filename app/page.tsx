import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/codelib/database.types";
import Avatar from "../customComponents/AvatarSelector";
import { ModeToggle } from "@/customComponents/ModeToggle";

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
          <ModeToggle />
          <div className="text-center">Welcome, {user.user_metadata.name}</div>
          <div className="mt-4 text-center">Enter About</div>
          <form
            action="/update/about"
            method="post"
            className="mt-2 flex flex-col items-center"
          >
            <label htmlFor="about" className="block">
              About:
            </label>
            <Input
              type="text"
              id="about"
              name="about"
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:border-blue-300"
            />
            <Button
              type="submit"
              className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 cursor-pointer"
            >
              Submit
            </Button>
          </form>
          <Avatar />
        </div>
      </div>
    );
  } else {
    return (
      <button>
        <a href="/login">Login</a>
      </button>
    );
  }
}
