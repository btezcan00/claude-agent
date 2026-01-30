/**
 * Test script for the Google ADK Unified Provider
 * 
 * Run with: npx ts-node agent/agents/test-unified-provider.ts
 */

import { GoogleADKUnifiedProvider } from './providers/google-adk-unified-provider';
import { agentLogger } from './logger';

async function testUnifiedProvider() {
    console.log('🧪 Testing Google ADK Unified Provider\n');

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error('❌ GOOGLE_AI_API_KEY not set');
        process.exit(1);
    }

    // Create provider
    const provider = new GoogleADKUnifiedProvider(
        {
            model: 'gemini-2.0-flash',
            systemPrompt: 'You are a helpful assistant for GCMP.',
        },
        [], // Tools come from MCP
        apiKey
    );

    try {
        // Initialize (connects to MCP and loads tools)
        console.log('📡 Initializing provider (connecting to MCP)...\n');
        await provider.initialize();

        // Test 1: Simple list signals query
        console.log('═'.repeat(60));
        console.log('TEST 1: List signals');
        console.log('═'.repeat(60));

        await provider.streamMessage(
            [{ role: 'user', content: 'List all signals in the system' }],
            (event) => {
                if (event.type === 'thinking') {
                    const data = event.data as { text?: string };
                    process.stdout.write(data.text || '');
                } else if (event.type === 'tool_executed') {
                    const data = event.data as { tool: string; status: string };
                    console.log(`\n🔧 Tool executed: ${data.tool} (${data.status})`);
                } else if (event.type === 'response') {
                    console.log('\n✅ Response complete');
                } else if (event.type === 'error') {
                    const data = event.data as { message: string };
                    console.error(`\n❌ Error: ${data.message}`);
                }
            }
        );

        console.log('\n');

        // Test 2: Create signal request (should naturally ask for details or propose)
        console.log('═'.repeat(60));
        console.log('TEST 2: Create signal request');
        console.log('═'.repeat(60));

        await provider.streamMessage(
            [{
                role: 'user',
                content: 'I want to report a human trafficking case at Central Station. A police officer observed suspicious activity around 2pm today.',
            }],
            (event) => {
                if (event.type === 'thinking') {
                    const data = event.data as { text?: string };
                    process.stdout.write(data.text || '');
                } else if (event.type === 'tool_executed') {
                    const data = event.data as { tool: string; status: string; result?: unknown };
                    console.log(`\n🔧 Tool executed: ${data.tool} (${data.status})`);
                    if (data.result) {
                        console.log(`   Result: ${JSON.stringify(data.result).slice(0, 200)}...`);
                    }
                } else if (event.type === 'response') {
                    console.log('\n✅ Response complete');
                } else if (event.type === 'error') {
                    const data = event.data as { message: string };
                    console.error(`\n❌ Error: ${data.message}`);
                }
            }
        );

        console.log('\n');

        // Shutdown
        await provider.shutdown();
        console.log('🏁 Test complete!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        await provider.shutdown();
        process.exit(1);
    }
}

// Run
testUnifiedProvider().catch(console.error);
