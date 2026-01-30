/**
 * Test script for the Google ADK + MCP flow
 * 
 * Run: npx ts-node agent/agents/test-google-provider.ts
 */

import { GoogleADKUnifiedProvider } from './google-provider';

async function test() {
    console.log('🧪 Testing Google ADK + MCP Provider\n');

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error('❌ GOOGLE_AI_API_KEY not set');
        process.exit(1);
    }

    const provider = new GoogleADKUnifiedProvider(
        { model: 'gemini-2.0-flash' },
        [],
        apiKey
    );

    try {
        console.log('📡 Initializing (connecting to MCP)...\n');
        await provider.initialize();

        console.log('═'.repeat(50));
        console.log('Test: List signals');
        console.log('═'.repeat(50));

        await provider.streamMessage(
            [{ role: 'user', content: 'List all signals' }],
            (event) => {
                if (event.type === 'thinking') {
                    const data = event.data as { text?: string };
                    process.stdout.write(data.text || '');
                } else if (event.type === 'tool_executed') {
                    const data = event.data as { tool: string };
                    console.log(`\n🔧 Tool: ${data.tool}`);
                } else if (event.type === 'response') {
                    console.log('\n✅ Done');
                }
            }
        );

        await provider.shutdown();
        console.log('\n🏁 Test complete!');

    } catch (error) {
        console.error('❌ Error:', error);
        await provider.shutdown();
        process.exit(1);
    }
}

test();
