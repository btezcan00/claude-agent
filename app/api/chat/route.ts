import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AttachmentData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  content?: string; // base64 encoded
  textContent?: string;
}

interface SignalData {
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

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  ownedFolderCount: number;
}

interface FolderData {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerId: string | null;
  ownerName: string | null;
  signalCount: number;
  createdAt: string;
  tags: string[];
  practitioners: { userId: string; userName: string }[];
  sharedWith: { userId: string; userName: string; accessLevel: string }[];
  organizations: { id: string; name: string }[];
  peopleInvolved: { id: string; firstName: string; surname: string }[];
}

interface OrganizationData {
  id: string;
  name: string;
  type: string;
  address: string;
  description?: string;
  chamberOfCommerce?: string;
}

interface AddressData {
  id: string;
  street: string;
  buildingType: string;
  isActive: boolean;
  description: string;
}

interface PersonData {
  id: string;
  firstName: string;
  surname: string;
  dateOfBirth?: string;
  address: string;
  description: string;
  bsn?: string;
}

const tools: Anthropic.Tool[] = [
  {
    name: 'plan_proposal',
    description: 'Present a structured execution plan to the user for approval before executing write operations. Use this tool BEFORE any create, edit, delete, or other write operations.',
    input_schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Brief summary of what will be done (1-2 sentences)',
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number', description: 'Step number (starting from 1)' },
              action: { type: 'string', description: 'Human-readable description of the action' },
              tool: { type: 'string', description: 'Name of the tool to be used' },
              details: {
                type: 'object',
                description: 'Key parameters for this action. For parameters that depend on outputs from previous steps, use reference syntax: "$stepN.fieldName" (e.g., "$step1.folderId" to reference the folder ID created in step 1). Available output fields: step with create_signal returns signalId, signalNumber; step with create_folder returns folderId, folderName.',
              },
            },
            required: ['step', 'action', 'tool'],
          },
          description: 'List of planned actions in execution order',
        },
      },
      required: ['summary', 'actions'],
    },
  },
  {
    name: 'summarize_signals',
    description: 'Summarize all signals or a specific signal by ID. Use this when the user wants an overview of signals.',
    input_schema: {
      type: 'object',
      properties: {
        signal_id: {
          type: 'string',
          description: 'Optional specific signal ID or signal number to summarize. If not provided, summarizes all signals.',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_signal',
    description: 'Create a new signal with the specified details. Returns the signal data that should be created.',
    input_schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Detailed description of the signal/observation',
        },
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'The types of the signal (e.g., human-trafficking, drug-trafficking, bogus-scheme)',
        },
        placeOfObservation: {
          type: 'string',
          description: 'Location/address where the observation was made',
        },
        timeOfObservation: {
          type: 'string',
          description: 'ISO datetime string for when the observation was made (e.g., 2024-01-15T14:30:00Z). If not specified by user, use current time.',
        },
        receivedBy: {
          type: 'string',
          enum: ['police', 'anonymous-report', 'municipal-department', 'bibob-request', 'other'],
          description: 'Source that received the signal',
        },
      },
      required: ['description', 'types', 'placeOfObservation', 'receivedBy'],
    },
  },
  {
    name: 'edit_signal',
    description: 'Edit an existing signal. Returns the updates that should be applied.',
    input_schema: {
      type: 'object',
      properties: {
        signal_id: {
          type: 'string',
          description: 'The ID or signal number of the signal to edit',
        },
        description: {
          type: 'string',
          description: 'New description for the signal',
        },
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'New types for the signal',
        },
        placeOfObservation: {
          type: 'string',
          description: 'New location for the signal',
        },
      },
      required: ['signal_id'],
    },
  },
  {
    name: 'add_note',
    description: 'Add a note to an existing signal. Use this when the user wants to add comments, observations, or updates to a signal.',
    input_schema: {
      type: 'object',
      properties: {
        signal_id: {
          type: 'string',
          description: 'The ID or signal number of the signal to add a note to',
        },
        content: {
          type: 'string',
          description: 'The content of the note to add',
        },
        is_private: {
          type: 'boolean',
          description: 'Whether the note should be private (default: false)',
        },
      },
      required: ['signal_id', 'content'],
    },
  },
  {
    name: 'delete_signal',
    description: 'Delete a signal from the system. Use this when the user explicitly wants to delete/remove a signal. Always confirm before deleting.',
    input_schema: {
      type: 'object',
      properties: {
        signal_id: {
          type: 'string',
          description: 'The ID or signal number of the signal to delete',
        },
      },
      required: ['signal_id'],
    },
  },
  {
    name: 'add_signal_to_folder',
    description: 'Add an existing signal to an existing folder. Use this when the user wants to move or link a signal to a folder that already exists.',
    input_schema: {
      type: 'object',
      properties: {
        signal_id: {
          type: 'string',
          description: 'The ID or signal number of the signal to add',
        },
        folder_id: {
          type: 'string',
          description: 'The ID or name of the existing folder',
        },
      },
      required: ['signal_id', 'folder_id'],
    },
  },
  {
    name: 'list_team_members',
    description: 'List all available team members and their folder ownership. Use this when the user asks about team members or folder assignments.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_signal_stats',
    description: 'Get dashboard statistics about all signals. Returns total count.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_signals',
    description: 'Search and filter signals by various criteria. Use this when the user wants to find specific signals.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search keyword to match against signal description, location, or signal number',
        },
        type: {
          type: 'string',
          description: 'Filter by signal type (e.g., human-trafficking, drug-trafficking)',
        },
        receivedBy: {
          type: 'string',
          enum: ['police', 'anonymous-report', 'municipal-department', 'bibob-request', 'other'],
          description: 'Filter by source that received the signal',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_signal_activity',
    description: 'Get the activity history/timeline for a specific signal. Shows all actions taken on the signal.',
    input_schema: {
      type: 'object',
      properties: {
        signal_id: {
          type: 'string',
          description: 'The ID or signal number of the signal',
        },
      },
      required: ['signal_id'],
    },
  },
  {
    name: 'get_signal_notes',
    description: 'Get all notes for a specific signal.',
    input_schema: {
      type: 'object',
      properties: {
        signal_id: {
          type: 'string',
          description: 'The ID or signal number of the signal',
        },
      },
      required: ['signal_id'],
    },
  },
  {
    name: 'summarize_attachments',
    description: 'Summarize and analyze all attachments (images, documents, files) for a specific signal. Uses AI vision to analyze images and extracts text from documents. Use this when the user asks to describe, summarize, or analyze signal attachments.',
    input_schema: {
      type: 'object',
      properties: {
        signal_id: {
          type: 'string',
          description: 'The ID or signal number of the signal whose attachments to summarize',
        },
      },
      required: ['signal_id'],
    },
  },
  {
    name: 'list_folders',
    description: 'List all folders in the system. Use this when the user wants to see available folders or asks about folders.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_folder_stats',
    description: 'Get statistics about folders. Returns total count and count by status.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'complete_bibob_application',
    description: 'Complete the Bibob application for a folder. IMPORTANT: Only use this when ALL 4 criteria are met. If any criterion is not met, use save_bibob_application_draft instead and inform the user which criteria are missing.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder to complete the application for',
        },
        explanation: {
          type: 'string',
          description: 'Overall explanation for the Bibob application completion',
        },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', enum: ['necessary_info', 'annual_accounts', 'budgets', 'loan_agreement'] },
              isMet: { type: 'boolean' },
              explanation: { type: 'string' },
            },
            required: ['id', 'isMet', 'explanation'],
          },
          description: 'Array of criteria with completion status and explanations',
        },
      },
      required: ['folder_id', 'explanation', 'criteria'],
    },
  },
  {
    name: 'save_bibob_application_draft',
    description: 'Save progress on a Bibob application without completing it. Use this when any criteria are not met. BEFORE using this tool, you MUST first tell the user which specific criteria are not met and explain that all 4 criteria must be met to complete the application.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'ID or name of the folder',
        },
        explanation: {
          type: 'string',
          description: 'Overall explanation for the application (optional)',
        },
        criteria: {
          type: 'array',
          description: 'Application criteria status (optional)',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                enum: ['necessary_info', 'annual_accounts', 'budgets', 'loan_agreement'],
              },
              isMet: { type: 'boolean' },
              explanation: { type: 'string' },
            },
            required: ['id', 'isMet', 'explanation'],
          },
        },
      },
      required: ['folder_id'],
    },
  },
  {
    name: 'assign_folder_owner',
    description: 'Assign a team member as the owner of a folder. Use this when the user wants to assign someone to a folder.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder to assign an owner to',
        },
        user_id: {
          type: 'string',
          description: 'The ID of the team member to assign as owner',
        },
        user_name: {
          type: 'string',
          description: 'The full name of the team member to assign as owner',
        },
      },
      required: ['folder_id', 'user_id', 'user_name'],
    },
  },
  {
    name: 'edit_folder',
    description: 'Edit folder properties like name, description, status, location, color, or tags. Use this when the user wants to update folder information.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder to edit',
        },
        name: {
          type: 'string',
          description: 'New folder name',
        },
        description: {
          type: 'string',
          description: 'New folder description',
        },
        status: {
          type: 'string',
          enum: ['application', 'research', 'national_office', 'decision', 'archive'],
          description: 'New folder status in the workflow',
        },
        location: {
          type: 'string',
          description: 'Geographic or organizational location',
        },
        color: {
          type: 'string',
          description: 'Folder color (e.g., #ef4444 for red, #3b82f6 for blue)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to set on the folder (replaces existing tags)',
        },
      },
      required: ['folder_id'],
    },
  },
  {
    name: 'create_folder',
    description: 'Create a new folder. IMPORTANT: If user mentions a signal or is creating a folder from a signal, you MUST include that signal ID in signalIds. After creation, ask if the user wants to fill out the Bibob application form. Default name is "New folder".',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the folder (default: "New folder")',
        },
        description: {
          type: 'string',
          description: 'Description of the folder\'s purpose',
        },
        color: {
          type: 'string',
          description: 'Optional hex color for the folder',
        },
        signalIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Signal IDs to add to the folder. MUST be included when creating a folder from/for a signal.',
        },
      },
      required: [],
    },
  },
  {
    name: 'add_folder_practitioner',
    description: 'Add a team member as a practitioner to a folder. Practitioners can work on the folder but have limited permissions compared to the owner.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        user_id: {
          type: 'string',
          description: 'The ID of the team member to add as practitioner',
        },
        user_name: {
          type: 'string',
          description: 'The full name of the team member to add as practitioner',
        },
      },
      required: ['folder_id', 'user_id', 'user_name'],
    },
  },
  {
    name: 'share_folder',
    description: 'Share a folder with a team member. Sharing gives them access to view or edit the folder based on the access level specified.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder to share',
        },
        user_id: {
          type: 'string',
          description: 'The ID of the team member to share with',
        },
        user_name: {
          type: 'string',
          description: 'The full name of the team member to share with',
        },
        access_level: {
          type: 'string',
          enum: ['view', 'edit', 'admin'],
          description: 'The access level to grant: view (read-only), edit (can modify), admin (full access)',
        },
      },
      required: ['folder_id', 'user_id', 'user_name', 'access_level'],
    },
  },
  {
    name: 'add_folder_organization',
    description: 'Add an organization to a folder. Use this when the user wants to associate a company, business, or organization with the folder.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        name: {
          type: 'string',
          description: 'Name of the organization',
        },
        kvk_number: {
          type: 'string',
          description: 'KVK (Chamber of Commerce) number if known',
        },
        address: {
          type: 'string',
          description: 'Address of the organization',
        },
        type: {
          type: 'string',
          description: 'Type of organization (e.g., "company", "foundation", "association")',
        },
      },
      required: ['folder_id', 'name'],
    },
  },
  {
    name: 'add_folder_address',
    description: 'Add an address/location to a folder. Use this when the user wants to associate a specific address or location with the folder.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        street: {
          type: 'string',
          description: 'Street name and number',
        },
        city: {
          type: 'string',
          description: 'City name',
        },
        postal_code: {
          type: 'string',
          description: 'Postal/ZIP code',
        },
        country: {
          type: 'string',
          description: 'Country (default: Netherlands)',
        },
        description: {
          type: 'string',
          description: 'Description or notes about this address',
        },
      },
      required: ['folder_id', 'street', 'city'],
    },
  },
  {
    name: 'add_folder_person',
    description: 'Add a person involved to a folder. Use this when the user wants to associate a person with the folder investigation.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        first_name: {
          type: 'string',
          description: 'First name of the person',
        },
        last_name: {
          type: 'string',
          description: 'Last name of the person',
        },
        date_of_birth: {
          type: 'string',
          description: 'Date of birth (YYYY-MM-DD format)',
        },
        role: {
          type: 'string',
          description: 'Role or relationship to the case (e.g., "suspect", "witness", "owner", "employee")',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about this person',
        },
      },
      required: ['folder_id', 'first_name', 'last_name'],
    },
  },
  {
    name: 'add_folder_finding',
    description: 'Add a finding to a folder. Use one of the 6 predefined finding types: 1) LBB - no serious degree of danger (none), 2) LBB - a lower level of danger (low), 3) LBB - serious level of danger (serious), 4) Serious danger - investing criminal assets (A) (critical), 5) Serious danger - committing criminal offences (B) (critical), 6) no serious level of danger (none).',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        label: {
          type: 'string',
          description: 'The finding type label (use exact label from predefined types)',
        },
        severity: {
          type: 'string',
          enum: ['none', 'low', 'serious', 'critical'],
          description: 'Severity level matching the finding type',
        },
        assigned_to: {
          type: 'string',
          description: 'Name of the team member this finding is assigned to',
        },
      },
      required: ['folder_id', 'label', 'severity'],
    },
  },
  {
    name: 'add_folder_letter',
    description: 'Add a letter/document to a folder. Two templates available: lbb_notification (LBB notification letter) and bibob_7c_request (Article 7c Bibob Act request). Each has specific required fields. IMPORTANT: Always ask for the letter_name first, then collect all template-specific fields before calling this tool.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        letter_name: {
          type: 'string',
          description: 'Custom name/title for the letter (e.g., "Bibob Request - ABC Company")',
        },
        template: {
          type: 'string',
          enum: ['lbb_notification', 'bibob_7c_request'],
          description: 'Template type',
        },
        // Common fields
        date: {
          type: 'string',
          description: 'Date of the letter (YYYY-MM-DD format)',
        },
        municipal_province: {
          type: 'string',
          description: 'Municipal or province name',
        },
        // LBB Notification specific fields
        reference_number: {
          type: 'string',
          description: 'Reference number (LBB notification)',
        },
        recipient_name: {
          type: 'string',
          description: 'Name of recipient (LBB notification)',
        },
        recipient_address: {
          type: 'string',
          description: 'Recipient address (LBB notification)',
        },
        recipient_postal_code: {
          type: 'string',
          description: 'Recipient postal code and city (LBB notification)',
        },
        subject: {
          type: 'string',
          description: 'Subject of the letter (LBB notification)',
        },
        notification_content: {
          type: 'string',
          description: 'Notification content/body text (LBB notification)',
        },
        sender_name: {
          type: 'string',
          description: 'Sender name (LBB notification)',
        },
        sender_title: {
          type: 'string',
          description: 'Sender title/function (LBB notification)',
        },
        // Bibob 7c Request specific fields
        applicant_name: {
          type: 'string',
          description: 'Name of applicant (Bibob 7c)',
        },
        applicant_phone: {
          type: 'string',
          description: 'Applicant telephone number (Bibob 7c)',
        },
        recipient_email: {
          type: 'string',
          description: 'Recipient email address (Bibob 7c)',
        },
        legal_provisions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Selected legal provisions (Bibob 7c): article_10x, awr_incorrect, general_tax_act, article_67e, article_67f',
        },
        fine_information: {
          type: 'array',
          items: { type: 'string' },
          description: 'Selected fine info (Bibob 7c): irrevocable_fines, fines_court_ruled, fines_no_ruling',
        },
        license_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Selected license types (Bibob 7c): alcohol_act, wabo_building, wabo_environmental, wabo_usage, operating_establishment, sex_establishment, license_other',
        },
        additional_remarks: {
          type: 'string',
          description: 'Additional remarks (Bibob 7c)',
        },
      },
      required: ['folder_id', 'template', 'date', 'municipal_province'],
    },
  },
  {
    name: 'add_folder_communication',
    description: 'Add a communication record to a folder. Communications track correspondence, calls, meetings, or other interactions related to the case.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        label: {
          type: 'string',
          description: 'Short title/label for the communication (e.g., "Phone call with witness", "Email from tax office")',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the communication',
        },
        date: {
          type: 'string',
          description: 'Date of the communication (YYYY-MM-DD format). Defaults to today if not provided.',
        },
      },
      required: ['folder_id', 'label'],
    },
  },
  {
    name: 'get_folder_messages',
    description: 'Get the chat messages for a specific contact in a folder. Returns the last messages in the conversation.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        contact_id: {
          type: 'string',
          description: 'The ID of the contact (user ID for practitioners/shared users, org ID for organizations, person ID for people involved)',
        },
        contact_name: {
          type: 'string',
          description: 'The name of the contact (for display purposes)',
        },
        contact_type: {
          type: 'string',
          enum: ['practitioner', 'shared', 'organization', 'person'],
          description: 'The type of contact: practitioner, shared (shared user), organization, or person (person involved)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to return (default: 5)',
        },
      },
      required: ['folder_id', 'contact_id', 'contact_name', 'contact_type'],
    },
  },
  {
    name: 'send_folder_message',
    description: 'Send a chat message to a contact in a folder.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        contact_id: {
          type: 'string',
          description: 'The ID of the contact (user ID for practitioners/shared users, org ID for organizations, person ID for people involved)',
        },
        contact_name: {
          type: 'string',
          description: 'The name of the contact',
        },
        contact_type: {
          type: 'string',
          enum: ['practitioner', 'shared', 'organization', 'person'],
          description: 'The type of contact: practitioner, shared (shared user), organization, or person (person involved)',
        },
        message: {
          type: 'string',
          description: 'The message content to send',
        },
      },
      required: ['folder_id', 'contact_id', 'contact_name', 'contact_type', 'message'],
    },
  },
  {
    name: 'add_folder_visualization',
    description: 'Add a visualization to a folder. Visualizations are diagrams, charts, relationship maps, or other visual representations of case data.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        label: {
          type: 'string',
          description: 'Short title/label for the visualization (e.g., "Organization structure", "Timeline of events")',
        },
        description: {
          type: 'string',
          description: 'Description of what the visualization shows',
        },
      },
      required: ['folder_id', 'label'],
    },
  },
  {
    name: 'add_folder_activity',
    description: 'Add an activity to a folder. Activities track tasks, actions, or work items that need to be done or have been completed for the case.',
    input_schema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID or name of the folder',
        },
        label: {
          type: 'string',
          description: 'Short title/label for the activity (e.g., "Review documents", "Interview witness")',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the activity',
        },
        assigned_to: {
          type: 'string',
          description: 'Name of the person this activity is assigned to',
        },
        date: {
          type: 'string',
          description: 'Due date or date of the activity (YYYY-MM-DD format). Defaults to today if not provided.',
        },
      },
      required: ['folder_id', 'label'],
    },
  },
];

