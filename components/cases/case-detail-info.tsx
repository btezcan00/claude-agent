'use client';

import { useState } from 'react';
import { Case, CASE_ACCESS_LEVELS } from '@/types/case';
import { useCases } from '@/context/case-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/date-utils';
import {
  FileText,
  MapPin,
  Tag,
  Users,
  Share2,
  Plus,
  X,
  User,
} from 'lucide-react';
import { mockUsers } from '@/data/mock-users';

interface CaseDetailInfoProps {
  caseItem: Case;
}

export function CaseDetailInfo({ caseItem }: CaseDetailInfoProps) {
  const {
    addTag,
    removeTag,
    updateLocation,
    addPractitioner,
    removePractitioner,
    shareCase,
    updateShareAccess,
    removeShare,
  } = useCases();

  const [newTag, setNewTag] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState(caseItem.location || '');

  const tags = caseItem.tags || [];
  const practitioners = caseItem.practitioners || [];
  const sharedWith = caseItem.sharedWith || [];

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(caseItem.id, newTag.trim().toLowerCase());
      setNewTag('');
    }
  };

  const handleSaveLocation = () => {
    updateLocation(caseItem.id, locationValue);
    setEditingLocation(false);
  };

  const availableUsersForPractitioners = mockUsers.filter(
    (u) => !practitioners.some((p) => p.userId === u.id)
  );

  const availableUsersForSharing = mockUsers.filter(
    (u) => !sharedWith.some((s) => s.userId === u.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Dossier Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Locatie
          </h4>
          {editingLocation ? (
            <div className="flex gap-2">
              <Input
                value={locationValue}
                onChange={(e) => setLocationValue(e.target.value)}
                placeholder="Locatie invoeren"
                className="flex-1"
              />
              <Button size="sm" onClick={handleSaveLocation}>Opslaan</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingLocation(false)}>Annuleren</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {caseItem.location || 'Geen locatie ingesteld'}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setLocationValue(caseItem.location || '');
                  setEditingLocation(true);
                }}
              >
                Bewerken
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Tags */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Labels
          </h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen labels</p>
            ) : (
              tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(caseItem.id, tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Label toevoegen"
              className="w-40"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button size="sm" variant="outline" onClick={handleAddTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Practitioners */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Behandelaars
          </h4>
          <div className="space-y-2">
            {practitioners.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen behandelaars toegewezen</p>
            ) : (
              practitioners.map((p) => (
                <div key={p.userId} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[10px]">
                        {p.userName.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{p.userName}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => removePractitioner(caseItem.id, p.userId)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
            {availableUsersForPractitioners.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Behandelaar Toevoegen
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableUsersForPractitioners.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => addPractitioner(caseItem.id, user.id, `${user.firstName} ${user.lastName}`)}
                    >
                      {user.firstName} {user.lastName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <Separator />

        {/* Shared With */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Gedeeld Met
          </h4>
          <div className="space-y-2">
            {sharedWith.length === 0 ? (
              <p className="text-sm text-muted-foreground">Met niemand gedeeld</p>
            ) : (
              sharedWith.map((s) => (
                <div key={s.userId} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[10px]">
                        {s.userName.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm">{s.userName}</span>
                      <p className="text-xs text-muted-foreground">
                        Shared by {s.sharedBy} - {formatRelativeTime(s.sharedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={s.accessLevel}
                      onValueChange={(value) => updateShareAccess(caseItem.id, s.userId, value as typeof s.accessLevel)}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CASE_ACCESS_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeShare(caseItem.id, s.userId)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            {availableUsersForSharing.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Delen met Gebruiker
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableUsersForSharing.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => shareCase(caseItem.id, user.id, `${user.firstName} ${user.lastName}`, 'view')}
                    >
                      {user.firstName} {user.lastName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Owner */}
        <Separator />
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Eigenaar
          </h4>
          {caseItem.ownerName ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px]">
                  {caseItem.ownerName.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{caseItem.ownerName}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Geen eigenaar toegewezen</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
