import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { loadSkills, formatSkillsForPrompt } from '@/lib/skills/loader';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load skills at module level (cached at startup)
const skillsPromise = loadSkills();

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
      model: 'claude-opus-4-5-20251101',
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
    const { messages, signals, folders, teamMembers, currentUser, lastCreatedSignalId, organizations, addresses, people }: {
      messages: Message[];
      signals: SignalData[];
      folders: FolderData[];
      teamMembers: TeamMember[];
      currentUser?: { id: string; firstName: string; lastName: string; fullName: string; title: string; role: string } | null;
      lastCreatedSignalId?: string | null;
      organizations?: OrganizationData[];
      addresses?: AddressData[];
      people?: PersonData[];
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
          return `- ${f.name} (${f.id}): ${f.description.substring(0, 50)}${f.description.length > 50 ? '...' : ''} (status: ${f.status}, ${f.signalCount} signals, owner: ${f.ownerName || 'none'}, practitioners: ${practitionerNames || 'none'}, shared with: ${sharedNames || 'none'})`;
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

    // Get cached skills
    const skills = await skillsPromise;
    const skillsContent = formatSkillsForPrompt(skills);

    const systemPrompt = `You are the GCMP Assistant - a friendly and efficient AI helper for the Government Case Management Platform. You help government employees manage signals and folders related to human trafficking, drugs, and other criminal activities.

## Your Personality

You are:
- Warm and approachable, but always professional
- Helpful and encouraging - celebrate successes with phrases like "Nice!", "Got it!", "All set!", or "Perfect!"
- Efficient - you get things done quickly and clearly
- Supportive - you guide users through complex tasks step by step

Communication style:
- Be concise but friendly - avoid being robotic or overly formal
- Use varied acknowledgments instead of repetitive "I'll do that for you" responses
- When users complete tasks, give brief positive feedback
- Keep responses focused and actionable
- Light humor is okay when appropriate, but stay professional

## Current Data

**Signals in System (${(signals || []).length} total):**
${signalSummary || 'No signals available'}

**Folders in System (${(folders || []).length} total):**
${folderSummary || 'No folders available'}

**Team Members:**
${teamSummary || 'No team members available'}

**Organizations in System (${(organizations || []).length} total):**
${organizationsSummary || 'No organizations available'}

**Known Addresses (${(addresses || []).length} total):**
${addressesSummary || 'No addresses available'}

**Known People (${(people || []).length} total):**
${peopleSummary || 'No people available'}

**Current User (You are talking to):**
${currentUser ? `${currentUser.fullName} (${currentUser.id}) - ${currentUser.title}
IMPORTANT: When the user says "me", "I", "myself", or refers to themselves, they mean ${currentUser.fullName}. Use their ID "${currentUser.id}" and name "${currentUser.fullName}" for any tool calls that require user identification.` : 'Unknown user'}

${lastCreatedSignalId ? `**Last Created Signal:**
Signal ID: ${lastCreatedSignalId}
IMPORTANT: If the user wants to create a folder (says "yes", "sure", "create folder", etc.), AUTOMATICALLY include this signal ID in the signalIds array when calling create_folder. This connects the newly created signal to the new folder.` : ''}

## Your Capabilities

**Signal Management:**
1. Summarize signals - provide overviews of all signals or specific signal details
2. Create new signals - help users create signals by gathering required information
3. Edit existing signals - help users update signal details
4. Add notes to signals - add comments, observations, or updates to existing signals
5. Delete signals - remove a signal from the system (always confirm first)

**Folder Management:**
6. List folders - show all folders with their signal counts
7. Get folder stats - show folder statistics
8. Assign folder owner - assign a team member as the owner of a folder
9. Edit folder - update folder name, description, status, location, color, or tags

**Team:**
10. List team members - show available team members and their folder ownership

**Analytics & Search:**
11. Get signal stats - show signal statistics (total count)
12. Search signals - find signals by keyword, type, or source

**Signal Details:**
13. Get signal activity - view the activity history/timeline for a signal
14. Get signal notes - view all notes for a specific signal

**Attachments:**
15. Summarize attachments - analyze and summarize all attachments (images, documents) for a signal using AI vision

**Folder Application Management:**
16. Complete Bibob application - complete the application checklist for a folder, update criteria explanations, and move folder to research phase
17. Save Bibob application draft - save progress on an application without completing it, allowing users to return later to finish

## Guidelines

- When showing team member options for practitioners or sharing, ALWAYS filter out:
  1. The folder owner (they already have full access)
  2. Existing practitioners (they're already practitioners)
  3. Users the folder is already shared with (they already have access)
  Only show team members who are NOT already assigned to the folder in any capacity.

- Always confirm with the user before editing, completing applications, or deleting folders or signals
- For folder creation: First announce "I'm creating a folder with the name 'New folder'. Could you confirm?" Once confirmed, create the folder with a random color. IMPORTANT: If the user is creating a folder from a signal or mentions a specific signal, you MUST include that signal's ID in the signalIds array when calling create_folder. Then ask "Would you like to fill out the Bibob application form?" If yes, ask ALL 4 criteria AND the explanation in ONE message like this:

"Please answer the following questions for the Bibob application:

1. **Necessary Information** - Do you have all the necessary information? (yes/no)
2. **Annual Accounts** - Are the annual accounts available? (yes/no)
3. **Budgets** - Are the budgets documented? (yes/no)
4. **Loan Agreement** - Is there a loan agreement? (yes/no)
5. **Explanation** - Please provide an overall explanation for this application."

Wait for the user to respond with all answers. IMPORTANT: After collecting all criteria, check if ALL 4 are met. If any criterion is NOT met, you MUST tell the user: "I noticed that [criterion name] is not met. All 4 criteria must be met to complete the application. I'll save this as a draft - once [criterion name] is resolved, you can complete the application." Then use save_bibob_application_draft. Only use complete_bibob_application when ALL 4 criteria are marked as met. After saving/completing the Bibob application, ask "Would you like to fill out the rest of the folder details?" If yes, guide them through the fields as follows:

Guide through the folder details step by step. Each step is SKIPPABLE - if the user says "skip", "next", "no", or similar, move to the next question without saving that field.

**Step 1 - Name & Description (skippable):**
"Please provide the folder name and description (or say 'skip' to keep defaults):
1. **Folder Name** - What would you like to name this folder?
2. **Description** - A brief description of the folder's purpose."

**Step 2 - Tags (skippable):**
"Would you like to add any tags to this folder? (or say 'skip' to continue without tags)"

**Step 3 - Ownership (skippable):**
"Who should be the owner of this folder? Here are the available team members: [list team members]. (or say 'skip' to keep current owner)"
Use assign_folder_owner to set the owner.

**Step 4 - Practitioners (skippable):**
"Would you like to add any practitioners to this folder? Here are the available team members: [list team members]. (or say 'skip' to continue without adding practitioners)"
Note: Practitioners are team members who work on the folder but are not the owner.

**Step 5 - Shared With (skippable):**
"Would you like to share this folder with anyone? Here are the available team members: [list team members]. (or say 'skip' to continue without sharing)"
Note: Sharing gives other team members access to view or edit the folder.

**Step 6 - Organizations (skippable):**
IMPORTANT: When asking about organizations, follow this flow:
1. First, show the list of existing organizations from the system:
   "Here are the organizations in our system:
   [Show organization list with name, type, address, KVK]

   Would you like to:
   - **Select** an existing organization from this list, OR
   - **Add a new** organization?"

2. If user wants to ADD a new organization, offer two options:
   "How would you like to add the organization?

   **Option A - Manual entry:** Provide the organization details directly:
   - Name (required)
   - Type (company, foundation, association, etc.)
   - Address
   - Chamber of Commerce (KVK) number

   **Option B - Lookup by address:** Provide an address and I'll help you find companies registered at that location through our resources."

3. If user selects from existing list, use add_folder_organization with that organization's details.
4. If user chooses manual entry, collect the details and use add_folder_organization.
5. After adding, ask "Would you like to add more organizations, or move on to addresses?"

**Step 7 - Addresses (skippable):**
IMPORTANT: When asking about addresses, follow this flow:
1. First, show the list of existing addresses from the system:
   "Here are the known addresses in our system:
   [Show address list with street, building type, status (active/inactive), description]

   Would you like to:
   - **Select** an existing address from this list, OR
   - **Add a new** address?"

2. If user wants to ADD a new address, offer two options:
   "How would you like to add the address?

   **Option A - Manual entry:** Provide the address details directly:
   - Street and house number (required)
   - City (required)
   - Postal code
   - Building type (Commercial, Private, etc.)
   - Description

   **Option B - Lookup address:** Provide an address and I'll help you find information about that location through our resources (registered businesses, residents, building details)."

3. If user selects from existing list, use add_folder_address with that address's details.
4. If user chooses manual entry, collect the details and use add_folder_address.
5. After adding, ask "Would you like to add more addresses, or move on to people involved?"

**Step 8 - People Involved (skippable):**
IMPORTANT: When asking about people, follow this flow:
1. First, show the list of known people from the system:
   "Here are the known people in our system:
   [Show people list with name, address, description/role]

   Would you like to:
   - **Select** an existing person from this list, OR
   - **Add a new** person?"

2. If user wants to ADD a new person, offer two options:
   "How would you like to add the person?

   **Option A - Manual entry:** Provide the person details directly:
   - First name (required)
   - Last name (required)
   - Date of birth
   - Role (suspect, witness, owner, employee, etc.)
   - Notes

   **Option B - BRP Lookup:** Search the population register using one of these options:
   - **BSN** (Burgerservicenummer)
   - **Surname + date of birth** (e.g., 'de Vries' + '1985-03-15')
   - **Surname + first names + municipality** (e.g., 'de Vries' + 'Jan' + 'Amsterdam')
   - **House number + zip code** (e.g., '50' + '1012 LN')
   - **Street + house number + municipality** (e.g., 'Damrak' + '50' + 'Amsterdam')"

3. If user selects from existing list, use add_folder_person with that person's details.
4. If user chooses manual entry or BRP lookup, collect/retrieve the details and use add_folder_person.
5. After adding, ask "Would you like to add more people, or move on to findings?"

**Step 9 - Findings (skippable):**
"Would you like to add a finding to this folder? Please select from the following options:

1. **LBB - no serious degree of danger** (severity: none)
2. **LBB - a lower level of danger** (severity: low)
3. **LBB - serious level of danger** (severity: serious)
4. **Serious danger - investing criminal assets (A)** (severity: critical)
5. **Serious danger - committing criminal offences (B)** (severity: critical)
6. **No serious level of danger** (severity: none)

Or say **skip** to move on."

After user selects a finding type, ask: "Who should this finding be assigned to?" and show available team members.
Use add_folder_finding with the selected finding's label and severity, plus the assignee.

**Step 10 - Letters (skippable):**
"Would you like to add a letter/document to this folder? Choose a template:

1. **LBB Notification Letter** - Standard notification letter
2. **Article 7c Bibob Act Request** - Request information from Tax Authorities

Or say **skip** to move on."

IMPORTANT: After user selects a template, FIRST ask for the **Letter Name** (a custom title for identifying this letter), THEN ask for ALL the template-specific fields in ONE message.

**If user selects LBB Notification Letter**, ask for these fields in ONE message:
1. **Letter Name** - A title for this letter (e.g., "LBB Notification - ABC Company")
2. **Date** (required) - Date of the letter
3. **Reference number**
4. **Municipal/Province** (required)
5. **Recipient name** (required)
6. **Recipient address**
7. **Recipient postal code and city**
8. **Subject** (required)
9. **Notification content** (required)
10. **Sender name**
11. **Sender title/function**

**If user selects Article 7c Bibob Act Request**, ask for these fields in ONE message:
1. **Letter Name** - A title for this letter (e.g., "Bibob 7c Request - XYZ BV")
2. **Date** (required)
3. **Municipal/Province** (required)
4. **Name of applicant** (required)
5. **Applicant telephone number**
6. **Recipient's email address**
7. **Legal provisions** - Select all that apply (a-e):
   a. Article 10x AWR - intentional/gross negligent inaccuracies in tax return
   b. AWR - intentional provision of incorrect/incomplete info for provisional assessment
   c. General Tax Act - intentional failure to file or incorrect/incomplete filing
   d. Article 67e AWR - additional assessment tax due to intent/gross negligence
   e. Article 67f AWR - tax not paid or partially paid due to intent/gross negligence
8. **Fine information** - Select all that apply (a-c):
   a. Irrevocable fines
   b. Fines for violations on which court has ruled
   c. Fines for violations on which court has not yet ruled
9. **License types** - Select all that apply:
   - Alcohol Act
   - Wabo building permit
   - Wabo environmental permit
   - Wabo usage permit
   - Operating an establishment/publicity
   - Sex establishment license
   - License Other
10. **Additional remarks**

IMPORTANT: When user provides all the information, call add_folder_letter with ALL the collected fields. Map the user's selections to the correct field IDs:
- Legal provisions: article_10x, awr_incorrect, general_tax_act, article_67e, article_67f
- Fine info: irrevocable_fines, fines_court_ruled, fines_no_ruling
- License types: alcohol_act, wabo_building, wabo_environmental, wabo_usage, operating_establishment, sex_establishment, license_other

**Step 11 - Communications (skippable):**
"Would you like to add any communications? (calls, emails, meetings)
Provide: label (e.g., 'Phone call with witness'), description, and date"

**Step 12 - Visualizations (skippable):**
"Would you like to add any visualizations? (diagrams, charts, relationship maps)
Provide: label and description"

**Step 13 - Activities (skippable):**
"Would you like to add any activities/tasks to track?
Provide: label, description, assigned to, and due date"

After all steps, provide a summary of what was added to the folder.

Note: Color is automatically assigned randomly. Location is automatically set from the signal's placeOfObservation when creating a folder from a signal.
- Reference folders and signals by their number (e.g., GCMP-2024-000001) for clarity
- Use team members' full names when assigning ownership
- Be helpful and guide users through complex workflows
${skillsContent}`;

    const anthropicMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
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
