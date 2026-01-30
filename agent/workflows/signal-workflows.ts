/**
 * Signal Workflows
 * 
 * Workflows related to signal management:
 * - Create signal
 * - Signal to folder
 * - Signal to full investigation (signal → folder → bibob)
 */

import { WorkflowDefinition } from './types';

/**
 * Create a new signal
 */
export const createSignalWorkflow: WorkflowDefinition = {
    id: 'signal_create',
    name: 'Create Signal',
    description: 'Create a new signal report in the system',
    version: '1.0.0',

    triggers: {
        keywords: ['create signal', 'new signal', 'report signal', 'add signal'],
        intents: ['signal_creation'],
    },

    requiredInputs: [
        {
            field: 'description',
            type: 'string',
            description: 'Description of the suspicious activity',
        },
        {
            field: 'types',
            type: 'array',
            description: 'Type(s) of signal',
            validation: {
                enum: ['human-trafficking', 'drug-trafficking', 'fraud', 'money-laundering', 'bogus-scheme', 'other'],
            },
        },
        {
            field: 'placeOfObservation',
            type: 'string',
            description: 'Location where the activity was observed',
        },
    ],

    optionalInputs: [
        {
            field: 'receivedBy',
            type: 'string',
            description: 'How the signal was received',
            default: 'municipal-department',
        },
        {
            field: 'timeOfObservation',
            type: 'string',
            description: 'When the observation was made',
        },
    ],

    requiresApprovalToStart: true,

    steps: [
        {
            id: 'create_signal',
            name: 'Create Signal',
            tool: 'signal_create',
            inputs: {
                description: '$inputs.description',
                types: '$inputs.types',
                placeOfObservation: '$inputs.placeOfObservation',
                receivedBy: '$inputs.receivedBy',
                timeOfObservation: '$inputs.timeOfObservation',
            },
            outputs: ['signalId', 'signalNumber'],
            hitl: {
                type: 'approval',
                message: 'Ready to create signal with the provided information. Proceed?',
                required: true,
            },
        },
    ],

    category: 'signals',
    tags: ['create', 'signal'],
    estimatedDuration: '< 1 minute',
};

/**
 * Create folder from existing signal
 */
export const signalToFolderWorkflow: WorkflowDefinition = {
    id: 'signal_to_folder',
    name: 'Create Folder from Signal',
    description: 'Create a case folder from an existing signal',
    version: '1.0.0',

    triggers: {
        keywords: ['folder from signal', 'create folder from', 'make folder', 'open case'],
        intents: ['folder_from_signal'],
    },

    requiredInputs: [
        {
            field: 'signalId',
            type: 'string',
            description: 'ID of the signal to create folder from',
        },
    ],

    optionalInputs: [
        {
            field: 'folderName',
            type: 'string',
            description: 'Name for the folder',
        },
        {
            field: 'assignOwner',
            type: 'string',
            description: 'User ID to assign as owner',
        },
    ],

    requiresApprovalToStart: true,

    steps: [
        {
            id: 'create_folder',
            name: 'Create Folder',
            tool: 'folder_create',
            inputs: {
                name: '$inputs.folderName',
                signalIds: ['$inputs.signalId'],
            },
            outputs: ['folderId', 'folderName'],
            hitl: {
                type: 'approval',
                message: 'Ready to create a folder from this signal. Proceed?',
                required: true,
            },
        },
        {
            id: 'assign_owner',
            name: 'Assign Owner',
            tool: 'folder_assign_owner',
            inputs: {
                folder_id: '$create_folder.folderId',
                user_id: '$inputs.assignOwner',
            },
            condition: {
                field: 'inputs.assignOwner',
                operator: 'exists',
            },
            optional: true,
        },
    ],

    category: 'folders',
    tags: ['create', 'folder', 'signal'],
    estimatedDuration: '< 1 minute',
};

/**
 * Full investigation workflow: Signal → Folder → Bibob Application
 */
