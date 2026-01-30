/**
 * Workflow Engine
 * 
 * Executes workflow definitions step-by-step with:
 * - Human-in-the-Loop checkpoints
 * - Reference resolution ($step1.signalId, etc.)
 * - Conditional execution
 * - Error handling and retry
 */

import {
    WorkflowDefinition,
    WorkflowStep,
    WorkflowExecutionState,
    WorkflowResponse,
    HITLCheckpoint,
    StepCondition,
    resolveInputs,
} from './types';
import { agentLogger } from '../agents/logger';

/**
 * Tool executor interface - implemented by the provider
 */
export interface ToolExecutor {
    executeTool(name: string, params: Record<string, unknown>): Promise<{
        success: boolean;
        result: unknown;
        error?: string;
    }>;
}

/**
 * Workflow Engine
 */
export class WorkflowEngine {
    private executions: Map<string, WorkflowExecutionState> = new Map();

    constructor(
        private workflows: Map<string, WorkflowDefinition>,
        private toolExecutor: ToolExecutor
    ) { }

    /**
     * Get a workflow by ID
     */
    getWorkflow(workflowId: string): WorkflowDefinition | undefined {
        return this.workflows.get(workflowId);
    }

    /**
     * List all available workflows
     */
    listWorkflows(): WorkflowDefinition[] {
        return Array.from(this.workflows.values());
    }

    /**
     * Find workflows that match keywords/intent
     */
    findMatchingWorkflows(text: string): WorkflowDefinition[] {
        const lowerText = text.toLowerCase();
        return this.listWorkflows().filter(wf => {
            // Check keywords
            if (wf.triggers?.keywords) {
                for (const keyword of wf.triggers.keywords) {
                    if (lowerText.includes(keyword.toLowerCase())) {
                        return true;
                    }
                }
            }
            return false;
        });
    }

