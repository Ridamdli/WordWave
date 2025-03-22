import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai";

serve(async (req) => {
    // Metadata about the Edge Function
    // @supabase/functions-example/openai-chat
    // This function demonstrates how to use the OpenAI API to generate chat completions.
    // Setup:
    // 1. `cp .env.example .env`
    // 2. Fill in your OpenAI API key and Supabase credentials in `.env`
    // 3. `supabase functions deploy chat --no-verify-jwt`

    // Include header comment with metadata about the migration
    // Purpose: Proxy requests to OpenAI API for chat completions
    // Affected tables/columns: N/A - Edge Function
    // Special considerations: Requires OpenAI API Key and Supabase Service Role Key

    // Initialize Supabase client with Service Role Key for admin privileges
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Initialize OpenAI client with API Key from environment variables
    const openai = new OpenAI({
        apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    // Destructure the message from the request body
    const { message } = await req.json();

    try {
        // Create a chat completion request to OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Or gpt-4 if you have access and prefer higher quality
            messages: [{ role: "user", content: message }],
        });

        // Extract the AI's reply from the response
        const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

        // Return the AI response as JSON
        return new Response(
            JSON.stringify({ reply }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        // Log error to server logs without exposing details to client
        const errorId = crypto.randomUUID();
        
        // Only log essential error information in production
        const sanitizedError = {
            errorId,
            message: 'Failed to process AI request',
            timestamp: new Date().toISOString(),
            errorType: error instanceof Error ? error.name : 'Unknown',
        };
        
        // Log to server monitoring system (would be integrated with actual monitoring in production)
        // This avoids logging potentially sensitive data from the error object
        console.error(JSON.stringify(sanitizedError));
        
        return new Response(
            JSON.stringify({ 
                error: 'Failed to generate AI response',
                errorId, // Return the error ID so it can be referenced if the user reports an issue
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500, // Internal Server Error
            }
        );
    }
});