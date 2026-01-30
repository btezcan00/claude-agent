/**
 * Chat API Type Definitions
 */

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface AttachmentData {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    content?: string; // base64 encoded
    textContent?: string;
}

export interface SignalData {
    id: string;
    signalNumber: string;
    description: string;
    types: string[];
    placeOfObservation: string;
    locationDescription?: string;
    timeOfObservation: string;
    receivedBy: string;
    createdAt: string;
    updatedAt: string;
    notesCount: number;
    activitiesCount: number;
    photosCount: number;
    attachments?: AttachmentData[];
}

export interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    role: string;
    ownedFolderCount: number;
}

export interface FolderStatusDates {
    application?: string;
    research?: string;
    national_office?: string;
    decision?: string;
    archive?: string;
}

export interface FolderPractitioner {
    userId: string;
    userName: string;
    addedAt: string;
}

export interface FolderShare {
    userId: string;
    userName: string;
    accessLevel: string;
    sharedAt: string;
    sharedBy: string;
}

export interface FolderNote {
    id: string;
    content: string;
    createdAt: string;
    createdBy: string;
    createdByName: string;
    isAdminNote: boolean;
}

export interface FolderChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
}

export interface ApplicationCriterion {
    id: string;
    name: string;
    label: string;
    isMet: boolean;
    explanation: string;
}

export interface ApplicationData {
    explanation: string;
    criteria: ApplicationCriterion[];
    isCompleted: boolean;
    completedAt?: string;
    completedBy?: string;
}

export interface FolderItem {
    id: string;
    date: string;
    phase: string;
    label: string;
    description: string;
    assignedTo?: string;
    source?: string;
    sourceTheme?: string;
}

export interface FindingItem extends FolderItem {
    isCompleted: boolean;
    totalSteps?: number;
    completedSteps?: number;
    severity?: string;
}

export interface LetterItem {
    id: string;
    name: string;
    template: string;
    description: string;
    tags: string[];
    createdBy: string;
    createdByFirstName: string;
    createdBySurname: string;
    createdAt: string;
    updatedAt: string;
    fieldData: Record<string, string | boolean>;
}

export interface ActivityItem {
    id: string;
    date: string;
    phase: string;
    label: string;
    description: string;
    assignedTo?: string;
    source?: string;
    sourceTheme?: string;
    createdByName: string;
    updatedAt: string;
}

export interface FolderAttachment {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: string;
    description: string;
    tags: string[];
    content?: string;
    textContent?: string;
}

export interface OrganizationData {
    id: string;
    name: string;
    type: string;
    address: string;
    description?: string;
    chamberOfCommerce?: string;
}

export interface AddressData {
    id: string;
    street: string;
    buildingType: string;
    isActive: boolean;
    description: string;
}

export interface PersonData {
    id: string;
    firstName: string;
    surname: string;
    dateOfBirth?: string;
    address: string;
    description: string;
    bsn?: string;
}

export interface FolderData {
    id: string;
    name: string;
    description: string;
    createdById: string;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string | null;
    ownerName: string | null;
    color?: string;
    icon?: string;
    status: string;
    statusDates: FolderStatusDates;
    tags: string[];
    signalTypes: string[];
    practitioners: FolderPractitioner[];
    sharedWith: FolderShare[];
    location: string;
    notes: FolderNote[];
    organizations: OrganizationData[];
    addresses: AddressData[];
    peopleInvolved: PersonData[];
    letters: LetterItem[];
    findings: FindingItem[];
    attachments: FolderItem[];
    records: FolderItem[];
    communications: FolderItem[];
    suggestions: FolderItem[];
    visualizations: FolderItem[];
    activities: ActivityItem[];
    fileAttachments: FolderAttachment[];
    chatMessages: FolderChatMessage[];
    applicationData: ApplicationData;
    signalCount: number;
}

export interface CurrentUser {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    title: string;
    role: string;
}

export interface ApprovedPlan {
    summary: string;
    actions: Array<{
        step: number;
        action: string;
        tool: string;
        details?: Record<string, unknown>;
    }>;
}

export interface ChatRequestBody {
    messages: Message[];
    signals: SignalData[];
    folders: FolderData[];
    teamMembers: TeamMember[];
    currentUser?: CurrentUser | null;
    lastCreatedSignalId?: string | null;
    organizations?: OrganizationData[];
    addresses?: AddressData[];
    people?: PersonData[];
    stream?: boolean;
    approvedPlan?: ApprovedPlan | null;
}
