
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// This function creates a Supabase client with admin privileges.
// It uses the service_role key and is intended for server-side use only
// where row-level security needs to be bypassed.
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or service role key is not configured on the server. Please check your environment variables.');
    }
    
    // The `auth` option with `autoRefreshToken: false` and `persistSession: false`
    // is crucial for server-side clients to prevent session-related issues.
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export async function saveNoticeAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    
    const noticeData = {
        year: Number(formData.get('year')),
        month: Number(formData.get('month')),
        content: formData.get('content') as string,
    }
    
    const noticeId = formData.get('noticeId') as string | undefined;

    let error;

    if (noticeId) {
        // Update existing notice
        const { error: updateError } = await supabaseAdmin
            .from('notices')
            .update({ content: noticeData.content })
            .eq('id', noticeId);
        error = updateError;
    } else {
        // Insert new notice
        const { error: insertError } = await supabaseAdmin
            .from('notices')
            .insert(noticeData);
        error = insertError;
    }

    if (error) {
        console.error('Supabase error:', error);
        return { error: error.message };
    }
    
    return { success: true };
}


export async function deleteNoticeAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const noticeId = formData.get('noticeId') as string;

    if (!noticeId) {
        return { error: 'Notice ID is missing.' };
    }

    const { error } = await supabaseAdmin
        .from('notices')
        .delete()
        .eq('id', noticeId);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: error.message };
    }
    
    return { success: true };
}
