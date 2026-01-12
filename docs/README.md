# GCMP - Government Case Management Platform

A comprehensive case management platform for government agencies handling sensitive investigations related to human trafficking, illegal drugs, and illegal prostitution.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **AI Integration**: Claude Opus 4.5 (Anthropic API)
- **State Management**: React Context + localStorage
- **Icons**: Lucide React

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd claude-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`.

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Project structure, state management, data flow |
| [Features](./features.md) | Platform features and functionality |
| [AI Agent](./ai-agent.md) | AI assistant capabilities and tools |
| [API Reference](./api.md) | Chat API endpoint documentation |
| [Data Models](./data-models.md) | TypeScript interfaces and types |

## Key Features

- **Case Management**: Create, edit, assign, and track cases through their lifecycle
- **Team Management**: View team members, workload, and capacity
- **AI Assistant**: Natural language interface for case operations powered by Claude
- **File Attachments**: Upload and analyze images/documents with AI vision
- **Activity Tracking**: Complete audit trail of all case actions
- **Advanced Filtering**: Search, filter, and sort cases by multiple criteria

## Project Structure

```
/app                    # Next.js app directory (pages & API routes)
/components             # React components
/context                # React Context providers
/types                  # TypeScript type definitions
/hooks                  # Custom React hooks
/lib                    # Utility functions
/data                   # Mock data
/docs                   # Documentation (you are here)
```

## License

[Add license information]
