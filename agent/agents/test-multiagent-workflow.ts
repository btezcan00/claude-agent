/**
 * Test Multi-Agent Workflow Provider
 * 
 * Tests the workflow-based multi-agent architecture with HITL support.
 */

import { GoogleMultiAgentProvider } from './google-multiagent-provider';
import { allWorkflows, WorkflowEngine, createWorkflowRegistry } from '../workflows';

async function testWorkflowDiscovery() {
    console.log('\n=== Testing Workflow Discovery ===\n');

    console.log('Available Workflows:');
    for (const wf of allWorkflows) {
        console.log(`\n📋 ${wf.name} (${wf.id})`);
        console.log(`   ${wf.description}`);
        console.log(`   Category: ${wf.category}`);
        console.log(`   Required Inputs: ${wf.requiredInputs.map(i => i.field).join(', ')}`);
        console.log(`   Steps: ${wf.steps.map(s => s.id).join(' → ')}`);
        if (wf.triggers?.keywords) {
            console.log(`   Keywords: ${wf.triggers.keywords.join(', ')}`);
        }
    }
}

async function testWorkflowEngine() {
    console.log('\n=== Testing Workflow Engine ===\n');

    // Create a mock tool executor
    const mockExecutor = {
        executeTool: async (name: string, params: Record<string, unknown>) => {
            console.log(`   🔧 Mock execute: ${name}`, params);

            // Return mock results based on tool
            if (name === 'signal_create') {
                return {
                    success: true,
                    result: {
                        signalId: 'mock-signal-123',
                        signalNumber: 'GCMP-2026-001',
                    }
                };
            }
            if (name === 'folder_create') {
                return {
                    success: true,
                    result: {
                        folderId: 'mock-folder-456',
                        folderName: 'Test Folder',
                    }
                };
            }
            return { success: true, result: { message: 'Tool executed' } };
        }
    };

    const registry = createWorkflowRegistry(allWorkflows);
    const engine = new WorkflowEngine(registry, mockExecutor);

    // Test 1: Start workflow with missing inputs
    console.log('Test 1: Start signal_create workflow without inputs');
    const response1 = await engine.startWorkflow('signal_create', {}, {});
    console.log(`   Status: ${response1.status}`);
    console.log(`   Summary: ${response1.summary}`);
    if (response1.hitlRequest) {
        console.log(`   HITL Request: ${response1.hitlRequest.type} - ${response1.hitlRequest.message}`);
        console.log(`   Missing fields: ${response1.hitlRequest.fields?.join(', ')}`);
    }

    // Test 2: Start workflow with complete inputs
    console.log('\nTest 2: Start signal_create workflow with complete inputs');
    const response2 = await engine.startWorkflow('signal_create', {
        description: 'Suspicious activity at Main Street',
        types: ['fraud'],
        placeOfObservation: 'Main Street',
        receivedBy: 'police',
    }, {});
    console.log(`   Status: ${response2.status}`);
    console.log(`   Summary: ${response2.summary}`);
    if (response2.hitlRequest) {
        console.log(`   HITL Request: ${response2.hitlRequest.type} - ${response2.hitlRequest.message}`);
    }

    // Test 3: Approve and continue
    if (response2.executionId && response2.status === 'pending_approval') {
        console.log('\nTest 3: Approve and continue workflow');
        const response3 = await engine.respondToHITL(response2.executionId, { approved: true }, {});
        console.log(`   Status: ${response3.status}`);
        console.log(`   Summary: ${response3.summary}`);
        console.log(`   Completed steps: ${response3.completedSteps.join(', ')}`);
        if (response3.outputs) {
            console.log(`   Outputs:`, response3.outputs);
        }
    }

    // Test 4: Full investigation workflow
    console.log('\nTest 4: Full investigation workflow (multi-step)');
    const response4 = await engine.startWorkflow('full_investigation', {
        description: 'Drug trafficking ring operation',
        types: ['drug-trafficking'],
        placeOfObservation: 'Industrial District',
        folderName: 'Drug Ring Investigation',
    }, {});
    console.log(`   Status: ${response4.status}`);
    console.log(`   Summary: ${response4.summary}`);

    // Simulate approval flow
    let currentResponse = response4;
    let iterations = 0;
    while (currentResponse.status === 'pending_approval' && iterations < 5) {
        iterations++;
        console.log(`\n   Approving step ${iterations}...`);
        currentResponse = await engine.respondToHITL(
            currentResponse.executionId,
            { approved: true },
            {}
        );
        console.log(`   Status: ${currentResponse.status}`);
        console.log(`   Completed: ${currentResponse.completedSteps.join(', ')}`);
    }

    if (currentResponse.status === 'completed') {
        console.log('\n   ✅ Workflow completed successfully!');
        console.log(`   Final outputs:`, currentResponse.outputs);
    }
}

async function testProviderIntegration() {
    console.log('\n=== Testing Provider Integration ===\n');

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.log('⚠️  GOOGLE_AI_API_KEY not set, skipping provider test');
        return;
    }

    const provider = new GoogleMultiAgentProvider(
        { model: 'gemini-2.0-flash' },
        [],
        apiKey
    );

    console.log('Provider created:', provider.getProviderName());
    console.log('Note: Full integration test requires MCP server running');
}

// Run tests
async function main() {
    console.log('🧪 Multi-Agent Workflow Tests\n');
    console.log('='.repeat(50));

    await testWorkflowDiscovery();
    await testWorkflowEngine();
    await testProviderIntegration();

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!\n');
}

main().catch(console.error);
