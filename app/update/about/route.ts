import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'


import type { Database } from '@/codelib/database.types'
export async function POST(request: Request) {

    const formData = await request.formData()
    const about = String(formData.get('about'))
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('profiles')
        .update({ about: about })
        .eq('email', user?.email)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    else {
        return NextResponse.json({ message: 'success' }, { status: 200 })
    }

}