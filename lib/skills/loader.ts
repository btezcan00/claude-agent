import fs from 'fs';
import path from 'path';

interface Skill {
  name: string;
  description: string;
  content: string;
  referencedDocs: Record<string, string>;
}

interface SkillFrontmatter {
  name: string;
  description: string;
}

/**
 * Parse YAML frontmatter from a markdown file
 */
function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter | null; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, body: content };
  }

  const [, yamlContent, body] = match;
  const frontmatter: Partial<SkillFrontmatter> = {};

  // Simple YAML parsing for key: value pairs
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      if (key === 'name' || key === 'description') {
        frontmatter[key] = value;
      }
    }
  }

  if (frontmatter.name && frontmatter.description) {
    return { frontmatter: frontmatter as SkillFrontmatter, body };
  }

  return { frontmatter: null, body: content };
}

/**
 * Extract markdown link references from content
 * Matches patterns like [text](file.md)
 */
function extractMarkdownLinks(content: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[2]);
  }

  return links;
}

/**
 * Parse a skill from its SKILL.md file
 */
function parseSkill(skillPath: string): Skill | null {
  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter) {
      console.warn(`Skill at ${skillPath} has no valid frontmatter`);
      return null;
    }

    const skillDir = path.dirname(skillPath);
    const referencedDocs: Record<string, string> = {};

    // Find and load referenced markdown files
    const links = extractMarkdownLinks(body);
    for (const link of links) {
      const docPath = path.join(skillDir, link);
      if (fs.existsSync(docPath)) {
        try {
          referencedDocs[link] = fs.readFileSync(docPath, 'utf-8');
        } catch (err) {
          console.warn(`Failed to read referenced doc ${docPath}:`, err);
        }
      }
    }

    return {
      name: frontmatter.name,
      description: frontmatter.description,
      content: body.trim(),
      referencedDocs,
    };
  } catch (err) {
    console.error(`Failed to parse skill at ${skillPath}:`, err);
    return null;
  }
}

/**
 * Load all skills from the docs/skills directory
 */
export async function loadSkills(): Promise<Skill[]> {
  const skillsDir = path.join(process.cwd(), 'docs/skills');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const skills: Skill[] = [];

  try {
    const cases = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const caseFolder of cases) {
      if (!caseFolder.isDirectory()) continue;

      const skillPath = path.join(skillsDir, caseFolder.name, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const skill = parseSkill(skillPath);
        if (skill) {
          skills.push(skill);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load skills:', err);
  }

  return skills;
}

/**
 * Format loaded skills for inclusion in system prompt
 */
export function formatSkillsForPrompt(skills: Skill[]): string {
  if (skills.length === 0) {
    return '';
  }

  const formatted = skills.map((skill) => {
    let skillSection = `## Skill: ${skill.name}\n\n`;
    skillSection += `**Description:** ${skill.description}\n\n`;
    skillSection += skill.content;

    // Append referenced documentation
    if (Object.keys(skill.referencedDocs).length > 0) {
      skillSection += '\n\n### Referenced Documentation\n';
      for (const [filename, docContent] of Object.entries(skill.referencedDocs)) {
        skillSection += `\n#### ${filename}\n\n${docContent}`;
      }
    }

    return skillSection;
  });

  return `
---
## Loaded Skills

The following skills and reference documentation are available to help answer questions:

${formatted.join('\n\n---\n\n')}
---
`;
}
