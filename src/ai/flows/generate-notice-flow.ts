'use server';
/**
 * @fileOverview An AI flow to generate a monthly notice for tenants.
 *
 * - generateNotice - A function that takes bullet points and generates a full notice.
 * - GenerateNoticeInput - The input type for the generateNotice function.
 * - GenerateNoticeOutput - The return type for the generateNotice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateNoticeInputSchema = z.object({
  points: z.string().describe('The key points or bullet points for the notice.'),
});
export type GenerateNoticeInput = z.infer<typeof GenerateNoticeInputSchema>;

const GenerateNoticeOutputSchema = z.object({
  notice: z.string().describe('The fully generated, professional notice content.'),
});
export type GenerateNoticeOutput = z.infer<typeof GenerateNoticeOutputSchema>;

export async function generateNotice(input: GenerateNoticeInput): Promise<GenerateNoticeOutput> {
  return generateNoticeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNoticePrompt',
  input: { schema: GenerateNoticeInputSchema },
  output: { schema: GenerateNoticeOutputSchema },
  prompt: `You are a helpful property manager's assistant. Your task is to write a clear, professional, and friendly notice for tenants based on a few bullet points.

The tone should be courteous but firm. Ensure the notice is well-formatted and easy to read.

Here are the key points to include:
{{{points}}}

Please generate the full notice content now.`,
});

const generateNoticeFlow = ai.defineFlow(
  {
    name: 'generateNoticeFlow',
    inputSchema: GenerateNoticeInputSchema,
    outputSchema: GenerateNoticeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