// Helper function to summarize attachments using Claude Vision
async function summarizeAttachmentsForSignal(
  signalId: string,
  signals: SignalData[]
): Promise<string> {
  // Find the signal by ID or signal number
  const targetSignal = signals.find(
    (s) =>
      s.id === signalId ||
      s.signalNumber.toLowerCase() === signalId.toLowerCase() ||
      s.signalNumber.toLowerCase().includes(signalId.toLowerCase())
  );

  if (!targetSignal) {
    return `Signal "${signalId}" not found.`;
  }

  const attachments = targetSignal.attachments || [];
  if (attachments.length === 0) {
    return `Signal ${targetSignal.signalNumber} has no attachments.`;
  }

  // Filter to only attachments with content
  const attachmentsWithContent = attachments.filter((a) => a.content);
  if (attachmentsWithContent.length === 0) {
    return `Signal ${targetSignal.signalNumber} has ${attachments.length} attachment(s), but none have accessible content for analysis.`;
  }

  // Build multimodal content array
  const content: Anthropic.MessageParam['content'] = [];

  // Add instruction text
  content.push({
    type: 'text',
    text: `Please analyze and summarize the following ${attachmentsWithContent.length} attachment(s) for signal ${targetSignal.signalNumber} ("${targetSignal.description.substring(0, 50)}..."). For each attachment, provide a brief description of its contents and any relevant information that could be useful for the investigation.`,
  });

  // Add each attachment
  for (const attachment of attachmentsWithContent) {
    const isImage = attachment.fileType.startsWith('image/');

    if (isImage && attachment.content) {
      // Extract base64 data (remove data URL prefix)
      const base64Data = attachment.content.split(',')[1];
      if (base64Data) {
        const mediaType = attachment.fileType as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp';

        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data,
          },
        });
        content.push({
          type: 'text',
          text: `[Image file: ${attachment.fileName}]`,
        });
      }
    } else if (attachment.textContent) {
      // For text-based files, include extracted text
      content.push({
        type: 'text',
        text: `[Document: ${attachment.fileName}]\n\nContent:\n${attachment.textContent.substring(0, 5000)}${attachment.textContent.length > 5000 ? '\n... (content truncated)' : ''}`,
      });
    } else {
      // For other files without extractable content
      content.push({
        type: 'text',
        text: `[File: ${attachment.fileName} (${attachment.fileType}) - Content not available for direct analysis]`,
      });
    }
  }

  try {
    // Make vision-capable API call
    const summaryResponse = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    });

    // Extract text from response
    const summaryText = summaryResponse.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return summaryText || 'Unable to generate summary.';
  } catch (error) {
    console.error('Error summarizing attachments:', error);
    return 'Failed to analyze attachments. Please try again.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, signals, folders, teamMembers, currentUser, lastCreatedSignalId, organizations, addresses, people, stream: enableStreaming, approvedPlan }: {
      messages: Message[];
      signals: SignalData[];
      folders: FolderData[];
      teamMembers: TeamMember[];
      currentUser?: { id: string; firstName: string; lastName: string; fullName: string; title: string; role: string } | null;
      lastCreatedSignalId?: string | null;
      organizations?: OrganizationData[];
      addresses?: AddressData[];
      people?: PersonData[];
      stream?: boolean;
      approvedPlan?: {
        summary: string;
        actions: Array<{ step: number; action: string; tool: string; details?: Record<string, unknown> }>;
      } | null;
    } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const signalSummary = (signals || [])
      .map(
        (s) =>
          `- ${s.signalNumber}: ${s.placeOfObservation} (${s.types.join(', ')}, received by: ${s.receivedBy})`
      )
      .join('\n');

    const folderSummary = (folders || [])
      .map(
        (f) => {
          const practitionerNames = (f.practitioners || []).map(p => p.userName).join(', ');
          const sharedNames = (f.sharedWith || []).map(s => `${s.userName} (${s.accessLevel})`).join(', ');
          const orgNames = (f.organizations || []).map(o => o.name).join(', ');
          const peopleNames = (f.peopleInvolved || []).map(p => `${p.firstName} ${p.surname}`).join(', ');
          return `- ${f.name} (${f.id}): ${f.description.substring(0, 50)}${f.description.length > 50 ? '...' : ''} (status: ${f.status}, ${f.signalCount} signals, owner: ${f.ownerName || 'none'}, practitioners: ${practitionerNames || 'none'}, shared with: ${sharedNames || 'none'}, organizations: ${orgNames || 'none'}, people involved: ${peopleNames || 'none'})`;
        }
      )
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

    // Build system prompt - modify if we have an approved plan
    const systemPrompt = `You are an AI assistant for the Government Case Management Platform (GCMP). You help government employees manage signals and folders related to investigations.

## MANDATORY PLAN-FIRST BEHAVIOR

${approvedPlan ? `**PLAN ALREADY APPROVED - PROCEED WITH EXECUTION**

