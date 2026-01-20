'use client';

import { useState, useMemo } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { currentUser } from '@/data/mock-users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { ContactSidebar, Contact } from './communications/contact-sidebar';
import { ChatArea } from './communications/chat-area';
import { ChatInput } from './communications/chat-input';

interface FolderCommunicationsProps {
  folder: Folder;
}

export function FolderCommunications({ folder }: FolderCommunicationsProps) {
  const { addChatMessage } = useFolders();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const contacts = useMemo<Contact[]>(() => {
    const list: Contact[] = [];

    // Add practitioners
    (folder.practitioners || []).forEach((p) => {
      list.push({
        id: `practitioner-${p.userId}`,
        name: p.userName,
        type: 'practitioner',
      });
    });

    // Add shared users
    (folder.sharedWith || []).forEach((s) => {
      list.push({
        id: `shared-${s.userId}`,
        name: s.userName,
        type: 'shared_user',
      });
    });

    // Add organizations
    (folder.organizations || []).forEach((o) => {
      list.push({
        id: `org-${o.id}`,
        name: o.name,
        type: 'organization',
      });
    });

    return list;
  }, [folder.practitioners, folder.sharedWith, folder.organizations]);

  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId) || null;
  }, [contacts, selectedContactId]);

  const handleSendMessage = async (content: string) => {
    if (!selectedContactId) return;

    await addChatMessage(folder.id, {
      conversationId: selectedContactId,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      content,
    });
  };

  return (
    <Card className="h-[500px]">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <MessageSquare className="h-4 w-4" />
          Communications
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-49px)]">
        <div className="flex h-full">
          <ContactSidebar
            contacts={contacts}
            selectedId={selectedContactId}
            onSelect={setSelectedContactId}
          />
          <div className="flex-1 flex flex-col">
            <ChatArea
              messages={folder.chatMessages || []}
              selectedContactId={selectedContactId}
              selectedContactName={selectedContact?.name || null}
            />
            <ChatInput
              onSend={handleSendMessage}
              disabled={!selectedContactId}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
