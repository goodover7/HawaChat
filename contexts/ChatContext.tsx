// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChatMessage, ChatRoom, getRooms, getMessages, sendMessage, deleteMessage, editMessage, toggleReaction } from '@/services/chatService';

interface ChatContextType {
  rooms: ChatRoom[];
  currentRoomId: string;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  setCurrentRoomId: (id: string) => void;
  loadMessages: (roomId: string) => Promise<void>;
  sendChatMessage: (
    senderId: string,
    senderName: string,
    senderAvatar: string,
    senderRank: string,
    senderLevel: number,
    senderBadge: string | null,
    senderNameColor: string | null,
    text: string,
    replyTo: ChatMessage | null,
    gift?: string | null,
    senderFrame?: string | null,
    senderCountry?: string
  ) => Promise<{ flagged: boolean }>;
  deleteMsg: (roomId: string, messageId: string) => Promise<void>;
  editMsg: (roomId: string, messageId: string, newText: string) => Promise<void>;
  toggleMsgReaction: (roomId: string, messageId: string, userId: string, emoji: string) => Promise<void>;
  refreshRooms: () => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState('room1');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    refreshRooms();
  }, []);

  async function refreshRooms() {
    const r = await getRooms();
    setRooms(r);
  }

  const loadMessages = useCallback(async (roomId: string) => {
    setIsLoadingMessages(true);
    const msgs = await getMessages(roomId);
    setMessages(msgs);
    setIsLoadingMessages(false);
  }, []);

  async function sendChatMessage(
    senderId: string,
    senderName: string,
    senderAvatar: string,
    senderRank: string,
    senderLevel: number,
    senderBadge: string | null,
    senderNameColor: string | null,
    text: string,
    replyTo: ChatMessage | null,
    gift: string | null = null,
    senderFrame: string | null = null,
    senderCountry?: string
  ) {
    const result = await sendMessage(
      currentRoomId, senderId, senderName, senderAvatar,
      senderRank, senderLevel, senderBadge, senderNameColor,
      text, replyTo, gift, senderFrame, senderCountry
    );
    setMessages(prev => [...prev, result.message]);
    return { flagged: result.flagged };
  }

  async function deleteMsg(roomId: string, messageId: string) {
    await deleteMessage(roomId, messageId);
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isDeleted: true, text: 'تم حذف هذه الرسالة' } : m
    ));
  }

  async function editMsg(roomId: string, messageId: string, newText: string) {
    await editMessage(roomId, messageId, newText);
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, text: newText, isEdited: true } : m
    ));
  }

  async function toggleMsgReaction(roomId: string, messageId: string, userId: string, emoji: string) {
    await toggleReaction(roomId, messageId, userId, emoji);
    // Reload messages to reflect updated reactions
    const updated = await getMessages(roomId);
    setMessages(updated);
  }

  return (
    <ChatContext.Provider value={{
      rooms,
      currentRoomId,
      messages,
      isLoadingMessages,
      setCurrentRoomId,
      loadMessages,
      sendChatMessage,
      deleteMsg,
      editMsg,
      toggleMsgReaction,
      refreshRooms,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