    /**
     * Start a new workflow execution
     */
    async startWorkflow(
        workflowId: string,
        inputs: Record<string, unknown>,
        context: Record<string, unknown> = {}
    ): Promise<WorkflowResponse> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            return {
                executionId: '',
                status: 'failed',
                completedSteps: [],
                error: `Workflow '${workflowId}' not found`,
                summary: `Failed to start workflow: not found`,
            };
        }

        // Validate required inputs
        const missingInputs = this.validateInputs(workflow, inputs);
        if (missingInputs.length > 0) {
            return {
                executionId: '',
                status: 'pending_input',
                completedSteps: [],
                hitlRequest: {
                    type: 'input',
                    message: `Please provide the following information: ${missingInputs.join(', ')}`,
                    fields: missingInputs,
                    stepId: 'input_collection',
                },
                summary: `Waiting for required information: ${missingInputs.join(', ')}`,
            };
        }

        // Create execution state
        const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const state: WorkflowExecutionState = {
            workflowId,
            executionId,
            status: workflow.requiresApprovalToStart ? 'pending_approval' : 'running',
            currentStepIndex: 0,
            inputs,
            outputs: {},
            stepResults: workflow.steps.map(step => ({
                stepId: step.id,
                status: 'pending',
            })),
            startedAt: new Date(),
            updatedAt: new Date(),
        };

        // If approval required to start, return HITL request
        if (workflow.requiresApprovalToStart) {
            state.pendingHITL = {
                stepId: 'workflow_start',
                checkpoint: {
                    type: 'approval',
                    message: `Start workflow "${workflow.name}"? This will execute ${workflow.steps.length} step(s).`,
                    required: true,
                },
                requestedAt: new Date(),
            };
            this.executions.set(executionId, state);

            return {
                executionId,
                status: 'pending_approval',
                completedSteps: [],
                hitlRequest: {
                    type: 'approval',
                    message: state.pendingHITL.checkpoint.message,
                    stepId: 'workflow_start',
                },
                summary: `Workflow "${workflow.name}" ready to start. Waiting for approval.`,
            };
        }

        this.executions.set(executionId, state);
        return this.continueExecution(executionId, context);
    }

    /**
     * Validate that all required inputs are provided
     */
    private validateInputs(workflow: WorkflowDefinition, inputs: Record<string, unknown>): string[] {
        const missing: string[] = [];
        for (const req of workflow.requiredInputs) {
            if (inputs[req.field] === undefined || inputs[req.field] === null || inputs[req.field] === '') {
                missing.push(req.field);
            }
        }
        return missing;
    }

    /**
     * Provide HITL response and continue execution
     */
    async respondToHITL(
        executionId: string,
        response: {
            approved?: boolean;
            inputs?: Record<string, unknown>;
        },
        context: Record<string, unknown> = {}
    ): Promise<WorkflowResponse> {
        const state = this.executions.get(executionId);
        if (!state) {
            return {
                executionId,
                status: 'failed',
                completedSteps: [],
                error: 'Execution not found',
                summary: 'Workflow execution not found',
            };
        }

        // Handle denial
        if (response.approved === false) {
            state.status = 'failed';
            state.error = 'User declined to proceed';
            state.updatedAt = new Date();

            return {
                executionId,
                status: 'failed',
                completedSteps: state.stepResults.filter(s => s.status === 'completed').map(s => s.stepId),
                error: 'Workflow cancelled by user',
                summary: 'Workflow was cancelled.',
            };
        }

        // Merge any new inputs
        if (response.inputs) {
            state.inputs = { ...state.inputs, ...response.inputs };
        }

        // Clear pending HITL
        state.pendingHITL = undefined;
        state.status = 'running';
        state.updatedAt = new Date();

        return this.continueExecution(executionId, context);
    }

    /**
     * Continue executing the workflow from current step
     */
    private async continueExecution(
        executionId: string,
        context: Record<string, unknown>
    ): Promise<WorkflowResponse> {
        const state = this.executions.get(executionId);
        if (!state) {
            return {
                executionId,
                status: 'failed',
                completedSteps: [],
                error: 'Execution not found',
                summary: 'Workflow execution not found',
            };
        }

        const workflow = this.workflows.get(state.workflowId);
        if (!workflow) {
            return {
                executionId,
                status: 'failed',
                completedSteps: [],
                error: 'Workflow definition not found',
                summary: 'Workflow definition not found',
            };
        }

        agentLogger.log('info', 'workflow', `▶️ Continuing workflow: ${workflow.name}`, {
            executionId,
            currentStep: state.currentStepIndex,
            totalSteps: workflow.steps.length,
        });

        // Execute steps until we hit HITL or completion
        while (state.currentStepIndex < workflow.steps.length) {
            const step = workflow.steps[state.currentStepIndex];
            state.currentStepId = step.id;

            // Check condition
            if (step.condition && !this.evaluateCondition(step.condition, state.inputs, state.outputs)) {
                agentLogger.log('debug', 'workflow', `⏭️ Skipping step (condition not met): ${step.id}`);
                state.stepResults[state.currentStepIndex].status = 'skipped';
                state.currentStepIndex++;
                continue;
            }

            // Check HITL checkpoint
            if (step.hitl && step.hitl.required) {
                state.status = step.hitl.type === 'input' ? 'pending_input' : 'pending_approval';
                state.pendingHITL = {
                    stepId: step.id,
                    checkpoint: step.hitl,
                    requestedAt: new Date(),
                };
                state.updatedAt = new Date();

                const completedSteps = state.stepResults
                    .filter(s => s.status === 'completed')
                    .map(s => s.stepId);

                return {
                    executionId,
                    status: state.status,
                    completedSteps,
                    currentStep: step.name,
                    hitlRequest: {
                        type: step.hitl.type,
                        message: this.interpolateMessage(step.hitl.message, state),
                        fields: step.hitl.fields,
                        stepId: step.id,
                    },
                    outputs: state.outputs,
                    summary: `Waiting for ${step.hitl.type}: ${step.name}`,
                };
            }

            // Execute the step
            const stepResult = state.stepResults[state.currentStepIndex];
            stepResult.status = 'running';
            stepResult.startedAt = new Date();

            try {
                // Resolve inputs
                const resolvedInputs = resolveInputs(
                    step.inputs,
                    state.inputs,
                    state.outputs,
                    context
                );

                agentLogger.log('info', 'workflow', `🔧 Executing step: ${step.id}`, {
                    tool: step.tool,
                    inputs: resolvedInputs,
                });

                // Execute tool
                const result = await this.toolExecutor.executeTool(step.tool, resolvedInputs);

                if (!result.success) {
                    throw new Error(result.error || 'Tool execution failed');
                }

                // Store outputs
                state.outputs[step.id] = result.result;
                stepResult.status = 'completed';
                stepResult.result = result.result;
                stepResult.completedAt = new Date();

                agentLogger.log('info', 'workflow', `✅ Step completed: ${step.id}`, {
                    resultPreview: JSON.stringify(result.result).slice(0, 200),
                });

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);

                // Retry once if configured (check attempt count via error field)
                if (step.retryOnFailure && !stepResult.error) {
                    agentLogger.log('warn', 'workflow', `⚠️ Step failed, retrying: ${step.id}`, { error: errorMsg });
                    stepResult.error = 'retry_attempted';
                    continue;
                }

                stepResult.status = 'failed';
                stepResult.error = errorMsg;
                stepResult.completedAt = new Date();

                // If optional, continue; otherwise fail
                if (!step.optional) {
                    state.status = 'failed';
                    state.error = `Step '${step.id}' failed: ${errorMsg}`;
                    state.updatedAt = new Date();

                    return {
                        executionId,
                        status: 'failed',
                        completedSteps: state.stepResults.filter(s => s.status === 'completed').map(s => s.stepId),
                        currentStep: step.name,
                        error: state.error,
                        outputs: state.outputs,
                        summary: `Workflow failed at step "${step.name}": ${errorMsg}`,
                    };
                }

                agentLogger.log('warn', 'workflow', `⚠️ Optional step failed, continuing: ${step.id}`);
            }

            state.currentStepIndex++;
            state.updatedAt = new Date();
        }

        // All steps completed
        state.status = 'completed';
        state.completedAt = new Date();
        state.updatedAt = new Date();

        const completedSteps = state.stepResults
            .filter(s => s.status === 'completed')
            .map(s => s.stepId);

        agentLogger.log('info', 'workflow', `🎉 Workflow completed: ${workflow.name}`, {
            executionId,
            completedSteps,
        });

        return {
            executionId,
            status: 'completed',
            completedSteps,
            outputs: state.outputs,
            summary: this.generateCompletionSummary(workflow, state),
        };
    }

    /**
     * Evaluate a step condition
     */
    private evaluateCondition(
        condition: StepCondition,
        inputs: Record<string, unknown>,
        outputs: Record<string, unknown>
    ): boolean {
        // Parse field path (e.g., "inputs.signalId" or "create_signal.signalId")
        const parts = condition.field.split('.');
        let value: unknown;

        if (parts[0] === 'inputs') {
            value = parts.slice(1).reduce((obj, key) =>
                (obj && typeof obj === 'object') ? (obj as Record<string, unknown>)[key] : undefined,
                inputs as unknown
            );
        } else {
            value = parts.slice(1).reduce((obj, key) =>
                (obj && typeof obj === 'object') ? (obj as Record<string, unknown>)[key] : undefined,
                outputs[parts[0]] as unknown
            );
        }

        switch (condition.operator) {
            case 'exists':
                return value !== undefined && value !== null && value !== '';
            case 'not_exists':
                return value === undefined || value === null || value === '';
            case 'equals':
                return value === condition.value;
            case 'not_equals':
                return value !== condition.value;
            case 'contains':
                return typeof value === 'string' && value.includes(String(condition.value));
            case 'gt':
                return typeof value === 'number' && value > Number(condition.value);
            case 'lt':
                return typeof value === 'number' && value < Number(condition.value);
            default:
                return true;
        }
    }

    /**
     * Interpolate variables in HITL message
     */
    private interpolateMessage(message: string, state: WorkflowExecutionState): string {
        return message.replace(/\$\{([^}]+)\}/g, (_, path) => {
            const parts = path.split('.');
            let value: unknown;

            if (parts[0] === 'inputs') {
                value = state.inputs;
            } else {
                value = state.outputs[parts[0]];
            }

            for (const part of parts.slice(1)) {
                if (value && typeof value === 'object') {
                    value = (value as Record<string, unknown>)[part];
                } else {
                    return path;
                }
            }

            return String(value || path);
        });
    }

    /**
     * Generate completion summary
     */
    private generateCompletionSummary(
        workflow: WorkflowDefinition,
        state: WorkflowExecutionState
    ): string {
        const completed = state.stepResults.filter(s => s.status === 'completed');
        const skipped = state.stepResults.filter(s => s.status === 'skipped');

        let summary = `Completed "${workflow.name}" workflow:\n`;

        for (const stepResult of completed) {
            const step = workflow.steps.find(s => s.id === stepResult.stepId);
            const output = state.outputs[stepResult.stepId];
            summary += `• ${step?.name || stepResult.stepId}: Done`;

            // Add key output info
            if (output && typeof output === 'object') {
                const o = output as Record<string, unknown>;
                if (o.signalNumber) summary += ` (Signal: ${o.signalNumber})`;
                if (o.folderName) summary += ` (Folder: ${o.folderName})`;
                if (o.folderId) summary += ` (ID: ${o.folderId})`;
            }
            summary += '\n';
        }

        if (skipped.length > 0) {
            summary += `\nSkipped: ${skipped.map(s => s.stepId).join(', ')}`;
        }

        return summary;
    }

    /**
     * Get execution state
     */
    getExecution(executionId: string): WorkflowExecutionState | undefined {
        return this.executions.get(executionId);
    }

    /**
     * Cancel an execution
     */
    cancelExecution(executionId: string): boolean {
        const state = this.executions.get(executionId);
        if (!state) return false;

        state.status = 'failed';
        state.error = 'Cancelled by user';
        state.updatedAt = new Date();
        return true;
    }
}

/**
 * Create a workflow registry from workflow definitions
 */
export function createWorkflowRegistry(workflows: WorkflowDefinition[]): Map<string, WorkflowDefinition> {
    const registry = new Map<string, WorkflowDefinition>();
    for (const wf of workflows) {
        registry.set(wf.id, wf);
    }
    return registry;
}
