
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import type { WorkDetail } from '@/types'

const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or service role key is not configured on the server. Please check your environment variables.');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export async function saveWorkDetailAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    
    const workData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        category: formData.get('category') as string || null,
        status: formData.get('status') as 'To Do' | 'In Progress' | 'Completed',
        assigned_to_id: formData.get('assigned_to_id') as string || null,
        product_cost: Number(formData.get('product_cost')) || null,
        worker_cost: Number(formData.get('worker_cost')) || null,
        due_date: formData.get('due_date') as string || null,
    }
    
    const workId = formData.get('workId') as string | undefined;

    let error;

    if (workId) {
        // Update existing work detail
        const { error: updateError } = await supabaseAdmin
            .from('work_details')
            .update(workData)
            .eq('id', workId);
        error = updateError;
    } else {
        // Insert new work detail
        const { error: insertError } = await supabaseAdmin
            .from('work_details')
            .insert(workData);
        error = insertError;
    }

    if (error) {
        console.error('Supabase error:', error);
        return { error: error.message };
    }
    
    return { success: true };
}


export async function deleteWorkDetailAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const workId = formData.get('workId') as string;

    if (!workId) {
        return { error: 'Work ID is missing.' };
    }

    const { error } = await supabaseAdmin
        .from('work_details')
        .delete()
        .eq('id', workId);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: error.message };
    }
    
    return { success: true };
}


export async function addWorkDetailsBatch(workDetails: Omit<WorkDetail, 'id' | 'created_at' | 'deleted_at'>[]) {
    if (!workDetails || workDetails.length === 0) {
        return { error: 'No work details provided.' };
    }
    
    const supabaseAdmin = getSupabaseAdmin();
    
    const { error } = await supabaseAdmin.from('work_details').insert(workDetails);

    if (error) {
        console.error('Error batch inserting work details:', error);
        return { error: `Failed to insert work details: ${error.message}` };
    }

    return { success: true, count: workDetails.length };
}
