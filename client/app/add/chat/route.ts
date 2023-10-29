import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import redis from "@/lib/redis";
import { NextResponse } from 'next/server'
import type { Database } from "@/codelib/database.types";

type Message = {
    from: string;
    chat: string;
    isMarkdown: boolean;
};
type ChatLoadData = {
    chat: Message;
    timestamp: string;
    pkey: number;
};
export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { chat, username, newChat, id, isMarkdown } = await request.json();
    const keyChats = `chats:${id}`;
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
        NextResponse.redirect("/unauthenticated");
    }
    if (newChat.length === 0) { return NextResponse.json({ message: 'Empty Chat!', status: 400 }, { status: 400 }) }


    const { data: insertedChat, error } = await supabase
        .from("chats")
        .insert({ chat: { chat: newChat, from: username, isMarkdown: isMarkdown }, channel: id })
        .eq("channel", id).select("chat,timestamp,pkey").single();
    const updatedChats = [
        ...(chat ? (chat as unknown as ChatLoadData[]) : []),
        { chat: { chat: newChat, from: username, isMarkdown: isMarkdown }, timestamp: new Date().toISOString(), pkey: insertedChat?.pkey },
    ];
    const chatStrings: string[] = updatedChats.map((chat) =>
        JSON.stringify(chat)
    );
    console.log("chatStrings")
    console.log(chatStrings)
    const cachedChats = await redis.lrange(keyChats, 0, -1);
    if (cachedChats.length === 0) {
        console.log("oL")
        console.log(cachedChats)
        await redis.rpush(keyChats, ...chatStrings)

        await redis.expire(keyChats, 60)
    }
    else {

        await redis.del(keyChats)

        await redis.rpush(keyChats, ...chatStrings)

        await redis.expire(keyChats, 60)
    }
    // } else {
    //     await redis.rpush(keyChats, JSON.stringify({ chat: { chat: newChat, from: username, isMarkdown: isMarkdown }, timestamp: new Date().toISOString() }))
    //     await redis.expire(keyChats, 60)
    // }

    if (error) {
        return NextResponse.json({ message: error, status: 400 }, { status: 400 })
    }
    else {
        return NextResponse.json({ message: 'Chat sent!', status: 200 }, { status: 200 })
    }
}