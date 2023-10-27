import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import redis from "@/lib/redis";
import { NextResponse } from 'next/server'
import type { Database } from "@/codelib/database.types";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];
type Message = {
    from: string;
    chat: string;
};
type ChatLoadData = {
    chat: Message;
    timestamp: string;
};
export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { chat, username, newChat, id } = await request.json();
    const keyChats = `chats:${id}`;
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
        NextResponse.redirect("/unauthenticated");
    }
    if (newChat.length === 0) { return NextResponse.json({ message: 'Empty Chat!', status: 400 }, { status: 400 }) }
    const updatedChats = [
        ...(chat ? (chat as unknown as ChatLoadData[]) : []),
        { chat: { chat: newChat, from: username }, timestamp: new Date().toISOString() },
    ];
    const chatStrings: string[] = updatedChats.map((chat) =>
        JSON.stringify(chat)
    );
    const { error } = await supabase
        .from("chats")
        .insert({ chat: { chat: newChat, from: username }, channel: id })
        .eq("channel", id);
    const cachedChats = await redis.lrange(keyChats, 0, -1);


    if (cachedChats !== chatStrings) {

        await redis.ltrim(keyChats, -1, -1)

        await redis.rpush(keyChats, ...chatStrings)

        await redis.expire(keyChats, 60)
    } else {
        await redis.rpush(keyChats, newChat)
        await redis.expire(keyChats, 60)
    }

    if (error) {
        return NextResponse.json({ message: error, status: 400 }, { status: 400 })
    }
    else {
        return NextResponse.json({ message: 'Chat sent!', status: 200 }, { status: 200 })
    }
}