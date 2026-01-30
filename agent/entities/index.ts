/**
 * Entity Module
 * 
 * Simple, state-aware entity management.
 * Provides the AI with context about entity lifecycles.
 */

export * from './types';
export * from './definitions';

import {
    EntityDefinition,
    EntityField,
    generateProgressSummary,
    computeMissingFields,
    getAvailableTransitions,
} from './types';
import { entityDefinitions, getEntityDefinition } from './definitions';

/**
 * Entity context for AI - what it needs to know about an entity
 */
export interface EntityContext {
    type: string;
    id: string;
    state: string;
    stateName: string;
    stateDescription: string;
    completionPercent: number;
    missingFields: { name: string; description: string }[];
    nextSteps: { action: string; description: string; requiresApproval: boolean }[];
    isComplete: boolean;
    suggestedAction?: string;
}

/**
 * Build context for an entity that AI can use
 */
export function buildEntityContext(
    type: string,
    entity: Record<string, unknown>,
    currentState?: string
): EntityContext | null {
    const definition = getEntityDefinition(type);
    if (!definition) return null;

    const state = currentState || definition.initialState;
    const progress = generateProgressSummary(definition, entity, state);

    // Determine suggested action
    let suggestedAction: string | undefined;
    if (progress.missingFields.length > 0) {
        suggestedAction = `Fill in missing fields: ${progress.missingFields.map(f => f.name).join(', ')}`;
    } else if (progress.nextSteps.length > 0) {
        const nextStep = progress.nextSteps[0];
        suggestedAction = nextStep.description;
    }

    return {
        type,
        id: entity.id as string || 'unknown',
        state,
        stateName: progress.state.name,
        stateDescription: progress.state.description,
        completionPercent: progress.completionPercent,
        missingFields: progress.missingFields.map(f => ({
            name: f.name,
            description: f.description,
        })),
        nextSteps: progress.nextSteps.map(t => ({
            action: t.action,
            description: t.description,
            requiresApproval: t.requiresHITL || false,
        })),
        isComplete: progress.isComplete,
        suggestedAction,
    };
}

/**
 * Build context summary for multiple entities
 */
export function buildEntitiesSummary(
    entities: { type: string; data: Record<string, unknown>; state?: string }[]
): {
    total: number;
    byType: Record<string, number>;
    needsAttention: EntityContext[];
    summary: string;
} {
    const contexts: EntityContext[] = [];
    const byType: Record<string, number> = {};

    for (const entity of entities) {
        byType[entity.type] = (byType[entity.type] || 0) + 1;
        const ctx = buildEntityContext(entity.type, entity.data, entity.state);
        if (ctx) contexts.push(ctx);
    }

    // Entities that need attention (incomplete or have next steps)
    const needsAttention = contexts.filter(c =>
        !c.isComplete && (c.missingFields.length > 0 || c.completionPercent < 100)
    );

    // Generate human-readable summary
    const summaryParts: string[] = [];
    for (const [type, count] of Object.entries(byType)) {
        const incomplete = contexts.filter(c => c.type === type && !c.isComplete).length;
        if (incomplete > 0) {
            summaryParts.push(`${count} ${type}(s) (${incomplete} need attention)`);
        } else {
            summaryParts.push(`${count} ${type}(s)`);
        }
    }

    return {
        total: entities.length,
        byType,
        needsAttention,
        summary: summaryParts.join(', ') || 'No entities',
    };
}

/**
 * Check if an action requires HITL approval
 */
export function requiresApproval(entityType: string, action: string): boolean {
    const definition = getEntityDefinition(entityType);
    if (!definition) return true; // Safe default

    const transition = definition.transitions.find(t => t.action === action);
    return transition?.requiresHITL || false;
}

/**
 * Get all actions that require HITL for any entity type
 */
export function getHITLActions(): string[] {
    const actions = new Set<string>();
    for (const def of entityDefinitions) {
        for (const t of def.transitions) {
            if (t.requiresHITL) {
                actions.add(t.action);
            }
        }
    }
    return Array.from(actions);
}

/**
 * Generate a prompt snippet describing entity states for the AI
 */
export function generateEntityStatePrompt(): string {
    const lines: string[] = ['## Entity States & Lifecycle\n'];

    for (const def of entityDefinitions) {
        lines.push(`### ${def.name}`);
        lines.push(`${def.description}\n`);

        lines.push('**States:**');
        for (const state of def.states) {
            const marker = state.isTerminal ? '🔒' : '○';
            lines.push(`- ${marker} ${state.name}: ${state.description}`);
        }

        lines.push('\n**Progress Flow:**');
        const flow = def.states
            .filter(s => !s.isTerminal)
            .map(s => s.name)
            .join(' → ');
        lines.push(flow + '\n');

        // HITL actions
        const hitlActions = def.transitions.filter(t => t.requiresHITL);
        if (hitlActions.length > 0) {
            lines.push('**⚠️ Requires Approval:**');
            for (const t of hitlActions) {
                lines.push(`- ${t.action}: ${t.description}`);
            }
        }
        lines.push('');
    }

    return lines.join('\n');
}
