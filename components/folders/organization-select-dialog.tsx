'use client';

import { useState, useMemo } from 'react';
import { Organization } from '@/types/organization';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2 } from 'lucide-react';

interface OrganizationSelectDialogProps {
  open: boolean;
  onClose: () => void;
  organizations: Organization[];
  onConfirm: (selectedOrganizations: Organization[]) => void;
  title?: string;
  description?: string;
}

const PAGE_SIZE = 5;

export function OrganizationSelectDialog({
  open,
  onClose,
  organizations,
  onConfirm,
  title = 'Select Organizations',
  description = 'Choose the correct organizations from the search results.',
}: OrganizationSelectDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Get visible organizations for pagination
  const visibleOrganizations = useMemo(() => {
    return organizations.slice(0, visibleCount);
  }, [organizations, visibleCount]);

  const hasMore = visibleCount < organizations.length;

  const handleToggleOrganization = (orgId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const handleConfirm = () => {
    const selectedOrgs = organizations.filter((org) => selectedIds.has(org.id));
    onConfirm(selectedOrgs);
    handleClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setVisibleCount(PAGE_SIZE);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Organization List */}
        <div className="flex-1 -mx-6 px-6 overflow-y-auto min-h-[200px]">
          {organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No organizations found</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {visibleOrganizations.map((org) => {
                const isSelected = selectedIds.has(org.id);

                return (
                  <div
                    key={org.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    onClick={() => handleToggleOrganization(org.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleOrganization(org.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{org.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({org.type})
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {org.address || 'No address'}
                      </p>
                      {org.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={handleLoadMore}
                >
                  Load more ({organizations.length - visibleCount} remaining)
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            Confirm {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
