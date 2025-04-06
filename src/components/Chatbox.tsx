import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessage } from '../services/chatService';
import { Send, MessageSquare, X } from 'lucide-react';

interface ChatMessage {
  user: boolean;
  text: string;
  timestamp: number;
}

export default function Chatbox() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        
        const userMessage = input.trim();
        setInput('');
        
        // Add user message to the chat
        const newUserMessage = { id: Date.now().toString(), text: userMessage, sender: 'user' };
        setMessages((prev) => [...prev, newUserMessage]);
        
        // Show loading indicator
        setIsLoading(true);
        
        try {
            // Get response from AI
            const response = await sendMessage(userMessage);
            
            // Add AI response to the chat
            const newAiMessage = { 
                id: (Date.now() + 1).toString(), 
                text: response, 
                sender: 'ai' 
            };
            setMessages((prev) => [...prev, newAiMessage]);
        } catch (error) {
            // Handle errors gracefully
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Sorry, there was a problem connecting to the assistant.";
            
            // Add error message to chat
            const errorNotification = { 
                id: (Date.now() + 1).toString(), 
                text: errorMessage, 
                sender: 'system' 
            };
            setMessages((prev) => [...prev, errorNotification]);
            
            // Log sanitized error information
            const logInfo = {
                component: 'Chatbox',
                action: 'handleSendMessage',
                timestamp: new Date().toISOString(),
                errorType: error instanceof Error ? error.constructor.name : 'Unknown'
            };
            console.error(JSON.stringify(logInfo));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="chatbox-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="chatbox-toggle"
                aria-label={isOpen ? "Close Chat Assistant" : "Open Chat Assistant"}
            >
                <MessageSquare className="h-5 w-5" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chatbox"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="chat-header">
                            <span>AI Assistant</span>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsOpen(false)}
                                className="close-button"
                                aria-label="Close Chat"
                            >
                                <X className="h-4 w-4" />
                            </motion.button>
                        </div>
                        
                        <div className="chat-messages" role="log" aria-live="polite">
                            {messages.length === 0 && (
                                <div className="welcome-message">
                                    How can I help you with your library needs today?
                                </div>
                            )}
                            
                            {messages.map((msg, i) => (
                                <div 
                                    key={msg.timestamp + i} 
                                    className={msg.user ? "user-msg" : "ai-msg"}
                                >
                                    {msg.text}
                                </div>
                            ))}
                            
                            {isTyping && (
                                <div className="ai-msg typing-indicator">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>
                        
                        <div className="chat-input-area">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about books or library services..."
                                onKeyPress={(e) => e.key === 'Enter' ? handleSendMessage() : null}
                                className="chat-input"
                                aria-label="Chat message input"
                                disabled={isTyping || isLoading}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSendMessage}
                                className="send-button"
                                aria-label="Send message"
                                disabled={!input.trim() || isTyping || isLoading}
                            >
                                <Send className="h-4 w-4" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}