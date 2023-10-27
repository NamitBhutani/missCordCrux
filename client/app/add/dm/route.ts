import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import redis from "@/lib/redis";
import { NextResponse } from 'next/server'
import { v5 as uuidv5 } from "uuid";
export async function POST(request: Request) {
  function generateUUIDFromValues(values: string[]) {
    const uniqueString = values.join("");
    const namespace = "1b671a64-40d5-491e-99b0-da01ff1f3341";
    const generatedUUID = uuidv5(uniqueString, namespace);
    return generatedUUID;
  }
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { newMembersID, email } = await request.json();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      NextResponse.redirect("/unauthenticated");
    }
    if (newMembersID.length === 0) {
      return NextResponse.json({ message: 'Empty fields detected!', status: 400 }, { status: 400 })
    }
    const newDMId = generateUUIDFromValues(newMembersID);

    // Check if DM ID exists in the cache
    const dmExists = await redis.get(`dms:${newDMId}`);
    if (dmExists === "exists") {
      return NextResponse.json({ message: 'DM already exists!', status: 400 }, { status: 400 })
    }
    const { error: newDMInsertError } = await supabase.from("dms").insert({
      id: newDMId,
      admin: email,
    });
    if (newDMInsertError) {
      return NextResponse.json({ message: 'Error adding DM!', status: 400 }, { status: 400 })
    }

    const { error: adminMemberInsertError } = await supabase
      .from("dm_members")
      .insert({
        id: newDMId,
        member: email,
      });
    const memberDmsKey = `dms:${email}`;


    await redis.rpush(memberDmsKey, newDMId);
    // console.log("memberDmsKey set for logged in", memberDmsKey);
    await redis.expire(memberDmsKey, 60);


    newMembersID.forEach(async (member: any) => {
      const { error: memberInsertError } = await supabase
        .from("dm_members")
        .insert({
          id: newDMId,
          member: member,
        });

    });

    const { error: chatInsertError } = await supabase.from("chats").insert({
      channel: newDMId,
    });

    // Cache the new DM ID
    await redis.set(`dms:${newDMId}`, "exists");
    return NextResponse.json({ message: 'success', status: 200 }, { status: 200 })
  } catch (error) {
    console.error(error);
  }

}
