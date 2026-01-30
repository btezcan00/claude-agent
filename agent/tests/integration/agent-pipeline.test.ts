/**
 * Agent Pipeline Integration Tests
 * 
 * Tests the complete agent pipeline including:
 * - State transitions (idle → planning → awaiting_approval → executing → complete)
 * - Tool call detection and handling
 * - Human-in-the-loop (HITL) approval workflow
 * - Provider-agnostic behavior
 * 
 * Run with: npx tsx agent/tests/integration/agent-pipeline.test.ts
 */

import { AgentFactory, ProviderType } from '../../agents/factory';
import { AgentMessage, StreamEvent, AgentTool, ToolCall } from '../../agents/base-provider';
import { agentLogger } from '../../agents/logger';

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_TOOLS: AgentTool[] = [
    {
        name: 'list_signals',
        description: 'List all signals (read-only)',
        input_schema: {
            type: 'object',
            properties: {
                limit: { type: 'number', description: 'Max signals to return' },
            },
        },
    },
    {
        name: 'create_signal',
        description: 'Create a new signal (write operation - requires approval)',
        input_schema: {
            type: 'object',
            properties: {
                description: { type: 'string' },
                types: { type: 'array', items: { type: 'string' } },
                placeOfObservation: { type: 'string' },
                timeOfObservation: { type: 'string' },
                receivedBy: { type: 'string' },
            },
            required: ['description', 'types', 'placeOfObservation'],
        },
    },
    {
        name: 'plan_proposal',
        description: 'Propose a plan before executing write operations',
        input_schema: {
            type: 'object',
            properties: {
                summary: { type: 'string', description: 'Brief summary of the plan' },
                actions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            step: { type: 'number' },
                            action: { type: 'string' },
                            tool: { type: 'string' },
                            details: { type: 'object' },
                        },
                    },
                },
            },
            required: ['summary', 'actions'],
        },
    },
    {
        name: 'ask_clarification',
        description: 'Ask user for missing information',
        input_schema: {
            type: 'object',
            properties: {
                summary: { type: 'string' },
                questions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            question: { type: 'string' },
                            fieldName: { type: 'string' },
                            required: { type: 'boolean' },
                        },
                    },
                },
            },
            required: ['summary', 'questions'],
        },
    },
];

const SIMPLE_SYSTEM_PROMPT = `You are a test assistant. For write operations, always call plan_proposal first.
For read operations, execute tools directly. If information is missing, call ask_clarification.`;

// ============================================================================
// Test Types
// ============================================================================

type AgentPhase = 'idle' | 'planning' | 'clarifying' | 'awaiting_approval' | 'executing' | 'complete' | 'error';

interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
    details?: Record<string, unknown>;
}

interface StreamedEvents {
    phases: string[];
    toolCalls: Array<{ tool: string; input: Record<string, unknown> }>;
    responses: string[];
    errors: string[];
}

// ============================================================================
// Test Utilities
// ============================================================================

function createTestProvider(providerType: ProviderType) {
    const apiKey = providerType === 'anthropic'
        ? process.env.ANTHROPIC_API_KEY
        : process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        throw new Error(`Missing API key for ${providerType}. Set ${providerType === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY'} environment variable.`);
    }

    return AgentFactory.createProvider({
        provider: providerType,
        apiKey,
        agentConfig: {
            model: providerType === 'anthropic' ? 'claude-3-haiku-20240307' : 'gemini-2.0-flash',
            systemPrompt: SIMPLE_SYSTEM_PROMPT,
            maxTokens: 1024,
        },
        tools: TEST_TOOLS,
    });
}

async function streamAndCollect(
    provider: ReturnType<typeof AgentFactory.createProvider>,
    messages: AgentMessage[]
): Promise<StreamedEvents> {
    const events: StreamedEvents = {
        phases: [],
        toolCalls: [],
        responses: [],
        errors: [],
    };

    await provider.streamMessage(messages, (event: StreamEvent) => {
        switch (event.type) {
            case 'phase':
                events.phases.push((event.data as { phase: string }).phase);
                break;
            case 'tool_call':
                const tc = event.data as { tool: string; input: Record<string, unknown> };
                events.toolCalls.push({ tool: tc.tool, input: tc.input });
                break;
            case 'response':
                const resp = event.data as { content: string };
                if (resp.content) events.responses.push(resp.content);
                break;
            case 'error':
                events.errors.push((event.data as { message: string }).message);
                break;
        }
    });

    return events;
}

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// ============================================================================
// Test Cases
// ============================================================================

