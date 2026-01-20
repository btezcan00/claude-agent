import { Signal } from '@/types/signal';
import { Folder } from '@/types/folder';
import { Organization } from '@/types/organization';
import { mockSignals } from '@/data/mock-signals';
import { mockFolders } from '@/data/mock-folders';
import { mockOrganizations } from '@/data/mock-organizations';

// In-memory data store
// Data persists during server runtime but resets on restart

class Store {
  private signals: Signal[] = [...mockSignals];
  private folders: Folder[] = [...mockFolders];
  private organizations: Organization[] = [...mockOrganizations];

  // Signals
  getSignals(): Signal[] {
    return this.signals;
  }

  getSignalById(id: string): Signal | undefined {
    return this.signals.find((s) => s.id === id);
  }

  createSignal(signal: Signal): Signal {
    this.signals.unshift(signal);
    return signal;
  }

  updateSignal(id: string, data: Partial<Signal>): Signal | undefined {
    const index = this.signals.findIndex((s) => s.id === id);
    if (index === -1) return undefined;
    this.signals[index] = { ...this.signals[index], ...data };
    return this.signals[index];
  }

  deleteSignal(id: string): boolean {
    const index = this.signals.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.signals.splice(index, 1);
    return true;
  }

  // Folders
  getFolders(): Folder[] {
    return this.folders;
  }

  getFolderById(id: string): Folder | undefined {
    return this.folders.find((f) => f.id === id);
  }

  createFolder(folder: Folder): Folder {
    this.folders.unshift(folder);
    return folder;
  }

  updateFolder(id: string, data: Partial<Folder>): Folder | undefined {
    const index = this.folders.findIndex((f) => f.id === id);
    if (index === -1) return undefined;
    this.folders[index] = { ...this.folders[index], ...data };
    return this.folders[index];
  }

  deleteFolder(id: string): boolean {
    const index = this.folders.findIndex((f) => f.id === id);
    if (index === -1) return false;
    this.folders.splice(index, 1);
    return true;
  }

  // Helper: Remove signal from folder
  removeSignalFromFolder(signalId: string, folderId: string): Signal | undefined {
    const signal = this.getSignalById(signalId);
    if (!signal) return undefined;

    const updatedRelations = signal.folderRelations.filter((fr) => fr.folderId !== folderId);
    return this.updateSignal(signalId, {
      folderRelations: updatedRelations,
      updatedAt: new Date().toISOString()
    });
  }

  // Organizations
  getOrganizations(): Organization[] {
    return this.organizations;
  }

  getOrganizationById(id: string): Organization | undefined {
    return this.organizations.find((o) => o.id === id);
  }

  createOrganization(organization: Organization): Organization {
    this.organizations.unshift(organization);
    return organization;
  }

  updateOrganization(id: string, data: Partial<Organization>): Organization | undefined {
    const index = this.organizations.findIndex((o) => o.id === id);
    if (index === -1) return undefined;
    this.organizations[index] = { ...this.organizations[index], ...data };
    return this.organizations[index];
  }

  deleteOrganization(id: string): boolean {
    const index = this.organizations.findIndex((o) => o.id === id);
    if (index === -1) return false;
    this.organizations.splice(index, 1);
    return true;
  }

  searchOrganizations(query: string): Organization[] {
    if (!query.trim()) return this.organizations;
    const q = query.toLowerCase();
    return this.organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.type.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
    );
  }
}

// Export singleton instance
export const store = new Store();
