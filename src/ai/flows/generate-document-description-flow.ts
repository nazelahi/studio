'use server';
/**
 * @fileOverview An AI flow to generate a description for a document image.
 *
 * - generateDocumentDescription - A function that handles the description generation.
 * - GenerateDocumentDescriptionInput - The Zod schema for the input.
 * - GenerateDocumentDescriptionOutput - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateDocumentDescriptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type GenerateDocumentDescriptionInput = z.infer<typeof GenerateDocumentDescriptionInputSchema>;

const GenerateDocumentDescriptionOutputSchema = z.object({
  description: z.string().describe('A concise, one-sentence description of the document.'),
});
export type GenerateDocumentDescriptionOutput = z.infer<typeof GenerateDocumentDescriptionOutputSchema>;

export async function generateDocumentDescription(input: GenerateDocumentDescriptionInput): Promise<GenerateDocumentDescriptionOutput> {
  return generateDocumentDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDocumentDescriptionPrompt',
  input: { schema: GenerateDocumentDescriptionInputSchema },
  output: { schema: GenerateDocumentDescriptionOutputSchema },
  prompt: `You are an expert document analyst. Your task is to look at the provided document image and generate a short, concise, one-sentence description of what it is.

For example:
- "An electricity bill for the month of June 2024."
- "The national ID card for John Doe."
- "A rental agreement signed on January 1st, 2023."
- "A property tax receipt for the year 2023."

Focus on the key information to create a helpful summary.

Image of document: {{media url=photoDataUri}}`,
});

const generateDocumentDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDocumentDescriptionFlow',
    inputSchema: GenerateDocumentDescriptionInputSchema,
    outputSchema: GenerateDocumentDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
