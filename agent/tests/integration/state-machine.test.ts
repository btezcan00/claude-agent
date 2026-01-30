/**
 * Agent State Machine Unit Tests
 * 
 * Tests the expected state transitions without making actual API calls.
 * These tests validate the state machine logic for the HITL workflow.
 * 
 * Run with: npx tsx agent/tests/integration/state-machine.test.ts
 */

// ============================================================================
// State Machine Definition
// ============================================================================

type AgentPhase =
    | 'idle'
    | 'planning'
    | 'clarifying'
    | 'awaiting_approval'
    | 'executing'
    | 'complete'
    | 'error';

type AgentEvent =
    | 'USER_MESSAGE'
    | 'CLARIFICATION_NEEDED'
    | 'CLARIFICATION_RECEIVED'
    | 'PLAN_PROPOSED'
    | 'PLAN_APPROVED'
    | 'PLAN_REJECTED'
    | 'TOOL_EXECUTED'
    | 'ALL_TOOLS_COMPLETE'
    | 'ERROR_OCCURRED'
    | 'RESET';

interface StateTransition {
    from: AgentPhase;
    event: AgentEvent;
    to: AgentPhase;
}

// Valid state transitions
const STATE_MACHINE: StateTransition[] = [
    // From idle
    { from: 'idle', event: 'USER_MESSAGE', to: 'planning' },

    // From planning
    { from: 'planning', event: 'CLARIFICATION_NEEDED', to: 'clarifying' },
    { from: 'planning', event: 'PLAN_PROPOSED', to: 'awaiting_approval' },
    { from: 'planning', event: 'TOOL_EXECUTED', to: 'executing' }, // For read-only operations
    { from: 'planning', event: 'ERROR_OCCURRED', to: 'error' },

    // From clarifying
    { from: 'clarifying', event: 'CLARIFICATION_RECEIVED', to: 'planning' },
    { from: 'clarifying', event: 'RESET', to: 'idle' },

    // From awaiting_approval
    { from: 'awaiting_approval', event: 'PLAN_APPROVED', to: 'executing' },
    { from: 'awaiting_approval', event: 'PLAN_REJECTED', to: 'idle' },
    { from: 'awaiting_approval', event: 'ERROR_OCCURRED', to: 'error' },

    // From executing
    { from: 'executing', event: 'TOOL_EXECUTED', to: 'executing' }, // Multiple tools
    { from: 'executing', event: 'ALL_TOOLS_COMPLETE', to: 'complete' },
    { from: 'executing', event: 'ERROR_OCCURRED', to: 'error' },

    // From complete
    { from: 'complete', event: 'USER_MESSAGE', to: 'planning' },
    { from: 'complete', event: 'RESET', to: 'idle' },

    // From error
    { from: 'error', event: 'RESET', to: 'idle' },
    { from: 'error', event: 'USER_MESSAGE', to: 'planning' },
];

function canTransition(from: AgentPhase, event: AgentEvent): boolean {
    return STATE_MACHINE.some(t => t.from === from && t.event === event);
}

function getNextState(from: AgentPhase, event: AgentEvent): AgentPhase | null {
    const transition = STATE_MACHINE.find(t => t.from === from && t.event === event);
    return transition ? transition.to : null;
}

// ============================================================================
// Test Utilities
// ============================================================================

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