The user has approved the following plan. Execute the tools immediately without calling plan_proposal again:

Summary: ${approvedPlan.summary}
Actions:
${approvedPlan.actions.map(a => {
  const detailsStr = a.details ? `\n   Parameters: ${JSON.stringify(a.details)}` : '';
  return `${a.step}. ${a.action} (${a.tool})${detailsStr}`;
}).join('\n')}

IMPORTANT: When executing multi-step plans, use these exact parameter values from the plan.
For step references like "$step1.signalId", use that exact string - the client will resolve it to the actual value.

DO NOT call plan_proposal. The plan is approved. Execute the write tools now.` : `**ABSOLUTE RULE: You MUST use the plan_proposal tool BEFORE any write operation.**`}

WRITE TOOLS (REQUIRE plan_proposal FIRST):
- create_signal, edit_signal, add_note, delete_signal, add_signal_to_folder
- create_folder, edit_folder, assign_folder_owner, add_folder_practitioner, share_folder
- add_folder_organization, add_folder_address, add_folder_person, add_folder_finding
- add_folder_letter, add_folder_communication, add_folder_visualization, add_folder_activity
- send_folder_message, complete_bibob_application, save_bibob_application_draft

READ TOOLS (Execute immediately):
- summarize_signals, search_signals, get_signal_activity, get_signal_notes, get_signal_stats
- summarize_attachments, list_folders, get_folder_stats, list_team_members, get_folder_messages

## WORKFLOW

1. **User requests a WRITE operation** (create, edit, delete, add, etc.)
   → You MUST call plan_proposal tool with summary and actions
   → DO NOT call any write tools yet
   → STOP and wait for approval

2. **User approves** (says "yes", "approve", "go ahead", "proceed", etc.)
   → NOW execute the write tools

3. **User requests a READ operation** (list, search, summarize, etc.)
   → Execute immediately, no plan needed

## USING EXISTING FOLDERS

When a user mentions moving a signal to a folder:
1. Check the "Current Data" section to see if a folder with that name exists
2. If the folder EXISTS, use add_signal_to_folder instead of create_folder
3. Only create a new folder if the user explicitly asks to create one OR if no matching folder exists

**For moving signals to existing folders:**
- Use the existing folder's ID from the Current Data section
- Do NOT create a new folder when one already exists with the same or similar name

## USING EXISTING SIGNALS

When a user mentions "this signal", "the signal", "the latest signal", or refers to a specific signal:
1. **Check if lastCreatedSignalId is set** - If so, the user likely means that signal
2. **Check the conversation history** - Look for recent signal references
3. **Check Current Data** - Match signal numbers or descriptions the user mentioned
4. **DO NOT create a new signal** when the user is clearly referring to an existing one

**Key distinction:**
- "Create a signal about X" → Use create_signal (new signal)
- "Make a folder from this signal" → Use create_folder with existing signal ID (NO create_signal)
- "Create a folder for the latest signal" → Use create_folder with the first signal from Current Data

**IMPORTANT:** If lastCreatedSignalId is provided, use it when the user says "this signal" or "the signal" without specifying which one.

## EXAMPLE - Creating a Signal

User: "Create a signal about suspicious activity at Main Street"

Your response MUST be to call plan_proposal:
{
  "summary": "Create a new signal for suspicious activity at Main Street",
  "actions": [
    {
      "step": 1,
      "action": "Create signal with type 'bogus-scheme', location 'Main Street'",
      "tool": "create_signal",
      "details": {
        "description": "Suspicious activity reported",
        "types": ["bogus-scheme"],
        "placeOfObservation": "Main Street"
      }
    }
  ]
}

DO NOT call create_signal until user approves!

## EXAMPLE - Creating a Folder from an Existing Signal

User: "Make a folder from this signal and complete the application form"
(Look up lastCreatedSignalId or the first signal from Current Data)

Your response MUST be to call plan_proposal:
{
  "summary": "Create folder from existing signal and complete Bibob application",
  "actions": [
    {
      "step": 1,
      "action": "Create folder from signal [USE ACTUAL SIGNAL NUMBER FROM CURRENT DATA]",
      "tool": "create_folder",
      "details": {
        "name": "New Folder",
        "signalIds": ["[USE ACTUAL SIGNAL ID FROM CURRENT DATA OR lastCreatedSignalId]"]
      }
    },
    {
      "step": 2,
      "action": "Complete Bibob application for the folder",
      "tool": "complete_bibob_application",
      "details": {
        "folder_id": "$step1.folderId",
        "explanation": "Application completed",
        "criteria": [
          { "id": "necessary_info", "isMet": true, "explanation": "Provided" },
          { "id": "annual_accounts", "isMet": true, "explanation": "Verified" },
          { "id": "budgets", "isMet": true, "explanation": "Reviewed" },
          { "id": "loan_agreement", "isMet": true, "explanation": "Verified" }
        ]
      }
    }
  ]
}

**CRITICAL:** Replace placeholders with ACTUAL values from the Current Data section below. NEVER use example IDs like "SIG-2024-0089".

**IMPORTANT:** Notice there is NO create_signal step - the user wants to use an EXISTING signal!

## EXAMPLE - Editing an Existing Signal

User: "Change the latest signal's type to human trafficking"

**CRITICAL: Look at the ACTUAL Current Data section below. The first signal listed is the most recent. Use THAT signal's actual ID and number - NOT any example ID.**

Your response MUST be to call plan_proposal:
{
  "summary": "Update signal [ACTUAL_SIGNAL_NUMBER] to type human-trafficking",
  "actions": [
    {
      "step": 1,
      "action": "Edit signal [ACTUAL_SIGNAL_NUMBER] to change type to human-trafficking",
      "tool": "edit_signal",
      "details": {
        "signal_id": "[ACTUAL_SIGNAL_NUMBER_FROM_CURRENT_DATA]",
        "types": ["human-trafficking"]
      }
    }
  ]
}

**NEVER use "SIG-2024-0089" or any other example ID. Always use the REAL signal number from Current Data.**

**VIOLATION WARNING: Calling a write tool without first calling plan_proposal is a critical error.**

## IMPORTANT: Step Reference Rules

Step references ($stepN.fieldName) are ONLY for referencing outputs from PREVIOUS steps in multi-step plans.

**NEVER use step references for:**
- Single-step operations (step 1 cannot reference step 1's output - it doesn't exist yet!)
- Operations on EXISTING entities - use their actual ID from the Current Data section

**DO use step references for:**
- Step 2+ referencing output from an earlier step (e.g., create signal in step 1, add to folder in step 2)

**Examples of WRONG usage:**
- edit_signal with signal_id: "$step1.signalId" (step 1 can't reference itself!)
- Step 1 of any plan using $step1.anything

**Examples of CORRECT usage:**
- Step 2 add_signal_to_folder with signal_id: "$step1.signalId" (references step 1's create_signal output)

## Multi-Step Plans with Dependencies

When a later step needs to use output from an earlier step, use reference syntax in the details:
- $step1.folderId - The folder ID created in step 1
- $step1.folderName - The folder name created in step 1
- $step1.signalId - The signal ID created in step 1
- $step1.signalNumber - The signal number created in step 1

## EXAMPLE - Creating a folder and completing Bibob application

User: "Create a folder called 'Test' and complete its Bibob application"

Your response MUST be to call plan_proposal:
{
  "summary": "Create folder 'Test' and complete its Bibob application",
  "actions": [
    {
      "step": 1,
      "action": "Create folder named 'Test'",
      "tool": "create_folder",
      "details": { "name": "Test" }
    },
    {
      "step": 2,
      "action": "Complete Bibob application for the created folder",
      "tool": "complete_bibob_application",
      "details": {
        "folder_id": "$step1.folderId",
        "explanation": "Application completed with all criteria met",
        "criteria": [
          { "id": "necessary_info", "isMet": true, "explanation": "All necessary information provided" },
          { "id": "annual_accounts", "isMet": true, "explanation": "Annual accounts verified" },
          { "id": "budgets", "isMet": true, "explanation": "Budgets reviewed" },
          { "id": "loan_agreement", "isMet": true, "explanation": "Loan agreement verified" }
        ]
      }
    }
  ]
}

## EXAMPLE - Creating signal, folder from signal, and completing Bibob

User: "Create a signal about fraud at Main Street, create a folder from it, then complete the Bibob application"

{
  "summary": "Create signal, folder from signal, and complete Bibob application",
  "actions": [
    {
      "step": 1,
      "action": "Create signal about fraud at Main Street",
      "tool": "create_signal",
      "details": {
        "description": "Fraud activity reported",
        "types": ["fraud"],
        "placeOfObservation": "Main Street",
        "receivedBy": "municipal-department"
      }
    },
    {
      "step": 2,
      "action": "Create folder from the signal",
      "tool": "create_folder",
      "details": {
        "name": "Fraud Investigation - Main Street",
        "signalIds": ["$step1.signalId"]
      }
    },
    {
      "step": 3,
      "action": "Complete Bibob application for the folder",
      "tool": "complete_bibob_application",
      "details": {
        "folder_id": "$step2.folderId",
        "explanation": "Application completed",
        "criteria": [
          { "id": "necessary_info", "isMet": true, "explanation": "Provided" },
          { "id": "annual_accounts", "isMet": true, "explanation": "Verified" },
          { "id": "budgets", "isMet": true, "explanation": "Reviewed" },
          { "id": "loan_agreement", "isMet": true, "explanation": "Verified" }
        ]
      }
    }
  ]
}

IMPORTANT: Always use $stepN.fieldName syntax when referencing outputs from previous steps. Never hardcode IDs for entities that will be created in earlier steps.

## EXAMPLE - Creating a signal and adding to existing folder

User: "Create a signal and move it to the Narcotics Operation folder"

First check Current Data - if "Narcotics Operation" folder exists (e.g., folder-123):

{
  "summary": "Create signal and add to existing Narcotics Operation folder",
  "actions": [
    {
      "step": 1,
      "action": "Create the signal",
      "tool": "create_signal",
      "details": {
        "description": "[user-provided]",
        "types": ["[user-provided]"],
        "placeOfObservation": "[user-provided]",
        "receivedBy": "[user-provided]"
      }
    },
    {
      "step": 2,
      "action": "Add signal to existing Narcotics Operation folder",
      "tool": "add_signal_to_folder",
      "details": {
        "signal_id": "$step1.signalId",
        "folder_id": "folder-123"
      }
    }
  ]
}

IMPORTANT: Do NOT use create_folder when the folder already exists!

## Current Data

**>>> IMPORTANT: USE THESE ACTUAL VALUES <<<**
**When referencing signals, folders, or team members, use the REAL IDs listed below.**
**Do NOT use example IDs from the examples above (like "SIG-2024-0089").**

**Signals (${(signals || []).length}):** ${signalSummary || 'None'}

**Folders (${(folders || []).length}):** ${folderSummary || 'None'}

**Team:** ${teamSummary || 'None'}

**Organizations:** ${organizationsSummary || 'None'}

**Addresses:** ${addressesSummary || 'None'}

**People:** ${peopleSummary || 'None'}

**Current User:** ${currentUser ? `${currentUser.fullName} (${currentUser.id}) - "${currentUser.id}" and "${currentUser.fullName}" for tool calls` : 'Unknown'}

${lastCreatedSignalId ? `**Last Created Signal ID:** ${lastCreatedSignalId} - When the user says "this signal" or "the signal", use THIS ID. Do NOT create a new signal.` : ''}

## Handling "Latest" or "Most Recent" References

**CRITICAL INSTRUCTION - READ CAREFULLY:**

When the user refers to "the latest signal", "most recent signal", "this signal", or "the signal":

1. **IMMEDIATELY look at the Current Data section below** - find the "Signals" list
2. **The FIRST signal listed is the most recent** (they are sorted by createdAt descending)
3. **Use THAT signal's ACTUAL ID** - the real signal number like "GCMP-2026-266241" or whatever is actually listed
4. **NEVER use example IDs** like "SIG-2024-0089" - these are just examples, not real signals

**HOW TO FIND THE LATEST SIGNAL:**
- Scroll down to "## Current Data" section
- Find "**Signals (N):**" where N is the count
- The FIRST bullet point is the latest signal
- Use its exact signal number (the part before the colon)

**EXAMPLE OF WHAT TO DO:**
If Current Data shows: \`- GCMP-2026-266241: Main Street (fraud, received by: police)\`
Then use signal_id: "GCMP-2026-266241" in your plan.

**NEVER assume or make up signal IDs. Always look them up from Current Data.**

## Available Tools

**Signals:** summarize_signals, create_signal, edit_signal, add_signal_to_folder, add_note, delete_signal, search_signals, get_signal_activity, get_signal_notes, get_signal_stats, summarize_attachments

**Folders:** list_folders, get_folder_stats, create_folder, edit_folder, assign_folder_owner, add_folder_practitioner, share_folder, complete_bibob_application, save_bibob_application_draft

**Folder Content:** add_folder_organization, add_folder_address, add_folder_person, add_folder_finding, add_folder_letter, add_folder_communication, add_folder_visualization, add_folder_activity, get_folder_messages, send_folder_message

**Team:** list_team_members

## Defaults & Assumptions

When information is missing:
- **Signal time**: Use current time
- **Signal receivedBy**: Use "municipal-department"
- **Folder name**: Use "New Folder" or derive from context
- **Folder color**: Pick randomly from: #ef4444, #f97316, #22c55e, #3b82f6, #8b5cf6
- **Owner**: Assign to current user if not specified
- **Bibob criteria**: If not all met, save as draft automatically

## Response Style

- Be concise and action-oriented
- After completing actions, summarize what was done
- Suggest logical next steps when appropriate`;

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Detect if this is a write operation request vs approval vs read operation
    const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
    const isApprovalMessage = /\b(approved?|yes|proceed|go ahead|do it|confirm|execute|ok|okay)\b/i.test(lastUserMessage);
    const isWriteRequest = /\b(create|add|edit|update|delete|remove|assign|share|complete|save|send|change|modify|set|make|put|move)\b/i.test(lastUserMessage);
    // Don't force plan_proposal if we have an approved plan
    const shouldForcePlanProposal = isWriteRequest && !isApprovalMessage && !approvedPlan;

    // Streaming mode
    if (enableStreaming) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (type: string, data: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data as object })}\n\n`));
          };

          let currentMessages: Anthropic.MessageParam[] = [...anthropicMessages];
          let iterations = 0;
          const maxIterations = 3;
          const allToolResults: { name: string; input: Record<string, unknown>; result?: string }[] = [];
          let currentPlanStep = 0;

          while (iterations < maxIterations) {
            iterations++;

            // Send phase indicator - skip 'planning' if we have an approved plan
            if (iterations === 1) {
              sendEvent('phase', { phase: approvedPlan ? 'executing' : 'planning' });
            }

            // Force plan_proposal on first iteration for write requests
            const useToolChoice = shouldForcePlanProposal && iterations === 1;

            const response = await anthropic.messages.create({
              model: 'claude-3-haiku-20240307',
              max_tokens: 2048,
              system: systemPrompt,
              tools,
              messages: currentMessages,
              ...(useToolChoice && { tool_choice: { type: 'tool' as const, name: 'plan_proposal' } }),
            });

            let textContent = '';
            const toolUses: Anthropic.ToolUseBlock[] = [];

            for (const block of response.content) {
              if (block.type === 'text') {
                textContent += block.text;
                // Stream text as thinking if we have tool calls pending
                if (response.stop_reason === 'tool_use') {
                  sendEvent('thinking', { text: block.text });
                }
              } else if (block.type === 'tool_use') {
                toolUses.push(block);
              }
            }

            // If no tool use, we're done - send the final response
            if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
              sendEvent('phase', { phase: 'complete' });
              sendEvent('response', { text: textContent, toolResults: allToolResults });
              break;
            }

            // Execute tools
            sendEvent('phase', { phase: 'executing' });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            // When we have an approved plan, execute plan actions directly instead of Claude's tool calls
            // This prevents Claude from generating extra/wrong tool calls during execution
            if (approvedPlan && approvedPlan.actions.length > 0) {
              // Get the next action to execute based on currentPlanStep
              const nextAction = approvedPlan.actions.find(a => a.step === currentPlanStep + 1);

              if (nextAction) {
                currentPlanStep++;
                const toolInput = nextAction.details || {};

                sendEvent('tool_call', { tool: nextAction.tool, input: toolInput });

                let result = '';

                // Handle summarize_attachments server-side
                if (nextAction.tool === 'summarize_attachments') {
                  const signalId = (toolInput as { signal_id: string }).signal_id;
                  result = await summarizeAttachmentsForSignal(signalId, signals);
                } else {
                  // For other tools, return success - client will execute
                  result = JSON.stringify({ success: true, tool: nextAction.tool, input: toolInput });
                }

                allToolResults.push({
                  name: nextAction.tool,
                  input: toolInput as Record<string, unknown>,
                  result,
                });

                sendEvent('tool_result', { tool: nextAction.tool, result, status: 'success' });

                // Create a synthetic tool result for Claude's next iteration
                // Use the first toolUse ID if available, otherwise generate one
                const toolUseId = toolUses[0]?.id || `toolu_plan_${currentPlanStep}`;
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUseId,
                  content: result,
                });

                // Check if all plan actions are complete
                if (currentPlanStep >= approvedPlan.actions.length) {
                  // All actions executed - complete the workflow
                  sendEvent('phase', { phase: 'reflecting' });
                  sendEvent('phase', { phase: 'complete' });
                  sendEvent('response', {
                    text: 'All actions completed successfully.',
                    toolResults: allToolResults,
                  });
                  break;  // Exit the loop - all plan actions are done
                }

                // Add assistant response and tool results to messages for next iteration
                currentMessages = [
                  ...currentMessages,
                  { role: 'assistant' as const, content: response.content },
                  { role: 'user' as const, content: toolResults },
                ];
                continue;
              }
            }

            for (const toolUse of toolUses) {
              // Handle plan_proposal specially
              if (toolUse.name === 'plan_proposal') {
                // If we have an approved plan, skip plan_proposal entirely
                if (approvedPlan) {
                  // Return a dummy result so the AI can continue
                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: 'Plan already approved. Proceeding with execution.',
                  });
                  continue;
                }

                // No approved plan - send plan to client for approval
                const planInput = toolUse.input as {
                  summary: string;
                  actions: Array<{ step: number; action: string; tool: string; details?: Record<string, unknown> }>
                };

                sendEvent('plan_proposal', {
                  summary: planInput.summary,
                  actions: planInput.actions,
                });
                sendEvent('phase', { phase: 'awaiting_approval' });

                // Return early - don't execute further until approval
                sendEvent('response', {
                  text: '',
                  toolResults: allToolResults,
                  awaitingApproval: true,
                  plan: planInput,
                });

                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              // If we have an approved plan, use the plan's parameters instead of AI's
              let toolInput = toolUse.input as Record<string, unknown>;

              if (approvedPlan) {
                currentPlanStep++;

                const planAction = approvedPlan.actions.find(a => a.step === currentPlanStep);

                if (planAction && planAction.details) {
                  toolInput = planAction.details;
                }

                // Inject step references for known tool patterns
                // This ensures references are used even if AI didn't include them
                if (toolUse.name === 'add_signal_to_folder' && currentPlanStep > 1) {
                  const createSignalStep = approvedPlan.actions.find(a => a.tool === 'create_signal');

                  if (createSignalStep && createSignalStep.step < currentPlanStep) {
                    toolInput = {
                      ...toolInput,
                      signal_id: `$step${createSignalStep.step}.signalId`
                    };
                  }
                }

                if (toolUse.name === 'complete_bibob_application' || toolUse.name === 'save_bibob_application_draft') {
                  const createFolderStep = approvedPlan.actions.find(a => a.tool === 'create_folder');

                  if (createFolderStep && createFolderStep.step < currentPlanStep) {
                    // Only inject if folder_id looks like a fake ID (not an existing folder ID)
                    const currentFolderId = (toolInput as Record<string, unknown>).folder_id as string;
                    if (currentFolderId && !currentFolderId.startsWith('folder-') && !currentFolderId.startsWith('$step')) {
                      toolInput = {
                        ...toolInput,
                        folder_id: `$step${createFolderStep.step}.folderId`
                      };
                    }
                  }
                }

                if (toolUse.name === 'create_folder') {
                  const createSignalStep = approvedPlan.actions.find(a => a.tool === 'create_signal');

                  if (createSignalStep && createSignalStep.step < currentPlanStep) {
                    // If signalIds is present but doesn't use reference syntax, inject it
                    const signalIds = (toolInput as Record<string, unknown>).signalIds as string[] | undefined;
                    if (signalIds && signalIds.length > 0) {
                      const hasReference = signalIds.some(id => id.startsWith('$step'));
                      if (!hasReference) {
                        toolInput = {
                          ...toolInput,
                          signalIds: [`$step${createSignalStep.step}.signalId`]
                        };
                      }
                    }
                  }
                }
              }

              sendEvent('tool_call', { tool: toolUse.name, input: toolInput });

              let result = '';

              // Handle summarize_attachments server-side
              if (toolUse.name === 'summarize_attachments') {
                const signalId = (toolInput as { signal_id: string }).signal_id;
                result = await summarizeAttachmentsForSignal(signalId, signals);
              } else {
                // For other tools, return success - client will execute
                result = JSON.stringify({ success: true, tool: toolUse.name, input: toolInput });
              }

              allToolResults.push({
                name: toolUse.name,
                input: toolInput as Record<string, unknown>,
                result,
              });

              sendEvent('tool_result', { tool: toolUse.name, result, status: 'success' });

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result,
              });
            }

            // Add assistant response and tool results to messages for next iteration
            currentMessages = [
              ...currentMessages,
              { role: 'assistant' as const, content: response.content },
              { role: 'user' as const, content: toolResults },
            ];

            // Reflection phase
            sendEvent('phase', { phase: 'reflecting' });

            // Mark workflow as complete
            sendEvent('phase', { phase: 'complete' });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming mode (legacy support)
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
      ...(shouldForcePlanProposal && { tool_choice: { type: 'tool' as const, name: 'plan_proposal' } }),
    });

    // Process the response
    let textContent = '';
    const toolUses: { name: string; input: Record<string, unknown>; result?: string }[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        textContent += block.text;
      } else if (block.type === 'tool_use') {
        const toolUse: { name: string; input: Record<string, unknown>; result?: string } = {
          name: block.name,
          input: block.input as Record<string, unknown>,
        };

        // Handle summarize_attachments tool server-side
        if (block.name === 'summarize_attachments') {
          const signalId = (block.input as { signal_id: string }).signal_id;
          toolUse.result = await summarizeAttachmentsForSignal(signalId, signals);
        }

        toolUses.push(toolUse);
      }
    }

    return NextResponse.json({
      content: textContent,
      toolUses,
      stopReason: response.stop_reason,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
