'use server';
/**
 * @fileOverview An AI flow to extract tenant information from an image.
 * 
 * - extractTenantInfo - A function that handles the tenant info extraction process.
 * - ExtractTenantInfoInput - The Zod schema for the input.
 * - ExtractTenantInfoOutput - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractTenantInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document like an ID card or application form, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ExtractTenantInfoInput = z.infer<typeof ExtractTenantInfoInputSchema>;

const ExtractTenantInfoOutputSchema = z.object({
  name: z.string().optional().describe('The full name of the person.'),
  email: z.string().optional().describe('The email address of the person.'),
  phone: z.string().optional().describe('The phone number of the person.'),
  father_name: z.string().optional().describe("The person's father's name."),
  address: z.string().optional().describe("The person's full address."),
  date_of_birth: z.string().optional().describe("The person's date of birth in YYYY-MM-DD format."),
  nid_number: z.string().optional().describe("The person's National ID (NID) number."),
  advance_deposit: z.number().optional().describe("The advance deposit or security deposit amount paid by the tenant."),
});
export type ExtractTenantInfoOutput = z.infer<typeof ExtractTenantInfoOutputSchema>;


export async function extractTenantInfo(input: ExtractTenantInfoInput): Promise<ExtractTenantInfoOutput> {
  return extractTenantInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTenantInfoPrompt',
  input: { schema: ExtractTenantInfoInputSchema },
  output: { schema: ExtractTenantInfoOutputSchema },
  prompt: `You are a data entry assistant for a property manager. Your task is to extract tenant information from the provided document image, which could be a National ID card (NID), passport, or application form.

Look for the following pieces of information:
- Full Name
- Father's Name
- Email Address
- Phone Number
- Full Address
- Date of Birth (ensure it is in YYYY-MM-DD format)
- National ID (NID) Number
- Advance Deposit / Security Deposit Amount

If any piece of information is not clearly visible or present, omit it from the output. Do not guess or make up information. Only return the data you can clearly identify from the document.

Image of document: {{media url=photoDataUri}}`,
});

const extractTenantInfoFlow = ai.defineFlow(
  {
    name: 'extractTenantInfoFlow',
    inputSchema: ExtractTenantInfoInputSchema,
    outputSchema: ExtractTenantInfoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
