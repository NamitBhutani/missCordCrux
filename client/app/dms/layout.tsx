import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import type { Database } from "@/codelib/database.types";
import RealtimeDms from "@/customComponents/RealtimeDms";
import redis from "@/lib/redis";
type RearrangedItem = {
  id: string;
};
let dmsLoadData;
export default async function DMS({ children }: { children: React.ReactNode }) {
  async function getDMsForMember(memberEmail: string) {
    const key = `dms:${memberEmail}`;
    const cachedDMs = await redis.lrange(key, 0, -1);

    if (cachedDMs.length > 0) {
      // Data found in cache, parse and return it
      const convertedDMs = cachedDMs.map((dm) => {
        return { id: JSON.parse(dm) };
      });
      return convertedDMs;
    } else {
      // Data not found in cache, fetch it from the database
      const { data, error } = await supabase
        .from("dm_members")
        .select("id")
        .eq("member", memberEmail);
      const fetchedDMs = data || [];
      if (error) {
        console.error(error);
        return [];
      }
      // Store the fetched DMs in the cache for future use
      if (fetchedDMs.length > 0) {
        await redis.ltrim(key, -1, -1);
        await redis.rpush(
          key,
          ...fetchedDMs.map((dm) => JSON.stringify(dm.id))
        );
        await redis.expire(key, 60);

        return fetchedDMs;
      } else return [];
    }
  }
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
  const loggedInUserEmail = user?.email;
  if (loggedInUserEmail) {
    dmsLoadData = await getDMsForMember(loggedInUserEmail);
  } else {
    redirect("/unauthenticated");
  }
  const params = {
    email: user?.email as string,
    initialDms: dmsLoadData as RearrangedItem[],
    children: children,
  };

  return (
    <>
      <div className="px-2">
        <RealtimeDms props={params} />
      </div>
    </>
  );
}
