import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/codelib/database.types'
export async function POST(request: Request) {

    const { about } = await request.json()

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('profiles')
        .update({ about: about })
        .eq('email', user?.email || '')

    if (error) {
        return NextResponse.json({ message: "Error updating about", status: 400 }, { status: 400 })
    }
    else {
        return NextResponse.json({ message: 'About updated!', status: 200 }, { status: 200 })
        //return NextResponse.redirect('/profile', { status: 200 })
    }

}