---
name: planning
description: Multi-phased planning and execution workflow. Use when planning complex tasks, creating implementation plans, or executing phased work.
---

This skills guides what plan considerations must be held and how to execute such plan

## Planning

- In all interactions, be extremely concise and sacrifice grammar for the sake of concision
- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the question extremly concise. Sacrifice grammer for the sake of concision
- All plans should have clear phases. In other words, all plans should be multi-phased
- When asked to save the plan, it should be done as a Github PR
- Always use AskUserQuestion for clarifications instead of listing questions in text. Be proactive about asking. I prefer this over you picking an option on your own

## Executing plan

- When executing a multi-phased plan, you must always stop after finish one. I'll manually confirm that you can continue with the next one
- After finishing a phase, run `cd /Users/niconiahi/Documents/repos/habita/apps/web && pnpm run typecheck 2>&1` to check your work for type errors

After having finished a plan, only run `just lint types` and `just lint format` when the user explicitly asks for it.
