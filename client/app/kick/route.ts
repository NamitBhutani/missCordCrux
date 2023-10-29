import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from 'next/server'
import type { Database } from "@/codelib/database.types";
export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { isAdmin, member, id } = await request.json();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
        NextResponse.redirect("/unauthenticated");
    }
    if (!isAdmin) {
        return NextResponse.json({ message: 'Not an admin!', status: 400 }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email === member) {
        return NextResponse.json({ message: 'Cannot KIK yourself!', status: 400 }, { status: 400 })
    }
    const { error: memberKickError } = await supabase
        .from("dm_members")
        .delete().eq("member", member).eq("id", id)
    if (memberKickError) {
        return NextResponse.json({ message: 'Error in KIKing!', status: 400 }, { status: 400 })
    }
    else {
        return NextResponse.json({ message: 'KIKed!', status: 200 }, { status: 200 })
    }

}