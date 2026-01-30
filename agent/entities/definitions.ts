/**
 * Entity Definitions
 * 
 * Define the lifecycle of each entity type.
 * This is the single source of truth for entity states and transitions.
 */

import { EntityDefinition } from './types';

/**
 * Signal Entity Definition
 */
export const signalDefinition: EntityDefinition = {
    type: 'signal',
    name: 'Signal',
    description: 'A report of suspicious activity that may require investigation',

    fields: [
        { name: 'description', required: true, description: 'What was observed', type: 'string' },
        { name: 'types', required: true, description: 'Type of suspicious activity', type: 'array', enumValues: ['human-trafficking', 'drug-trafficking', 'fraud', 'money-laundering', 'bogus-scheme', 'other'] },
        { name: 'placeOfObservation', required: true, description: 'Where it was observed', type: 'string' },
        { name: 'timeOfObservation', required: false, description: 'When it was observed', type: 'date' },
        { name: 'receivedBy', required: false, description: 'How the signal was received', type: 'enum', enumValues: ['police', 'anonymous-report', 'municipal-department', 'bibob-request', 'other'] },
        { name: 'notes', required: false, description: 'Additional notes', type: 'array' },
        { name: 'attachments', required: false, description: 'Supporting documents', type: 'array' },
    ],

    states: [
        { id: 'draft', name: 'Draft', description: 'Signal is being created, missing required info' },
        { id: 'complete', name: 'Complete', description: 'All required info provided, ready for review' },
        { id: 'in_folder', name: 'In Folder', description: 'Signal has been added to a case folder' },
        { id: 'archived', name: 'Archived', description: 'Signal has been archived', isTerminal: true },
        { id: 'deleted', name: 'Deleted', description: 'Signal has been deleted', isTerminal: true },
    ],

    transitions: [
        { from: 'draft', to: 'complete', action: 'signal_update', description: 'Complete the signal by filling required fields', conditions: ['description.notEmpty', 'types.notEmpty', 'placeOfObservation.notEmpty'] },
        { from: 'complete', to: 'in_folder', action: 'signal_add_to_folder', description: 'Add signal to a case folder' },
        { from: 'complete', to: 'archived', action: 'signal_archive', description: 'Archive the signal' },
        { from: 'in_folder', to: 'archived', action: 'signal_archive', description: 'Archive the signal' },
        { from: 'draft', to: 'deleted', action: 'signal_delete', description: 'Delete the draft signal', requiresHITL: true },
        { from: 'complete', to: 'deleted', action: 'signal_delete', description: 'Delete the signal', requiresHITL: true },
        { from: 'archived', to: 'complete', action: 'signal_restore', description: 'Restore archived signal' },
    ],

    initialState: 'draft',
};

/**
 * Folder Entity Definition
 */
export const folderDefinition: EntityDefinition = {
    type: 'folder',
    name: 'Folder',
    description: 'A case folder that groups signals and related information for investigation',

    fields: [
        { name: 'name', required: true, description: 'Folder name', type: 'string' },
        { name: 'description', required: false, description: 'Folder description', type: 'string' },
        { name: 'signals', required: false, description: 'Linked signals', type: 'array', referenceType: 'signal' },
        { name: 'owner', required: false, description: 'Assigned owner', type: 'reference' },
        { name: 'practitioners', required: false, description: 'Team members', type: 'array' },
        { name: 'organizations', required: false, description: 'Related organizations', type: 'array' },
        { name: 'people', required: false, description: 'Related people', type: 'array' },
        { name: 'addresses', required: false, description: 'Related addresses', type: 'array' },
        { name: 'findings', required: false, description: 'Investigation findings', type: 'array' },
    ],

    states: [
        { id: 'empty', name: 'Empty', description: 'Folder created but has no signals' },
        { id: 'has_signals', name: 'Has Signals', description: 'Folder contains signals' },
        { id: 'assigned', name: 'Assigned', description: 'Folder has an owner assigned' },
        { id: 'investigating', name: 'Under Investigation', description: 'Active investigation in progress' },
        { id: 'pending_application', name: 'Pending Application', description: 'Waiting for Bibob application' },
        { id: 'application_submitted', name: 'Application Submitted', description: 'Bibob application has been submitted' },
        { id: 'closed', name: 'Closed', description: 'Investigation closed', isTerminal: true },
        { id: 'deleted', name: 'Deleted', description: 'Folder deleted', isTerminal: true },
    ],

    transitions: [
        { from: 'empty', to: 'has_signals', action: 'folder_add_signal', description: 'Add a signal to the folder' },
        { from: 'empty', to: 'assigned', action: 'folder_assign_owner', description: 'Assign an owner' },
        { from: 'has_signals', to: 'assigned', action: 'folder_assign_owner', description: 'Assign an owner' },
        { from: 'assigned', to: 'investigating', action: 'folder_start_investigation', description: 'Start the investigation' },
        { from: 'investigating', to: 'pending_application', action: 'folder_request_application', description: 'Request Bibob application' },
        { from: 'pending_application', to: 'application_submitted', action: 'folder_submit_application', description: 'Submit Bibob application', requiresHITL: true },
        { from: 'investigating', to: 'closed', action: 'folder_close', description: 'Close the investigation', requiresHITL: true },
        { from: 'application_submitted', to: 'closed', action: 'folder_close', description: 'Close after application review', requiresHITL: true },
        { from: 'empty', to: 'deleted', action: 'folder_delete', description: 'Delete empty folder', requiresHITL: true },
        { from: 'has_signals', to: 'deleted', action: 'folder_delete', description: 'Delete folder with signals', requiresHITL: true },
    ],

    initialState: 'empty',
};

/**
 * Bibob Application Entity Definition
 */
export const applicationDefinition: EntityDefinition = {
    type: 'application',
    name: 'Bibob Application',
    description: 'An integrity assessment application for a case folder',

    fields: [
        { name: 'folderId', required: true, description: 'Associated folder', type: 'reference', referenceType: 'folder' },
        { name: 'explanation', required: true, description: 'Application explanation', type: 'string' },
        { name: 'criteria', required: true, description: 'Assessment criteria', type: 'array' },
        { name: 'submittedBy', required: false, description: 'Who submitted', type: 'reference' },
        { name: 'submittedAt', required: false, description: 'When submitted', type: 'date' },
    ],

    states: [
        { id: 'draft', name: 'Draft', description: 'Application is being prepared' },
        { id: 'ready', name: 'Ready', description: 'All criteria assessed, ready to submit' },
        { id: 'submitted', name: 'Submitted', description: 'Application submitted for review', isTerminal: true },
    ],

    transitions: [
        { from: 'draft', to: 'ready', action: 'application_complete_criteria', description: 'Complete all criteria assessments', conditions: ['criteria.notEmpty', 'explanation.notEmpty'] },
        { from: 'ready', to: 'submitted', action: 'application_submit', description: 'Submit the application', requiresHITL: true },
    ],

    initialState: 'draft',
};

/**
 * All entity definitions
 */
export const entityDefinitions: EntityDefinition[] = [
    signalDefinition,
    folderDefinition,
    applicationDefinition,
];

/**
 * Get definition by type
 */
export function getEntityDefinition(type: string): EntityDefinition | undefined {
    return entityDefinitions.find(d => d.type === type);
}