function runTest(name: string, testFn: () => void): TestResult {
    try {
        testFn();
        return { name, passed: true };
    } catch (error) {
        return { name, passed: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// ============================================================================
// Test Cases
// ============================================================================

const tests: Array<{ name: string; fn: () => void }> = [
    {
        name: 'Initial state is idle',
        fn: () => {
            const initialState: AgentPhase = 'idle';
            assert(initialState === 'idle', 'Initial state should be idle');
        },
    },
    {
        name: 'User message transitions idle → planning',
        fn: () => {
            const nextState = getNextState('idle', 'USER_MESSAGE');
            assert(nextState === 'planning', `Expected planning, got ${nextState}`);
        },
    },
    {
        name: 'Clarification needed transitions planning → clarifying',
        fn: () => {
            const nextState = getNextState('planning', 'CLARIFICATION_NEEDED');
            assert(nextState === 'clarifying', `Expected clarifying, got ${nextState}`);
        },
    },
    {
        name: 'Clarification received transitions clarifying → planning',
        fn: () => {
            const nextState = getNextState('clarifying', 'CLARIFICATION_RECEIVED');
            assert(nextState === 'planning', `Expected planning, got ${nextState}`);
        },
    },
    {
        name: 'Plan proposed transitions planning → awaiting_approval',
        fn: () => {
            const nextState = getNextState('planning', 'PLAN_PROPOSED');
            assert(nextState === 'awaiting_approval', `Expected awaiting_approval, got ${nextState}`);
        },
    },
    {
        name: 'Plan approved transitions awaiting_approval → executing',
        fn: () => {
            const nextState = getNextState('awaiting_approval', 'PLAN_APPROVED');
            assert(nextState === 'executing', `Expected executing, got ${nextState}`);
        },
    },
    {
        name: 'Plan rejected transitions awaiting_approval → idle',
        fn: () => {
            const nextState = getNextState('awaiting_approval', 'PLAN_REJECTED');
            assert(nextState === 'idle', `Expected idle, got ${nextState}`);
        },
    },
    {
        name: 'All tools complete transitions executing → complete',
        fn: () => {
            const nextState = getNextState('executing', 'ALL_TOOLS_COMPLETE');
            assert(nextState === 'complete', `Expected complete, got ${nextState}`);
        },
    },
    {
        name: 'Error can occur from any active state',
        fn: () => {
            const activeStates: AgentPhase[] = ['planning', 'awaiting_approval', 'executing'];
            for (const state of activeStates) {
                const nextState = getNextState(state, 'ERROR_OCCURRED');
                assert(nextState === 'error', `Expected error from ${state}, got ${nextState}`);
            }
        },
    },
    {
        name: 'Reset from error returns to idle',
        fn: () => {
            const nextState = getNextState('error', 'RESET');
            assert(nextState === 'idle', `Expected idle, got ${nextState}`);
        },
    },
    {
        name: 'Read operation can go planning → executing (skip approval)',
        fn: () => {
            const nextState = getNextState('planning', 'TOOL_EXECUTED');
            assert(nextState === 'executing', `Expected executing, got ${nextState}`);
        },
    },
    {
        name: 'Multiple tools can execute sequentially',
        fn: () => {
            const nextState = getNextState('executing', 'TOOL_EXECUTED');
            assert(nextState === 'executing', `Expected executing, got ${nextState}`);
        },
    },
    {
        name: 'Cannot transition from idle directly to executing',
        fn: () => {
            const canDo = canTransition('idle', 'TOOL_EXECUTED');
            assert(!canDo, 'Should not be able to execute from idle');
        },
    },
    {
        name: 'Cannot approve plan from idle state',
        fn: () => {
            const canDo = canTransition('idle', 'PLAN_APPROVED');
            assert(!canDo, 'Should not be able to approve from idle');
        },
    },
    {
        name: 'Cannot skip approval for write operations',
        fn: () => {
            // This tests the expected workflow: after PLAN_PROPOSED, 
            // must go through approval before execution
            const afterProposal = getNextState('planning', 'PLAN_PROPOSED');
            assert(afterProposal === 'awaiting_approval', 'After plan proposal should be awaiting_approval');

            // From awaiting_approval, only PLAN_APPROVED leads to executing
            const canExecuteDirect = canTransition('awaiting_approval', 'TOOL_EXECUTED');
            assert(!canExecuteDirect, 'Should not be able to execute tool without approval');
        },
    },
];

// ============================================================================
// Workflow Simulation Tests
// ============================================================================

function simulateWorkflow(events: AgentEvent[]): AgentPhase[] {
    const states: AgentPhase[] = ['idle'];
    let currentState: AgentPhase = 'idle';

    for (const event of events) {
        const nextState = getNextState(currentState, event);
        if (nextState) {
            currentState = nextState;
            states.push(currentState);
        }
    }

    return states;
}

const workflowTests: Array<{ name: string; fn: () => void }> = [
    {
        name: 'Write operation workflow: idle → planning → awaiting_approval → executing → complete',
        fn: () => {
            const events: AgentEvent[] = [
                'USER_MESSAGE',
                'PLAN_PROPOSED',
                'PLAN_APPROVED',
                'TOOL_EXECUTED',
                'ALL_TOOLS_COMPLETE',
            ];
            const states = simulateWorkflow(events);
            const expected = ['idle', 'planning', 'awaiting_approval', 'executing', 'executing', 'complete'];
            assert(
                JSON.stringify(states) === JSON.stringify(expected),
                `Expected ${expected.join(' → ')}, got ${states.join(' → ')}`
            );
        },
    },
    {
        name: 'Read operation workflow: idle → planning → executing → complete',
        fn: () => {
            const events: AgentEvent[] = [
                'USER_MESSAGE',
                'TOOL_EXECUTED',
                'ALL_TOOLS_COMPLETE',
            ];
            const states = simulateWorkflow(events);
            const expected = ['idle', 'planning', 'executing', 'complete'];
            assert(
                JSON.stringify(states) === JSON.stringify(expected),
                `Expected ${expected.join(' → ')}, got ${states.join(' → ')}`
            );
        },
    },
    {
        name: 'Clarification workflow: idle → planning → clarifying → planning → awaiting_approval → executing → complete',
        fn: () => {
            const events: AgentEvent[] = [
                'USER_MESSAGE',
                'CLARIFICATION_NEEDED',
                'CLARIFICATION_RECEIVED',
                'PLAN_PROPOSED',
                'PLAN_APPROVED',
                'ALL_TOOLS_COMPLETE',
            ];
            const states = simulateWorkflow(events);
            const expected = ['idle', 'planning', 'clarifying', 'planning', 'awaiting_approval', 'executing', 'complete'];
            assert(
                JSON.stringify(states) === JSON.stringify(expected),
                `Expected ${expected.join(' → ')}, got ${states.join(' → ')}`
            );
        },
    },
    {
        name: 'Rejected plan workflow: idle → planning → awaiting_approval → idle',
        fn: () => {
            const events: AgentEvent[] = [
                'USER_MESSAGE',
                'PLAN_PROPOSED',
                'PLAN_REJECTED',
            ];
            const states = simulateWorkflow(events);
            const expected = ['idle', 'planning', 'awaiting_approval', 'idle'];
            assert(
                JSON.stringify(states) === JSON.stringify(expected),
                `Expected ${expected.join(' → ')}, got ${states.join(' → ')}`
            );
        },
    },
    {
        name: 'Error recovery workflow: idle → planning → error → idle',
        fn: () => {
            const events: AgentEvent[] = [
                'USER_MESSAGE',
                'ERROR_OCCURRED',
                'RESET',
            ];
            const states = simulateWorkflow(events);
            const expected = ['idle', 'planning', 'error', 'idle'];
            assert(
                JSON.stringify(states) === JSON.stringify(expected),
                `Expected ${expected.join(' → ')}, got ${states.join(' → ')}`
            );
        },
    },
    {
        name: 'Multi-step execution workflow with multiple tools',
        fn: () => {
            const events: AgentEvent[] = [
                'USER_MESSAGE',
                'PLAN_PROPOSED',
                'PLAN_APPROVED',
                'TOOL_EXECUTED', // create_signal
                'TOOL_EXECUTED', // create_folder
                'TOOL_EXECUTED', // add_signal_to_folder
                'ALL_TOOLS_COMPLETE',
            ];
            const states = simulateWorkflow(events);
            const expected = ['idle', 'planning', 'awaiting_approval', 'executing', 'executing', 'executing', 'executing', 'complete'];
            assert(
                JSON.stringify(states) === JSON.stringify(expected),
                `Expected ${expected.join(' → ')}, got ${states.join(' → ')}`
            );
        },
    },
];

// ============================================================================
// Test Runner
// ============================================================================

function main() {
    console.log('\n🧪 Agent State Machine Unit Tests\n');
    console.log('Testing state transition logic...\n');

    console.log('─'.repeat(60));
    console.log('State Transition Tests');
    console.log('─'.repeat(60));

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const result = runTest(test.name, test.fn);
        if (result.passed) {
            console.log(`✅ ${result.name}`);
            passed++;
        } else {
            console.log(`❌ ${result.name}`);
            console.log(`   Error: ${result.error}`);
            failed++;
        }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('Workflow Simulation Tests');
    console.log('─'.repeat(60));

    for (const test of workflowTests) {
        const result = runTest(test.name, test.fn);
        if (result.passed) {
            console.log(`✅ ${result.name}`);
            passed++;
        } else {
            console.log(`❌ ${result.name}`);
            console.log(`   Error: ${result.error}`);
            failed++;
        }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`Summary: ${passed} passed, ${failed} failed`);
    console.log('─'.repeat(60) + '\n');

    if (failed > 0) {
        process.exit(1);
    }
}

main();
