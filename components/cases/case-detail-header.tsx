'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Case } from '@/types/case';
import { CASE_COLORS } from '@/types/case';
import { useCases } from '@/context/case-context';
import { useUsers } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Trash2, FolderOpen, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseDetailHeaderProps {
  caseItem: Case;
  onDelete: () => void;
}

export function CaseDetailHeader({
  caseItem,
  onDelete,
}: CaseDetailHeaderProps) {
  const { getSignalCountForCase, updateCase, assignCaseOwner, unassignCaseOwner } = useCases();
  const { users, getUserFullName } = useUsers();
  const signalCount = getSignalCountForCase(caseItem.id);

  // Inline editing state
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameValue, setNameValue] = useState(caseItem.name);
  const [descriptionValue, setDescriptionValue] = useState(caseItem.description);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync values when case changes
  useEffect(() => {
    setNameValue(caseItem.name);
    setDescriptionValue(caseItem.description);
  }, [caseItem.name, caseItem.description]);

  // Auto-focus inputs when editing
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [editingDescription]);

  // Save handlers
  const saveName = async () => {
    if (nameValue.trim() && nameValue !== caseItem.name) {
      await updateCase(caseItem.id, { name: nameValue.trim() });
    } else {
      setNameValue(caseItem.name);
    }
    setEditingName(false);
  };

  const saveDescription = async () => {
    if (descriptionValue !== caseItem.description) {
      await updateCase(caseItem.id, { description: descriptionValue });
    }
    setEditingDescription(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    } else if (e.key === 'Escape') {
      setNameValue(caseItem.name);
      setEditingName(false);
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveDescription();
    } else if (e.key === 'Escape') {
      setDescriptionValue(caseItem.description);
      setEditingDescription(false);
    }
  };

  const handleOwnerChange = async (userId: string | null) => {
    if (userId === null) {
      await unassignCaseOwner(caseItem.id);
    } else {
      const user = users.find(u => u.id === userId);
      if (user) {
        await assignCaseOwner(caseItem.id, userId, getUserFullName(user));
      }
    }
  };

  const handleColorChange = async (color: string | undefined) => {
    await updateCase(caseItem.id, { color });
  };

  return (
    <div className="space-y-4">
      {/* Back Navigation */}
      <Link
        href="/dossiers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar Dossiers
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Color Picker on Case Icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                style={{
                  backgroundColor: caseItem.color ? `${caseItem.color}20` : 'hsl(var(--muted))',
                  color: caseItem.color || 'hsl(var(--muted-foreground))',
                }}
              >
                <FolderOpen className="w-7 h-7" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="p-3">
              <div className="grid grid-cols-4 gap-2">
                {CASE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110',
                      caseItem.color === color.value && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  >
                    {caseItem.color === color.value && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <DropdownMenuSeparator className="my-2" />
              <button
                onClick={() => handleColorChange(undefined)}
                className={cn(
                  'w-full px-2 py-1.5 text-sm rounded flex items-center gap-2 hover:bg-muted transition-colors',
                  !caseItem.color && 'bg-muted'
                )}
              >
                <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground" />
                Geen kleur
              </button>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="space-y-1 flex-1 min-w-0">
            {/* Editable Name */}
            {editingName ? (
              <Input
                ref={nameInputRef}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={handleNameKeyDown}
                className="text-2xl font-bold h-auto py-0 px-1 -mx-1"
              />
            ) : (
              <h1
                onClick={() => setEditingName(true)}
                className="text-2xl font-bold tracking-tight cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
              >
                {caseItem.name}
              </h1>
            )}

            {/* Editable Description */}
            {editingDescription ? (
              <Textarea
                ref={descriptionInputRef}
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                onBlur={saveDescription}
                onKeyDown={handleDescriptionKeyDown}
                rows={2}
                className="text-sm text-muted-foreground resize-none px-2 py-1 -mx-2 -my-1"
                placeholder="Voeg een omschrijving toe..."
              />
            ) : (
              <p
                onClick={() => setEditingDescription(true)}
                className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[1.5rem]"
              >
                {caseItem.description || 'Voeg een omschrijving toe...'}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>{signalCount} {signalCount === 1 ? 'melding' : 'meldingen'}</span>

              {/* Owner Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors">
                    {caseItem.ownerName ? (
                      <>
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {caseItem.ownerName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>Eigenaar: {caseItem.ownerName}</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        <span>Geen eigenaar</span>
                      </>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => handleOwnerChange(null)}
                    className={cn(!caseItem.ownerId && 'bg-muted')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Geen eigenaar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {users.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => handleOwnerChange(user.id)}
                      className={cn(caseItem.ownerId === user.id && 'bg-muted')}
                    >
                      <Avatar className="w-5 h-5 mr-2">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {getUserFullName(user)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Actions - Only Delete button remains */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
