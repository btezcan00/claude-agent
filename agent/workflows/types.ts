/**
 * Workflow Type Definitions
 * 
 * Core types for the workflow engine that powers multi-step government processes.
 * Workflows are defined as code - testable, version-controlled, and deterministic.
 */

/**
 * Human-in-the-Loop checkpoint types
 */
export type HITLCheckpointType =
    | 'approval'      // User must approve before proceeding
    | 'input'         // User must provide missing information
    | 'verification'  // User must verify/confirm data
    | 'review';       // User should review but can auto-proceed

/**
 * HITL Checkpoint definition
 */
export interface HITLCheckpoint {
    type: HITLCheckpointType;
    message: string;                    // Message to show user
    required: boolean;                  // If false, can auto-proceed after timeout
    fields?: string[];                  // Fields needed (for 'input' type)
    timeout?: number;                   // Auto-proceed timeout in ms (for non-required)
}

/**
 * Condition for when a step should run
 */
export interface StepCondition {
    field: string;                      // Field to check (supports dot notation)
    operator: 'equals' | 'not_equals' | 'exists' | 'not_exists' | 'contains' | 'gt' | 'lt';
    value?: unknown;                    // Value to compare against
}

/**
 * Single step in a workflow
 */
export interface WorkflowStep {
    id: string;                         // Unique step identifier
    name: string;                       // Human-readable name
    description?: string;               // What this step does

    // Execution
    tool: string;                       // MCP tool to execute
    inputs: Record<string, unknown>;    // Input mapping (supports $ref syntax)
    outputs?: string[];                 // Output fields to capture

    // HITL
    hitl?: HITLCheckpoint;              // Human checkpoint before this step

    // Control flow
    condition?: StepCondition;          // Only run if condition is met
    optional?: boolean;                 // Skip if inputs unavailable
    retryOnFailure?: boolean;           // Retry once on failure

    // Sub-workflow
    subWorkflow?: string;               // Trigger another workflow
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
    id: string;                         // Unique workflow identifier
    name: string;                       // Human-readable name
    description: string;                // What this workflow does
    version: string;                    // Semantic version

    // Triggers
    triggers?: {
        keywords?: string[];            // Keywords that trigger this workflow
        intents?: string[];             // Intent classifications
        explicit?: boolean;             // Only trigger if explicitly requested
    };

    // Required inputs to start
    requiredInputs: {
        field: string;
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description: string;
        validation?: {
            enum?: string[];
            pattern?: string;
            min?: number;
            max?: number;
        };
    }[];

    // Optional inputs with defaults
    optionalInputs?: {
        field: string;
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description: string;
        default?: unknown;
    }[];

    // Steps
    steps: WorkflowStep[];

    // HITL at workflow level
    requiresApprovalToStart?: boolean;  // Need approval before any step
    requiresApprovalToComplete?: boolean; // Need approval after all steps

    // Metadata
    category?: string;                  // e.g., 'signals', 'folders', 'investigation'
    tags?: string[];
    estimatedDuration?: string;         // e.g., '2-3 minutes'
}

/**
 * Runtime state for a workflow execution
 */
export interface WorkflowExecutionState {
    workflowId: string;
    executionId: string;
    status: 'pending_input' | 'pending_approval' | 'running' | 'paused' | 'completed' | 'failed';

    // Current position
    currentStepIndex: number;
    currentStepId?: string;

    // Data
    inputs: Record<string, unknown>;    // Collected inputs
    outputs: Record<string, unknown>;   // Step outputs (keyed by step.id)
    stepResults: {
        stepId: string;
        status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
        result?: unknown;
        error?: string;
        startedAt?: Date;
        completedAt?: Date;
    }[];

    // HITL state
    pendingHITL?: {
        stepId: string;
        checkpoint: HITLCheckpoint;
        requestedAt: Date;
    };

    // Metadata
    startedAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    error?: string;
}

/**
 * Response from workflow engine
 */
export interface WorkflowResponse {
    executionId: string;
    status: WorkflowExecutionState['status'];

    // What happened
    completedSteps: string[];
    currentStep?: string;

    // HITL request (if any)
    hitlRequest?: {
        type: HITLCheckpointType;
        message: string;
        fields?: string[];
        stepId: string;
    };

    // Results
    outputs?: Record<string, unknown>;
    error?: string;

    // For AI to summarize
    summary: string;
}

/**
 * Reference syntax for step outputs
 * Examples:
 * - $step1.signalId -> outputs['step1'].signalId
 * - $inputs.description -> inputs.description
 * - $context.userId -> context.userId
 */
export function resolveReference(
    ref: unknown,
    inputs: Record<string, unknown>,
    outputs: Record<string, unknown>,
    context: Record<string, unknown>
): unknown {
    if (typeof ref !== 'string' || !ref.startsWith('$')) {
        return ref;
    }

    const path = ref.slice(1); // Remove $
    const parts = path.split('.');
    const source = parts[0];
    const rest = parts.slice(1);

    let value: unknown;

    if (source === 'inputs') {
        value = inputs;
    } else if (source === 'context') {
        value = context;
    } else {
        // Assume it's a step reference
        value = outputs[source];
    }

    // Navigate nested path
    for (const part of rest) {
        if (value && typeof value === 'object') {
            value = (value as Record<string, unknown>)[part];
        } else {
            return undefined;
        }
    }

    return value;
}

/**
 * Resolve all references in an inputs object
 */
export function resolveInputs(
    inputs: Record<string, unknown>,
    collectedInputs: Record<string, unknown>,
    outputs: Record<string, unknown>,
    context: Record<string, unknown>
): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === 'string' && value.startsWith('$')) {
            resolved[key] = resolveReference(value, collectedInputs, outputs, context);
        } else if (Array.isArray(value)) {
            resolved[key] = value.map(v =>
                typeof v === 'string' && v.startsWith('$')
                    ? resolveReference(v, collectedInputs, outputs, context)
                    : v
            );
        } else if (typeof value === 'object' && value !== null) {
            resolved[key] = resolveInputs(
                value as Record<string, unknown>,
                collectedInputs,
                outputs,
                context
            );
        } else {
            resolved[key] = value;
        }
    }

    return resolved;
}