export const fullInvestigationWorkflow: WorkflowDefinition = {
    id: 'full_investigation',
    name: 'Full Investigation Setup',
    description: 'Create a complete investigation: signal, folder, and Bibob application',
    version: '1.0.0',

    triggers: {
        keywords: [
            'full investigation',
            'complete setup',
            'signal folder bibob',
            'start investigation',
        ],
        intents: ['full_investigation'],
        explicit: true, // Only trigger if user explicitly asks for this
    },

    requiredInputs: [
        {
            field: 'description',
            type: 'string',
            description: 'Description of the suspicious activity',
        },
        {
            field: 'types',
            type: 'array',
            description: 'Type(s) of signal',
            validation: {
                enum: ['human-trafficking', 'drug-trafficking', 'fraud', 'money-laundering', 'bogus-scheme', 'other'],
            },
        },
        {
            field: 'placeOfObservation',
            type: 'string',
            description: 'Location where the activity was observed',
        },
    ],

    optionalInputs: [
        {
            field: 'folderName',
            type: 'string',
            description: 'Name for the case folder',
        },
        {
            field: 'completeBibob',
            type: 'boolean',
            description: 'Whether to complete the Bibob application',
            default: true,
        },
    ],

    requiresApprovalToStart: true,

    steps: [
        // Step 1: Create Signal
        {
            id: 'create_signal',
            name: 'Create Signal',
            description: 'Create the initial signal report',
            tool: 'signal_create',
            inputs: {
                description: '$inputs.description',
                types: '$inputs.types',
                placeOfObservation: '$inputs.placeOfObservation',
                receivedBy: 'municipal-department',
            },
            outputs: ['signalId', 'signalNumber'],
            hitl: {
                type: 'approval',
                message: 'Step 1/3: Create signal report. Proceed?',
                required: true,
            },
        },

        // Step 2: Create Folder
        {
            id: 'create_folder',
            name: 'Create Case Folder',
            description: 'Create a folder and link the signal',
            tool: 'folder_create',
            inputs: {
                name: '$inputs.folderName',
                signalIds: ['$create_signal.signalId'],
            },
            outputs: ['folderId', 'folderName'],
            hitl: {
                type: 'verification',
                message: 'Step 2/3: Signal created (${create_signal.signalNumber}). Create folder?',
                required: true,
            },
        },

        // Step 3: Complete Bibob Application
        {
            id: 'complete_bibob',
            name: 'Complete Bibob Application',
            description: 'Submit the Bibob integrity assessment application',
            tool: 'folder_submit_application',
            inputs: {
                folder_id: '$create_folder.folderId',
                explanation: 'Application submitted via automated workflow',
                criteria: [
                    { id: 'necessary_info', isMet: true, explanation: 'Information provided' },
                    { id: 'annual_accounts', isMet: true, explanation: 'To be verified' },
                    { id: 'budgets', isMet: true, explanation: 'To be reviewed' },
                    { id: 'loan_agreement', isMet: true, explanation: 'To be verified' },
                ],
            },
            outputs: ['applicationId', 'status'],
            condition: {
                field: 'inputs.completeBibob',
                operator: 'equals',
                value: true,
            },
            hitl: {
                type: 'approval',
                message: 'Step 3/3: Folder created. Complete Bibob application?',
                required: true,
            },
        },
    ],

    requiresApprovalToComplete: false, // Summary only

    category: 'investigation',
    tags: ['signal', 'folder', 'bibob', 'full-workflow'],
    estimatedDuration: '2-3 minutes',
};

/**
 * Add signal to existing folder
 */
export const addSignalToFolderWorkflow: WorkflowDefinition = {
    id: 'add_signal_to_folder',
    name: 'Add Signal to Folder',
    description: 'Add an existing signal to an existing folder',
    version: '1.0.0',

    triggers: {
        keywords: ['add signal to folder', 'move signal', 'link signal'],
        intents: ['signal_to_folder'],
    },

    requiredInputs: [
        {
            field: 'signalId',
            type: 'string',
            description: 'ID of the signal to add',
        },
        {
            field: 'folderId',
            type: 'string',
            description: 'ID of the folder to add signal to',
        },
    ],

    requiresApprovalToStart: true,

    steps: [
        {
            id: 'add_to_folder',
            name: 'Add Signal to Folder',
            tool: 'signal_add_to_folder',
            inputs: {
                signal_id: '$inputs.signalId',
                folder_id: '$inputs.folderId',
            },
            hitl: {
                type: 'approval',
                message: 'Add this signal to the selected folder?',
                required: true,
            },
        },
    ],

    category: 'signals',
    tags: ['signal', 'folder', 'link'],
    estimatedDuration: '< 1 minute',
};

// Export all signal workflows
export const signalWorkflows = [
    createSignalWorkflow,
    signalToFolderWorkflow,
    fullInvestigationWorkflow,
    addSignalToFolderWorkflow,
];
