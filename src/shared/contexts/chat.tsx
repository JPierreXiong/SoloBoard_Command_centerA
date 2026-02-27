/**
 * Chat Context - Not used in Digital Heirloom
 * This file exists only to prevent build errors from legacy subtitle extract code
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';

interface ChatContextValue {
  // Chat context is not used in Digital Heirloom
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const value: ChatContextValue = {};
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatContextProvider');
  }
  return context;
}
