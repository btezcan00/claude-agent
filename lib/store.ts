import { Signal } from '@/types/signal';
import { Folder } from '@/types/folder';
import { Organization } from '@/types/organization';
import { Address } from '@/types/address';
import { Person } from '@/types/person';
import { mockSignals } from '@/data/mock-signals';
import { mockFolders } from '@/data/mock-folders';
import { mockOrganizations } from '@/data/mock-organizations';
import { mockAddresses } from '@/data/mock-addresses';
import { mockPeople, mockBrpData } from '@/data/mock-people';

// In-memory data store
// Data persists during server runtime but resets on restart
// Uses global variable to survive hot module reloads in development

// Extend globalThis for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __store: Store | undefined;
}

class Store {
  private signals: Signal[] = [...mockSignals];
  private folders: Folder[] = [...mockFolders];
  private organizations: Organization[] = [...mockOrganizations];
  private addresses: Address[] = [...mockAddresses];
  private people: Person[] = [...mockPeople];
  private brpData: Person[] = [...mockBrpData];

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
        (o.description || '').toLowerCase().includes(q)
    );
  }

  // Addresses
  getAddresses(): Address[] {
    return this.addresses;
  }

  getAddressById(id: string): Address | undefined {
    return this.addresses.find((a) => a.id === id);
  }

  createAddress(address: Address): Address {
    this.addresses.unshift(address);
    return address;
  }

  updateAddress(id: string, data: Partial<Address>): Address | undefined {
    const index = this.addresses.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    this.addresses[index] = { ...this.addresses[index], ...data };
    return this.addresses[index];
  }

  deleteAddress(id: string): boolean {
    const index = this.addresses.findIndex((a) => a.id === id);
    if (index === -1) return false;
    this.addresses.splice(index, 1);
    return true;
  }

  searchAddresses(query: string): Address[] {
    if (!query.trim()) return this.addresses;
    const q = query.toLowerCase();
    return this.addresses.filter(
      (a) =>
        a.street.toLowerCase().includes(q) ||
        a.buildingType.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }

  // People
  getPeople(): Person[] {
    return this.people;
  }

  getPersonById(id: string): Person | undefined {
    return this.people.find((p) => p.id === id);
  }

  createPerson(person: Person): Person {
    this.people.unshift(person);
    return person;
  }

  updatePerson(id: string, data: Partial<Person>): Person | undefined {
    const index = this.people.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    this.people[index] = { ...this.people[index], ...data };
    return this.people[index];
  }

  deletePerson(id: string): boolean {
    const index = this.people.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.people.splice(index, 1);
    return true;
  }

  searchPeople(query: string): Person[] {
    if (!query.trim()) return this.people;
    const q = query.toLowerCase();
    return this.people.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.surname.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.bsn && p.bsn.includes(q))
    );
  }

  // BRP Data (for consult BRP functionality)
  searchBrp(params: {
    bsn?: string;
    surname?: string;
    firstName?: string;
    dateOfBirth?: string;
    street?: string;
    houseNumber?: string;
    zipCode?: string;
    municipality?: string;
  }): Person[] {
    const { bsn, surname, firstName, dateOfBirth, street, houseNumber, zipCode, municipality } = params;

    // BSN search
    if (bsn) {
      return this.brpData.filter((p) => p.bsn === bsn);
    }

    // Surname + date of birth
    if (surname && dateOfBirth) {
      return this.brpData.filter(
        (p) =>
          p.surname.toLowerCase() === surname.toLowerCase() &&
          p.dateOfBirth === dateOfBirth
      );
    }

    // Surname + first names + municipality
    if (surname && firstName && municipality) {
      return this.brpData.filter(
        (p) =>
          p.surname.toLowerCase() === surname.toLowerCase() &&
          p.firstName.toLowerCase().includes(firstName.toLowerCase()) &&
          p.address.toLowerCase().includes(municipality.toLowerCase())
      );
    }

    // House number + zip code
    if (houseNumber && zipCode) {
      const normalizedZip = zipCode.replace(/\s/g, '').toUpperCase();
      return this.brpData.filter((p) => {
        const addressParts = p.address.split(',');
        if (addressParts.length < 2) return false;
        const streetPart = addressParts[0];
        const zipPart = addressParts[1].trim().split(' ').slice(0, 2).join('').toUpperCase();
        return streetPart.includes(houseNumber) && zipPart.includes(normalizedZip.substring(0, 6));
      });
    }

    // Street + house number + municipality
    if (street && houseNumber && municipality) {
      return this.brpData.filter(
        (p) =>
          p.address.toLowerCase().includes(street.toLowerCase()) &&
          p.address.includes(houseNumber) &&
          p.address.toLowerCase().includes(municipality.toLowerCase())
      );
    }

    return [];
  }
}

// Export singleton instance that persists across hot module reloads
export const store = globalThis.__store ?? new Store();

// In development, preserve store across HMR
if (process.env.NODE_ENV !== 'production') {
  globalThis.__store = store;
}
