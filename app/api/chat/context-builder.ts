/**
 * Chat API - Data Context Builder
 * 
 * Builds summaries of current data for the AI context
 */

import {
    SignalData,
    FolderData,
    TeamMember,
    OrganizationData,
    AddressData,
    PersonData,
    CurrentUser,
} from './types';

export interface DataContext {
    signalSummary: string;
    folderSummary: string;
    teamSummary: string;
    organizationsSummary: string;
    addressesSummary: string;
    peopleSummary: string;
    signalCount: number;
    folderCount: number;
}

/**
 * Build data context summaries for AI prompt
 */
export function buildDataContext(
    signals: SignalData[],
    folders: FolderData[],
    teamMembers: TeamMember[],
    organizations: OrganizationData[],
    addresses: AddressData[],
    people: PersonData[]
): DataContext {
    const signalSummary = (signals || [])
        .map(
            (s) =>
                `- ${s.signalNumber}: ${s.placeOfObservation} (${s.types.join(', ')}, received by: ${s.receivedBy})`
        )
        .join('\n');

    const folderSummary = (folders || [])
        .map((f) => {
            const practitionerNames = (f.practitioners || []).map((p) => p.userName).join(', ');
            const sharedNames = (f.sharedWith || []).map((s) => `${s.userName} (${s.accessLevel})`).join(', ');
            const orgNames = (f.organizations || []).map((o) => o.name).join(', ');
            const peopleNames = (f.peopleInvolved || []).map((p) => `${p.firstName} ${p.surname}`).join(', ');
            return `- ${f.name} (${f.id}): ${f.description} (status: ${f.status}, location: ${f.location || 'none'}, ${f.signalCount} signals, owner: ${f.ownerName || 'none'}, practitioners: ${practitionerNames || 'none'}, shared with: ${sharedNames || 'none'}, organizations: ${orgNames || 'none'}, people involved: ${peopleNames || 'none'})`;
        })
        .join('\n');

    const teamSummary = (teamMembers || [])
        .map(
            (m) =>
                `- ${m.firstName} ${m.lastName} (${m.id}): ${m.title} - owns ${m.ownedFolderCount} folder(s)`
        )
        .join('\n');

    const organizationsSummary = (organizations || [])
        .map(
            (o) =>
                `- ${o.name} (${o.id}): ${o.type}, ${o.address}${o.chamberOfCommerce ? `, KVK: ${o.chamberOfCommerce}` : ''}`
        )
        .join('\n');

    const addressesSummary = (addresses || [])
        .map(
            (a) =>
                `- ${a.street} (${a.id}): ${a.buildingType}, ${a.isActive ? 'Active' : 'Inactive'}${a.description && a.description !== '-' ? `, ${a.description}` : ''}`
        )
        .join('\n');

    const peopleSummary = (people || [])
        .map(
            (p) =>
                `- ${p.firstName} ${p.surname} (${p.id}): ${p.address}${p.description ? `, ${p.description}` : ''}`
        )
        .join('\n');

    return {
        signalSummary,
        folderSummary,
        teamSummary,
        organizationsSummary,
        addressesSummary,
        peopleSummary,
        signalCount: (signals || []).length,
        folderCount: (folders || []).length,
    };
}

/**
 * Format current user info for prompt
 */
export function formatCurrentUser(currentUser?: CurrentUser | null): string {
    if (!currentUser) return 'Unknown';
    return `${currentUser.fullName} (${currentUser.id}) - "${currentUser.id}" and "${currentUser.fullName}" for tool calls`;
}