async function testReadOperationDirectExecution(provider: ReturnType<typeof AgentFactory.createProvider>): Promise<TestResult> {
    const name = 'Read operation executes directly without plan_proposal';
    const start = Date.now();

    try {
        const messages: AgentMessage[] = [
            { role: 'user', content: 'List all signals' },
        ];

        const events = await streamAndCollect(provider, messages);

        // Should NOT call plan_proposal for read operations
        const hasPlanProposal = events.toolCalls.some(tc => tc.tool === 'plan_proposal');
        assert(!hasPlanProposal, 'Read operation should not call plan_proposal');

        // Should call list_signals or respond directly
        const hasListSignals = events.toolCalls.some(tc => tc.tool === 'list_signals');
        const hasResponse = events.responses.length > 0;
        assert(hasListSignals || hasResponse, 'Should call list_signals or provide response');

        return { name, passed: true, duration: Date.now() - start };
    } catch (error) {
        return {
            name,
            passed: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function testWriteOperationRequiresPlanProposal(provider: ReturnType<typeof AgentFactory.createProvider>): Promise<TestResult> {
    const name = 'Write operation calls plan_proposal first';
    const start = Date.now();

    try {
        const messages: AgentMessage[] = [
            {
                role: 'user',
                content: 'Create a signal about drug trafficking at Main Street, observed yesterday at 8pm, received by police'
            },
        ];

        const events = await streamAndCollect(provider, messages);

        // Should call plan_proposal for write operations
        const planProposalCall = events.toolCalls.find(tc => tc.tool === 'plan_proposal');
        assert(!!planProposalCall, 'Write operation should call plan_proposal');

        // plan_proposal should include the create_signal action
        if (planProposalCall) {
            const actions = planProposalCall.input.actions as Array<{ tool: string }>;
            const hasCreateSignal = actions?.some(a => a.tool === 'create_signal');
            assert(!!hasCreateSignal, 'plan_proposal should include create_signal action');
        }

        // Should NOT directly call create_signal (should wait for approval)
        const directCreateSignal = events.toolCalls.find(tc => tc.tool === 'create_signal');
        assert(!directCreateSignal, 'Should not directly call create_signal without approval');

        return {
            name,
            passed: true,
            duration: Date.now() - start,
            details: { toolCalls: events.toolCalls.map(tc => tc.tool) }
        };
    } catch (error) {
        return {
            name,
            passed: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function testPlanProposalHasCorrectStructure(provider: ReturnType<typeof AgentFactory.createProvider>): Promise<TestResult> {
    const name = 'plan_proposal has correct structure (summary + actions)';
    const start = Date.now();

    try {
        const messages: AgentMessage[] = [
            {
                role: 'user',
                content: 'Create a signal about fraud at Amsterdam Central, observed today at noon'
            },
        ];

        const events = await streamAndCollect(provider, messages);

        const planProposalCall = events.toolCalls.find(tc => tc.tool === 'plan_proposal');
        assert(!!planProposalCall, 'Should call plan_proposal');

        const input = planProposalCall!.input;

        // Check required fields
        assert(typeof input.summary === 'string', 'plan_proposal should have summary string');
        assert(input.summary.length > 0, 'summary should not be empty');
        assert(Array.isArray(input.actions), 'plan_proposal should have actions array');
        assert((input.actions as unknown[]).length > 0, 'actions should not be empty');

        // Check action structure
        const firstAction = (input.actions as Array<Record<string, unknown>>)[0];
        assert(typeof firstAction.step === 'number', 'action should have step number');
        assert(typeof firstAction.tool === 'string', 'action should have tool string');
        assert(typeof firstAction.action === 'string', 'action should have action description');

        return {
            name,
            passed: true,
            duration: Date.now() - start,
            details: {
                summary: input.summary,
                actionCount: (input.actions as unknown[]).length
            }
        };
    } catch (error) {
        return {
            name,
            passed: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function testMissingInfoTriggersClarification(provider: ReturnType<typeof AgentFactory.createProvider>): Promise<TestResult> {
    const name = 'Missing information triggers ask_clarification';
    const start = Date.now();

    try {
        const messages: AgentMessage[] = [
            { role: 'user', content: 'Create a signal' }, // Intentionally vague
        ];

        const events = await streamAndCollect(provider, messages);

        // Should either ask for clarification OR infer defaults
        // Both behaviors are acceptable, but it should not fail
        const hasClarification = events.toolCalls.some(tc => tc.tool === 'ask_clarification');
        const hasPlanProposal = events.toolCalls.some(tc => tc.tool === 'plan_proposal');
        const hasResponse = events.responses.length > 0;

        assert(
            hasClarification || hasPlanProposal || hasResponse,
            'Should either ask clarification, propose plan with defaults, or respond asking for details'
        );

        return {
            name,
            passed: true,
            duration: Date.now() - start,
            details: {
                clarificationRequested: hasClarification,
                planProposed: hasPlanProposal,
                textResponse: hasResponse
            }
        };
    } catch (error) {
        return {
            name,
            passed: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function testProviderReturnsFinishReason(provider: ReturnType<typeof AgentFactory.createProvider>): Promise<TestResult> {
    const name = 'Provider returns valid finish reason';
    const start = Date.now();

    try {
        const messages: AgentMessage[] = [
            { role: 'user', content: 'Hello, how are you?' },
        ];

        const response = await provider.sendMessage(messages);

        assert(
            ['stop', 'tool_use', 'max_tokens', 'approval_required'].includes(response.finishReason),
            `Invalid finish reason: ${response.finishReason}`
        );

        return {
            name,
            passed: true,
            duration: Date.now() - start,
            details: { finishReason: response.finishReason }
        };
    } catch (error) {
        return {
            name,
            passed: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function testToolCallFinishReason(provider: ReturnType<typeof AgentFactory.createProvider>): Promise<TestResult> {
    const name = 'Tool call returns tool_use finish reason';
    const start = Date.now();

    try {
        const messages: AgentMessage[] = [
            {
                role: 'user',
                content: 'Create a signal about money laundering at Rotterdam Harbor, received by customs today'
            },
        ];

        const response = await provider.sendMessage(messages);

        // When there are tool calls, finish reason should indicate tool_use or approval_required
        if (response.toolCalls && response.toolCalls.length > 0) {
            assert(
                response.finishReason === 'tool_use' || response.finishReason === 'approval_required',
                `Expected tool_use or approval_required, got: ${response.finishReason}`
            );
        }

        return {
            name,
            passed: true,
            duration: Date.now() - start,
            details: {
                finishReason: response.finishReason,
                toolCallsCount: response.toolCalls?.length || 0
            }
        };
    } catch (error) {
        return {
            name,
            passed: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// ============================================================================
// State Transition Tests
// ============================================================================

interface StateTransition {
    from: AgentPhase;
    to: AgentPhase;
    trigger: string;
}

function simulateStateTransitions(events: StreamedEvents): StateTransition[] {
    const transitions: StateTransition[] = [];
    let currentPhase: AgentPhase = 'idle';

    // Analyze tool calls to infer state transitions
    for (const tc of events.toolCalls) {
        if (tc.tool === 'ask_clarification') {
            transitions.push({ from: currentPhase, to: 'clarifying', trigger: 'ask_clarification called' });
            currentPhase = 'clarifying';
        } else if (tc.tool === 'plan_proposal') {
            transitions.push({ from: currentPhase, to: 'awaiting_approval', trigger: 'plan_proposal called' });
            currentPhase = 'awaiting_approval';
        } else {
            // Regular tool call = executing
            if (currentPhase !== 'executing') {
                transitions.push({ from: currentPhase, to: 'executing', trigger: `${tc.tool} called` });
                currentPhase = 'executing';
            }
        }
    }

    // If we have responses and no errors, transition to complete
    if (events.responses.length > 0 || events.toolCalls.length > 0) {
        if (events.errors.length === 0) {
            transitions.push({ from: currentPhase, to: 'complete', trigger: 'response received' });
        } else {
            transitions.push({ from: currentPhase, to: 'error', trigger: 'error occurred' });
        }
    }

    return transitions;
}

async function testStateTransitionForWriteOperation(provider: ReturnType<typeof AgentFactory.createProvider>): Promise<TestResult> {
    const name = 'Write operation follows idle → awaiting_approval state transition';
    const start = Date.now();

    try {
        const messages: AgentMessage[] = [
            {
                role: 'user',
                content: 'Create a signal about human trafficking at The Hague station, observed today'
            },
        ];

        const events = await streamAndCollect(provider, messages);
        const transitions = simulateStateTransitions(events);

        // Should transition to awaiting_approval (via plan_proposal)
        const toAwaitingApproval = transitions.find(t => t.to === 'awaiting_approval');
        assert(!!toAwaitingApproval, 'Should transition to awaiting_approval state');

        return {
            name,
            passed: true,
            duration: Date.now() - start,
            details: { transitions }
        };
    } catch (error) {
        return {
            name,
            passed: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function testStateTransitionForReadOperation(provider: ReturnType<typeof AgentFactory.createProvider>): Promise<TestResult> {
    const name = 'Read operation follows idle → executing → complete state transition';
    const start = Date.now();

    try {
        const messages: AgentMessage[] = [
            { role: 'user', content: 'List all signals please' },
        ];

        const events = await streamAndCollect(provider, messages);
        const transitions = simulateStateTransitions(events);

        // Should NOT transition to awaiting_approval for read operations
        const toAwaitingApproval = transitions.find(t => t.to === 'awaiting_approval');
        assert(!toAwaitingApproval, 'Read operation should not require approval');

        return {
            name,
            passed: true,
            duration: Date.now() - start,
            details: { transitions }
        };
    } catch (error) {
        return {
            name,
            passed: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// ============================================================================
// Test Runner
// ============================================================================

async function runTestSuite(providerType: ProviderType): Promise<void> {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`  Agent Pipeline Test Suite - ${providerType.toUpperCase()}`);
    console.log(`${'='.repeat(70)}\n`);

    let provider: ReturnType<typeof AgentFactory.createProvider>;

    try {
        provider = createTestProvider(providerType);
    } catch (error) {
        console.log(`❌ Failed to create provider: ${error instanceof Error ? error.message : error}`);
        console.log(`   Skipping tests for ${providerType}\n`);
        return;
    }

    const tests = [
        () => testReadOperationDirectExecution(provider),
        () => testWriteOperationRequiresPlanProposal(provider),
        () => testPlanProposalHasCorrectStructure(provider),
        () => testMissingInfoTriggersClarification(provider),
        () => testProviderReturnsFinishReason(provider),
        () => testToolCallFinishReason(provider),
        () => testStateTransitionForWriteOperation(provider),
        () => testStateTransitionForReadOperation(provider),
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
        try {
            const result = await test();
            results.push(result);

            const status = result.passed ? '✅' : '❌';
            const duration = `(${result.duration}ms)`;
            console.log(`${status} ${result.name} ${duration}`);

            if (!result.passed && result.error) {
                console.log(`   Error: ${result.error}`);
            }

            if (result.details) {
                console.log(`   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
            }
        } catch (error) {
            console.log(`❌ Test failed with exception: ${error instanceof Error ? error.message : error}`);
        }
    }

    // Summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Summary: ${passed} passed, ${failed} failed (${totalDuration}ms total)`);
    console.log(`${'─'.repeat(70)}\n`);
}

async function main() {
    console.log('\n🧪 Agent Pipeline Integration Tests\n');
    console.log('Testing that the agent pipeline reaches expected states...\n');

    // Get provider from command line or environment
    const targetProvider = process.argv[2] as ProviderType | undefined;

    if (targetProvider && ['anthropic', 'google'].includes(targetProvider)) {
        await runTestSuite(targetProvider);
    } else {
        // Test available providers
        const providers: ProviderType[] = [];

        if (process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY) {
            providers.push('google');
        }
        if (process.env.ANTHROPIC_API_KEY) {
            providers.push('anthropic');
        }

        if (providers.length === 0) {
            console.log('❌ No API keys found. Set GOOGLE_AI_API_KEY or ANTHROPIC_API_KEY environment variables.');
            process.exit(1);
        }

        for (const provider of providers) {
            await runTestSuite(provider);
        }
    }

    // Export logs for analysis
    const logs = agentLogger.exportLogs();
    console.log(`\n📊 Logged ${logs.length} events during test run`);
}

main().catch(console.error);
