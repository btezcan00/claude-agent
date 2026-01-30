/**
 * Folder Workflows
 * 
 * Workflows for folder/case management:
 * - Create folder
 * - Assign team members
 * - Complete Bibob application
 */

import { WorkflowDefinition } from './types';

/**
 * Create a new folder
 */
export const createFolderWorkflow: WorkflowDefinition = {
    id: 'folder_create',
    name: 'Create Folder',
    description: 'Create a new case folder',
    version: '1.0.0',

    triggers: {
        keywords: ['create folder', 'new folder', 'new case', 'open folder'],
        intents: ['folder_creation'],
    },

    requiredInputs: [
        {
            field: 'name',
            type: 'string',
            description: 'Name of the folder',
        },
    ],

    optionalInputs: [
        {
            field: 'description',
            type: 'string',
            description: 'Folder description',
        },
        {
            field: 'signalIds',
            type: 'array',
            description: 'Signals to include in folder',
        },
        {
            field: 'color',
            type: 'string',
            description: 'Folder color (hex)',
        },
    ],

    requiresApprovalToStart: true,

    steps: [
        {
            id: 'create_folder',
            name: 'Create Folder',
            tool: 'folder_create',
            inputs: {
                name: '$inputs.name',
                description: '$inputs.description',
                signalIds: '$inputs.signalIds',
                color: '$inputs.color',
            },
            outputs: ['folderId', 'folderName'],
            hitl: {
                type: 'approval',
                message: 'Ready to create folder. Proceed?',
                required: true,
            },
        },
    ],

    category: 'folders',
    tags: ['create', 'folder'],
    estimatedDuration: '< 1 minute',
};

/**
 * Assign team to folder
 */
export const assignTeamWorkflow: WorkflowDefinition = {
    id: 'folder_assign_team',
    name: 'Assign Team to Folder',
    description: 'Assign owner and practitioners to a folder',
    version: '1.0.0',

    triggers: {
        keywords: ['assign team', 'add team', 'assign owner', 'add practitioner'],
        intents: ['team_assignment'],
    },

    requiredInputs: [
        {
            field: 'folderId',
            type: 'string',
            description: 'ID of the folder',
        },
    ],

    optionalInputs: [
        {
            field: 'ownerId',
            type: 'string',
            description: 'User ID for folder owner',
        },
        {
            field: 'practitionerIds',
            type: 'array',
            description: 'User IDs for practitioners',
        },
    ],

    requiresApprovalToStart: true,

    steps: [
        {
            id: 'assign_owner',
            name: 'Assign Owner',
            tool: 'folder_assign_owner',
            inputs: {
                folder_id: '$inputs.folderId',
                user_id: '$inputs.ownerId',
            },
            condition: {
                field: 'inputs.ownerId',
                operator: 'exists',
            },
            hitl: {
                type: 'approval',
                message: 'Assign this user as folder owner?',
                required: true,
            },
        },
        {
            id: 'add_practitioners',
            name: 'Add Practitioners',
            tool: 'folder_add_practitioner',
            inputs: {
                folder_id: '$inputs.folderId',
                user_ids: '$inputs.practitionerIds',
            },
            condition: {
                field: 'inputs.practitionerIds',
                operator: 'exists',
            },
            optional: true,
            hitl: {
                type: 'verification',
                message: 'Add these practitioners to the folder?',
                required: false,
            },
        },
    ],

    category: 'folders',
    tags: ['folder', 'team', 'assignment'],
    estimatedDuration: '< 1 minute',
};

/**
 * Complete Bibob Application
 */
