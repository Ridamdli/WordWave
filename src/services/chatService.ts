export const sendMessage = async (message: string): Promise<string> => {
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Log error ID if available from the server response
            const errorId = errorData.errorId ? ` (Error ID: ${errorData.errorId})` : '';
            throw new Error(`Server error: ${response.status}${errorId}`);
        }

        const data = await response.json();
        return data.reply; // Assuming the AI reply is in the 'reply' field
    } catch (error) {
        // Use a generic error message for the user while logging a sanitized version
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // In production, you'd use a proper logging service instead of console
        const logData = {
            timestamp: new Date().toISOString(),
            component: 'chatService',
            action: 'sendMessage',
            error: errorMessage,
        };
        
        // Sanitized logging to avoid exposing sensitive data
        console.error(JSON.stringify(logData));
        
        // Return a user-friendly error message
        throw new Error("Failed to communicate with AI assistant. Please try again later.");
    }
};