/**
 * Agent Factory
 * 
 * Creates and configures agent providers.
 * Supports Anthropic and Google (state-aware) providers.
 */

import { AgentProvider, AgentConfig, AgentTool } from './base-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GoogleStateAwareProvider } from './google-stateaware-provider';

/**
 * Provider types:
 * - 'anthropic': Anthropic Claude provider
 * - 'google-state' or 'google': State-aware Google provider (RECOMMENDED for Google)
 */
export type ProviderType = 'anthropic' | 'google-state' | 'google';

export interface AgentFactoryConfig {
    provider: ProviderType;
    apiKey: string;
    agentConfig: AgentConfig;
    tools: AgentTool[];
    /** MCP server options (for google provider) */
    mcpOptions?: {
        serverCommand?: string;
        serverArgs?: string[];
    };
}

/**
 * Agent Factory - Creates provider instances
 */
export class AgentFactory {
    /**
     * Create an agent provider instance
     */
    static createProvider(config: AgentFactoryConfig): AgentProvider {
        switch (config.provider) {
            case 'anthropic':
                return new AnthropicProvider(
                    config.agentConfig,
                    config.tools,
                    config.apiKey
                );

            case 'google':
            case 'google-state':
                return new GoogleStateAwareProvider(
                    config.agentConfig,
                    config.tools,
                    config.apiKey,
                    config.mcpOptions?.serverCommand,
                    config.mcpOptions?.serverArgs
                );

            default:
                throw new Error(`Unknown provider: ${config.provider}`);
        }
    }

    /**
     * Create an agent provider instance (async version)
     * Use this for google providers to ensure MCP connection is established
     */
    static async createProviderAsync(config: AgentFactoryConfig): Promise<AgentProvider> {
        const provider = this.createProvider(config);

        // Initialize Google State-Aware provider (needs async MCP connection)
        if ((config.provider === 'google' || config.provider === 'google-state') && provider instanceof GoogleStateAwareProvider) {
            await provider.initialize();
        }

        return provider;
    }

    /**
     * Get provider from environment variable
     */
    static getProviderFromEnv(): ProviderType {
        const provider = process.env.AGENT_PROVIDER?.toLowerCase();

        // Google state-aware provider (default for Google)
        if (provider === 'google' || provider === 'google-state' || provider === 'state' ||
            provider === 'state-aware' || provider === 'gemini' || provider === 'adk') {
            return 'google-state';
        }

        return 'anthropic'; // default
    }

    /**
     * Get API key for a provider from environment
     */
    static getApiKey(provider: ProviderType): string {
        switch (provider) {
            case 'anthropic':
                const anthropicKey = process.env.ANTHROPIC_API_KEY;
                if (!anthropicKey) {
                    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
                }
                return anthropicKey;

            case 'google':
            case 'google-state':
                const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
                if (!googleKey) {
                    throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
                }
                return googleKey;

            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Check if provider uses MCP
     */
    static usesMcp(provider: ProviderType): boolean {
        return provider === 'google' || provider === 'google-state';
    }
}

/**
 * Convenience function to create an agent
 */
export function createAgent(options: {
    provider?: ProviderType;
    agentConfig: AgentConfig;
    tools: AgentTool[];
}) {
    const provider = options.provider || AgentFactory.getProviderFromEnv();
    const apiKey = AgentFactory.getApiKey(provider);

    return AgentFactory.createProvider({
        provider,
        apiKey,
        agentConfig: options.agentConfig,
        tools: options.tools,
    });
}
