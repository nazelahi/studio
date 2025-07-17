
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { revalidatePath } from 'next/cache'

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

export async function saveDocumentAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const documentId = formData.get('documentId') as string | undefined;

    const docFiles = formData.getAll('documentFiles') as File[];
    const descriptions = formData.getAll('descriptions') as string[];
    const category = formData.get('category') as string;
    
    if (!category) {
        return { error: "Category is required." };
    }

    // Handle single document update
    if (documentId) {
        const docFile = formData.get('documentFile') as File | null;
        let fileUrl: string | null = formData.get('file_url') as string || null;
        let fileType: string | null = formData.get('file_type') as string || null;
        let fileName: string | null = formData.get('file_name') as string || null;

        if (docFile && docFile.size > 0) {
            const fileExt = docFile.name.split('.').pop();
            const filePath = `general-documents/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('general-documents')
                .upload(filePath, docFile);
            
            if (uploadError) {
                console.error('Supabase storage upload error:', uploadError);
                return { error: `Failed to upload document: ${uploadError.message}` };
            }

            const { data: publicUrlData } = supabaseAdmin.storage
                .from('general-documents')
                .getPublicUrl(filePath);

            fileUrl = publicUrlData.publicUrl;
            fileType = docFile.type;
            fileName = docFile.name;

            const oldFileUrl = formData.get('oldFileUrl') as string | undefined;
            if (oldFileUrl) {
                try {
                    const oldFilePath = new URL(oldFileUrl).pathname.split('/general-documents/')[1];
                    await supabaseAdmin.storage.from('general-documents').remove([oldFilePath]);
                } catch (e) {
                    console.error("Could not parse or delete old document from storage:", e)
                }
            }
        }
        
        const documentData = {
            category,
            description: formData.get('description') as string || null,
            file_url: fileUrl,
            file_type: fileType,
            file_name: fileName,
        }
        
        const { error } = await supabaseAdmin
            .from('documents')
            .update(documentData)
            .eq('id', documentId);
        
        if (error) {
            console.error('Supabase document update error:', error);
            return { error: error.message };
        }

    } else { // Handle batch document insert
        if (docFiles.length === 0) {
            return { error: 'No files selected for upload.' };
        }

        const documentsToInsert = [];

        for (let i = 0; i < docFiles.length; i++) {
            const file = docFiles[i];
            const fileExt = file.name.split('.').pop();
            const filePath = `general-documents/${Date.now()}-${i}.${fileExt}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('general-documents')
                .upload(filePath, file);

            if (uploadError) {
                console.error(`Supabase storage upload error for ${file.name}:`, uploadError);
                // We'll skip this file, but you could also choose to halt the whole process.
                continue; 
            }

            const { data: publicUrlData } = supabaseAdmin.storage
                .from('general-documents')
                .getPublicUrl(filePath);
            
            documentsToInsert.push({
                category,
                description: descriptions[i] || file.name,
                file_url: publicUrlData.publicUrl,
                file_type: file.type,
                file_name: file.name,
            });
        }
        
        if (documentsToInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('documents')
                .insert(documentsToInsert);
            
            if (insertError) {
                 console.error('Supabase batch insert error:', insertError);
                 return { error: insertError.message };
            }
        }
    }

    revalidatePath('/');
    return { success: true };
}

export async function deleteDocumentAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const documentId = formData.get('documentId') as string;

    if (!documentId) {
        return { error: 'Document ID is missing.' };
    }

    const fileUrl = formData.get('fileUrl') as string;
    if (fileUrl) {
        try {
            const filePath = new URL(fileUrl).pathname.split('/storage/v1/object/public/general-documents/')[1];
            if (filePath) {
                const { error: storageError } = await supabaseAdmin.storage
                    .from('general-documents')
                    .remove([filePath]);
                
                if (storageError) {
                    console.error('Supabase storage delete error (non-fatal):', storageError);
                }
            }
        } catch (e) {
             console.error('Could not parse or delete file from storage:', e);
        }
    }

    const { error } = await supabaseAdmin
        .from('documents')
        .delete()
        .eq('id', documentId);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}
