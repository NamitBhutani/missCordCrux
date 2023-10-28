import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { Database } from '@/codelib/database.types'

export async function POST(request: Request) {

    const formData = await request.formData()
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://miss-cord-crux.vercel.app/auth/callback'
        }
    })

    if (data?.url) {
        return NextResponse.redirect(data.url, {
            status: 301,
        })
    }

}