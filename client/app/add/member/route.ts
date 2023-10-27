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

    const { data: presentMembers, error } = await supabase.from("dm_members").select("member").eq("id", id)
    if (presentMembers !== null) {
        const existingMembers = presentMembers.map((row) => row.member);
        if (!existingMembers.includes(member)) {
            const { error: memberAddError } = await supabase
                .from("dm_members")
                .insert({ member: member, id: id });
            if (memberAddError) {
                return NextResponse.json({ message: 'Error Joining!', status: 400 }, { status: 400 })
            } else {
                return NextResponse.json({ message: 'Joined the DM!', status: 200 }, { status: 200 })
            }
        } else {
            return NextResponse.json({ message: 'Already Joined!', status: 400 }, { status: 400 })
        }

    }



    return NextResponse.json({ message: 'Unique Members added!', status: 200 }, { status: 200 })
}