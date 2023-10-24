import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import redis from "@/lib/redis";
import { NextResponse } from 'next/server'
import type { Database } from "@/codelib/database.types";
type Chats = Database["public"]["Tables"]["chats"]["Row"]["chat"];
type Message = {
    from: string;
    chat: string;
    time: Date;
};
export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { chat, username, newChat, id } = await request.json();
    const keyChats = `chats:${id}`;
    if (newChat.length === 0) { return NextResponse.json({ message: 'Empty Chat!' }, { status: 400 }) }
    const updatedChats = [
        ...(chat ? (chat as unknown as Message[]) : []),
        { from: username, chat: newChat, time: Date.now() },
    ];
    const chatStrings: string[] = updatedChats.map((chat) =>
        JSON.stringify(chat)
    );
    const { error } = await supabase
        .from("chats")
        .update({ chat: updatedChats as Chats })
        .eq("channel", id);
    const cachedChats = await redis.lrange(keyChats, 0, -1);

    if (cachedChats === chatStrings) { await redis.rpush(keyChats, newChat) }
    else { await redis.rpush(keyChats, ...chatStrings) }

    if (error) {
        return NextResponse.json({ message: 'Error sending chat!' }, { status: 400 })
    }
    else {
        return NextResponse.json({ message: 'Chat sent!' }, { status: 200 })
    }
}