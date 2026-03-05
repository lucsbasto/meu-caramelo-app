# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Setup

Install dependencies:

pnpm install

Start development server:

pnpm dev

Run tests:

pnpm test

## Code Style

- TypeScript strict mode
- Single quotes
- Prefer functional programming
- Avoid large files (>300 lines)

## Repository Structure

mobile-app/ → React Native app  
supabase/ → database schema and migrations  
docs/ → documentation

## Pull Request Rules

- All features must include tests
- Follow conventional commits
- Keep PRs under 500 lines

## Mandatory Preflight (Every Task)

1. Read project directory structure first.
2. Read `C:\Users\lucsb\.codex\ARCHITECTURE.md` before any planning/execution.
3. Planning tasks MUST start with: `Invoke project-planner`.
4. Every task/workstream MUST include explicit `Invoke <qualified-agent>`.
5. If no qualified agent exists, stop and ask for reassignment.
6. Reject completion if invocation log is missing.

## Plan Format Gate

Each workstream/task must contain:
- `Invoke <agent>`
- Scope
- Steps
- Acceptance criteria

## User Prompt Shortcut

When user asks for any task, assume this prefix:
`Follow mandatory preflight: directory → ARCHITECTURE.md → invoke agent.`