export const completeBibobWorkflow: WorkflowDefinition = {
    id: 'bibob_complete',
    name: 'Complete Bibob Application',
    description: 'Complete the Bibob integrity assessment for a folder',
    version: '1.0.0',

    triggers: {
        keywords: ['complete bibob', 'bibob application', 'submit application', 'integrity assessment'],
        intents: ['bibob_completion'],
    },

    requiredInputs: [
        {
            field: 'folderId',
            type: 'string',
            description: 'ID of the folder',
        },
    ],

    optionalInputs: [
        {
            field: 'explanation',
            type: 'string',
            description: 'Explanation for the application',
        },
        {
            field: 'criteria',
            type: 'array',
            description: 'Criteria assessments',
        },
    ],

    requiresApprovalToStart: true,

    steps: [
        {
            id: 'review_criteria',
            name: 'Review Criteria',
            description: 'Show criteria for user review before submission',
            tool: 'folder_get_application_status',
            inputs: {
                folder_id: '$inputs.folderId',
            },
            outputs: ['currentStatus', 'pendingCriteria'],
            hitl: {
                type: 'review',
                message: 'Please review the current application status before proceeding.',
                required: false,
            },
        },
        {
            id: 'complete_application',
            name: 'Complete Application',
            tool: 'folder_submit_application',
            inputs: {
                folder_id: '$inputs.folderId',
                explanation: '$inputs.explanation',
                criteria: '$inputs.criteria',
            },
            outputs: ['applicationId', 'status'],
            hitl: {
                type: 'approval',
                message: 'Submit the Bibob application with these criteria? This action cannot be undone.',
                required: true,
            },
        },
    ],

    category: 'folders',
    tags: ['folder', 'bibob', 'application'],
    estimatedDuration: '1-2 minutes',
};

/**
 * Add content to folder (organizations, people, addresses, etc.)
 */
export const addFolderContentWorkflow: WorkflowDefinition = {
    id: 'folder_add_content',
    name: 'Add Content to Folder',
    description: 'Add organizations, people, addresses, or findings to a folder',
    version: '1.0.0',

    triggers: {
        keywords: ['add to folder', 'add organization', 'add person', 'add address', 'add finding'],
        intents: ['folder_content'],
    },

    requiredInputs: [
        {
            field: 'folderId',
            type: 'string',
            description: 'ID of the folder',
        },
        {
            field: 'contentType',
            type: 'string',
            description: 'Type of content to add',
            validation: {
                enum: ['organization', 'person', 'address', 'finding'],
            },
        },
        {
            field: 'contentId',
            type: 'string',
            description: 'ID of the content to add (or details for new)',
        },
    ],

    requiresApprovalToStart: true,

    steps: [
        {
            id: 'add_organization',
            name: 'Add Organization',
            tool: 'folder_add_organization',
            inputs: {
                folder_id: '$inputs.folderId',
                organization_id: '$inputs.contentId',
            },
            condition: {
                field: 'inputs.contentType',
                operator: 'equals',
                value: 'organization',
            },
            hitl: {
                type: 'approval',
                message: 'Add this organization to the folder?',
                required: true,
            },
        },
        {
            id: 'add_person',
            name: 'Add Person',
            tool: 'folder_add_person',
            inputs: {
                folder_id: '$inputs.folderId',
                person_id: '$inputs.contentId',
            },
            condition: {
                field: 'inputs.contentType',
                operator: 'equals',
                value: 'person',
            },
            hitl: {
                type: 'approval',
                message: 'Add this person to the folder?',
                required: true,
            },
        },
        {
            id: 'add_address',
            name: 'Add Address',
            tool: 'folder_add_address',
            inputs: {
                folder_id: '$inputs.folderId',
                address_id: '$inputs.contentId',
            },
            condition: {
                field: 'inputs.contentType',
                operator: 'equals',
                value: 'address',
            },
            hitl: {
                type: 'approval',
                message: 'Add this address to the folder?',
                required: true,
            },
        },
        {
            id: 'add_finding',
            name: 'Add Finding',
            tool: 'folder_add_finding',
            inputs: {
                folder_id: '$inputs.folderId',
                finding: '$inputs.contentId',
            },
            condition: {
                field: 'inputs.contentType',
                operator: 'equals',
                value: 'finding',
            },
            hitl: {
                type: 'approval',
                message: 'Add this finding to the folder?',
                required: true,
            },
        },
    ],

    category: 'folders',
    tags: ['folder', 'content'],
    estimatedDuration: '< 1 minute',
};

// Export all folder workflows
export const folderWorkflows = [
    createFolderWorkflow,
    assignTeamWorkflow,
    completeBibobWorkflow,
    addFolderContentWorkflow,
];
