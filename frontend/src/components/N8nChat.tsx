import { useEffect } from 'react';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

export default function N8nChat() {
  useEffect(() => {
    createChat({
      webhookUrl: import.meta.env.VITE_N8N_CHAT_URL,
      webhookConfig: {
        method: 'POST',
        headers: {}
      },
      chatInputKey: 'chatInput',
      chatSessionKey: 'sessionId',
      metadata: {},
      showWelcomeScreen: false,
      defaultLanguage: 'en',
      initialMessages: [
        'Hi there! 👋',
        'I\'m your Grejoy China Market AI assistant. How can I help you today?'
      ],
      i18n: {
        en: {
          title: 'Grejoy China Market Support',
          subtitle: 'Ask us anything',
          footer: '',
          getStarted: 'Start Chat',
          inputPlaceholder: 'Type your message...',
          closeButtonTooltip: 'Close chat',
        }
      },
      theme: {
        primaryColor: '#667eea',
      }
    });
  }, []);

  return null; // Widget is injected into DOM automatically
}