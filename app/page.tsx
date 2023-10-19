import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/codelib/database.types";
import Avatar from "../customComponents/page";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const userName = user.user_metadata.name;

    return (
      <div>
        <div>Welcome, {userName}</div>
        <div>Enter About</div>
        <form action="/update/about" method="post">
          <label htmlFor="about">About:</label>
          <input type="text" id="about" name="about" />
          <button type="submit">Submit</button>
        </form>
        <Avatar />
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
