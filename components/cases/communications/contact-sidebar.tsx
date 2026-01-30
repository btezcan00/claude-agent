'use client';

import { cn } from '@/lib/utils';
import { User, Users, Building2 } from 'lucide-react';

export interface Contact {
  id: string;
  name: string;
  type: 'practitioner' | 'shared_user' | 'organization';
}

interface ContactSidebarProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (contactId: string) => void;
}

export function ContactSidebar({ contacts, selectedId, onSelect }: ContactSidebarProps) {
  const getIcon = (type: Contact['type']) => {
    switch (type) {
      case 'practitioner':
        return User;
      case 'shared_user':
        return Users;
      case 'organization':
        return Building2;
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="w-[200px] border-r flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          No contacts available
        </p>
      </div>
    );
  }

  return (
    <div className="w-[200px] border-r overflow-y-auto">
      {contacts.map((contact) => {
        const Icon = getIcon(contact.type);
        const isSelected = selectedId === contact.id;

        return (
          <button
            key={contact.id}
            onClick={() => onSelect(contact.id)}
            className={cn(
              'w-full px-3 py-3 flex items-center gap-2 text-left transition-colors',
              'hover:bg-muted/50',
              isSelected && 'bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <p className={cn(
              'text-sm font-medium truncate',
              isSelected ? 'text-white' : 'text-foreground'
            )}>
              {contact.name}
            </p>
          </button>
        );
      })}
    </div>
  );
}
