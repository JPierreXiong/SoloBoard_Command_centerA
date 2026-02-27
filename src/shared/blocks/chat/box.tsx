/**
 * Chat Box Component - Not used in Digital Heirloom
 * This file exists only to prevent build errors from legacy subtitle extract code
 */

'use client';

import { UIMessage } from 'ai';
import type { Chat } from '@/shared/types/chat';

interface ChatBoxProps {
  initialChat: Chat;
  initialMessages: UIMessage[];
}

export function ChatBox({ initialChat, initialMessages }: ChatBoxProps) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Chat Not Available</h1>
        <p className="text-muted-foreground">
          Chat functionality is not available in Digital Heirloom.
        </p>
      </div>
    </div>
  );
}
