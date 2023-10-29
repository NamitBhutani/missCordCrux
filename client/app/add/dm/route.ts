import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import redis from "@/lib/redis";
import { NextResponse } from 'next/server'
import { v5 as uuidv5 } from "uuid";
let dmName: string
type RearrangedItem = {
  id: string;
  name: string;
};
export async function POST(request: Request) {
  function generateUUIDFromValues(values: string[]) {
    const uniqueString = values.join("");
    const namespace = "1b671a64-40d5-491e-99b0-da01ff1f3341";
    const generatedUUID = uuidv5(uniqueString, namespace);
    return generatedUUID;
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { newMembersID, email, currentDms } = await request.json();
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
    const memberDmsKey = `dms:${email}`;
    // Check if DM ID exists in the cache
    const dmExists = await redis.get(`dms:${newDMId}`);
    if (dmExists === "exists") {
      return NextResponse.json({ message: 'DM already exists!', status: 400 }, { status: 400 })
    }
    await fetch("https://random-word-api.herokuapp.com/word?number=2")
      .then((response) => response.json())
      .then((data) => {
        if (data.length === 2) {
          const combinedWord = data.join('-');
          dmName = combinedWord;
        } else {
          console.error('Unexpected data format');
        }
      })
      .catch((error) => {
        return NextResponse.json({ message: 'Something went wrong!', status: 400 }, { status: 400 })
      });
    const updatedDms = [...currentDms as RearrangedItem[], { id: newDMId, name: dmName }]
    const dmStrings: string[] = updatedDms.map((dm) => JSON.stringify(dm));
    const { error: newDMInsertError } = await supabase.from("dms").insert({
      id: newDMId,
      admin: email,

    });
    const cachedDms = await redis.lrange(memberDmsKey, 0, -1);
    // console.log(cachedDms)
    if (cachedDms.length === 0) {
      await redis.rpush(memberDmsKey, ...dmStrings)
      await redis.expire(memberDmsKey, 60)
    }
    else {
      await redis.del(memberDmsKey)
      await redis.rpush(memberDmsKey, ...dmStrings)
      await redis.expire(memberDmsKey, 60)
    }

    if (newDMInsertError) {
      return NextResponse.json({ message: "Try again!", status: 400 }, { status: 400 })
    }

    const { error: adminMemberInsertError } = await supabase
      .from("dm_members")
      .insert({
        id: newDMId,
        member: email,
        name: dmName,
      });


    newMembersID.forEach(async (member: any) => {
      const { error: memberInsertError } = await supabase
        .from("dm_members")
        .insert({
          id: newDMId,
          member: member,
          name: dmName,
        });
      if (memberInsertError) {
        return NextResponse.json({ message: "Something went wrong!", status: 400 }, { status: 400 })
      }
    });

    // const { error: chatInsertError } = await supabase.from("chats").insert({
    //   channel: newDMId,
    // });
    if (adminMemberInsertError) {
      return NextResponse.json({ message: "Something went wrong!", status: 400 }, { status: 400 })
    }
    // Cache the new DM ID
    await redis.set(`dms:${newDMId}`, "exists");
    return NextResponse.json({ message: 'success', status: 200 }, { status: 200 })
  } catch (error) {

    console.error(error);
    return NextResponse.json({ message: JSON.stringify(error), status: 400 }, { status: 400 })
  }

}
