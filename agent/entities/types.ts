/**
 * Entity State Definitions
 * 
 * Simple, extensible definitions for entity lifecycles.
 * The AI uses these to understand where entities are and what's next.
 */

/**
 * Entity types in the system
 */
export type EntityType = 'signal' | 'folder' | 'application';

/**
 * Field definition for an entity
 */
export interface EntityField {
    name: string;
    required: boolean;
    description: string;
    type: 'string' | 'array' | 'date' | 'reference' | 'enum';
    enumValues?: string[];
    referenceType?: EntityType;
}

/**
 * State definition for an entity
 */
export interface EntityState {
    id: string;
    name: string;
    description: string;
    isTerminal?: boolean;  // Can't progress further (closed, deleted, etc.)
}

/**
 * Transition between states
 */
export interface StateTransition {
    from: string;
    to: string;
    action: string;         // Tool/action name
    description: string;
    requiresHITL?: boolean; // Needs human approval
    conditions?: string[];  // What must be true to transition
}

/**
 * Complete entity definition
 */
export interface EntityDefinition {
    type: EntityType;
    name: string;
    description: string;
    fields: EntityField[];
    states: EntityState[];
    transitions: StateTransition[];
    initialState: string;
}

/**
 * Compute what's missing from an entity
 */
export function computeMissingFields(
    definition: EntityDefinition,
    entity: Record<string, unknown>
): EntityField[] {
    return definition.fields.filter(field => {
        if (!field.required) return false;
        const value = entity[field.name];
        if (value === undefined || value === null) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        return false;
    });
}

/**
 * Get available transitions from current state
 */
export function getAvailableTransitions(
    definition: EntityDefinition,
    currentState: string
): StateTransition[] {
    return definition.transitions.filter(t => t.from === currentState);
}

/**
 * Check if transition conditions are met
 */
export function canTransition(
    transition: StateTransition,
    entity: Record<string, unknown>,
    context: Record<string, unknown>
): { canTransition: boolean; missingConditions: string[] } {
    if (!transition.conditions || transition.conditions.length === 0) {
        return { canTransition: true, missingConditions: [] };
    }

    const missing: string[] = [];
    for (const condition of transition.conditions) {
        // Simple condition evaluation: "field.exists" or "field.notEmpty"
        const [field, check] = condition.split('.');
        const value = entity[field];

        if (check === 'exists' && (value === undefined || value === null)) {
            missing.push(`${field} is required`);
        }
        if (check === 'notEmpty' && (!value || (Array.isArray(value) && value.length === 0))) {
            missing.push(`${field} must not be empty`);
        }
    }

    return { canTransition: missing.length === 0, missingConditions: missing };
}

/**
 * Generate a progress summary for an entity
 */
export function generateProgressSummary(
    definition: EntityDefinition,
    entity: Record<string, unknown>,
    currentState: string
): {
    state: EntityState;
    completionPercent: number;
    missingFields: EntityField[];
    nextSteps: StateTransition[];
    isComplete: boolean;
} {
    const state = definition.states.find(s => s.id === currentState);
    const missingFields = computeMissingFields(definition, entity);
    const nextSteps = getAvailableTransitions(definition, currentState);

    // Calculate completion based on required fields filled
    const requiredFields = definition.fields.filter(f => f.required);
    const filledRequired = requiredFields.length - missingFields.length;
    const completionPercent = requiredFields.length > 0
        ? Math.round((filledRequired / requiredFields.length) * 100)
        : 100;

    return {
        state: state || { id: currentState, name: currentState, description: 'Unknown state' },
        completionPercent,
        missingFields,
        nextSteps,
        isComplete: state?.isTerminal || false,
    };
}
