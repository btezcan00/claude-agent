/**
 * Workflow Module
 * 
 * Exports all workflow definitions and the workflow engine.
 * 
 * Architecture:
 * - Workflows are defined as code (testable, version-controlled)
 * - AI handles conversation and information gathering
 * - Workflow engine executes steps deterministically
 * - HITL checkpoints for approvals and input
 */

// Types
export * from './types';

// Engine
export { WorkflowEngine, createWorkflowRegistry } from './engine';
export type { ToolExecutor } from './engine';

// Workflow definitions
export { signalWorkflows, createSignalWorkflow, signalToFolderWorkflow, fullInvestigationWorkflow, addSignalToFolderWorkflow } from './signal-workflows';
export { folderWorkflows, createFolderWorkflow, assignTeamWorkflow, completeBibobWorkflow, addFolderContentWorkflow } from './folder-workflows';

// All workflows combined
import { signalWorkflows } from './signal-workflows';
import { folderWorkflows } from './folder-workflows';

export const allWorkflows = [
    ...signalWorkflows,
    ...folderWorkflows,
];

/**
 * Get workflow by ID
 */
export function getWorkflowById(id: string) {
    return allWorkflows.find(wf => wf.id === id);
}

/**
 * Find workflows matching keywords
 */
export function findWorkflowsByKeywords(text: string) {
    const lowerText = text.toLowerCase();
    return allWorkflows.filter(wf => {
        if (wf.triggers?.keywords) {
            return wf.triggers.keywords.some(kw => lowerText.includes(kw.toLowerCase()));
        }
        return false;
    });
}

/**
 * Get all workflows for a category
 */
export function getWorkflowsByCategory(category: string) {
    return allWorkflows.filter(wf => wf.category === category);
}
