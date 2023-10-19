import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { Database } from '@/codelib/database.types'
export async function GET(request: Request) {

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const {
        data: id,
    } = await supabase.from('profiles').select('id').eq('email', user?.email || '').single()

    const { data: chats, error } = await supabase.from('chats').select('with').eq('id', id?.id || "").single()

    const { data: images } = supabase
        .storage
        .from('profile-images')
        .getPublicUrl(`avatar_${id?.id}.png`)

    if (chats && images) {
        return NextResponse.json({ chats, images })
    }
    else {
        return NextResponse.json({ error: 'No chats found' }, { status: 404 })
    }

}