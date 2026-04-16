---
name: git
description: Git commit conventions. Use always when creating commits — covers message format, scope usage, and type selection.
---

# Git Commit Conventions

Follow conventional commits. Every commit message follows: `type(scope): description`

## Types

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `chore` | Maintenance, config, tooling, dependencies |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `test` | Adding or updating tests |
| `ci` | CI/CD changes |
| `deploy` | Deployment-related changes |

## Scope

- Use scope when the change is scoped to a clear domain: `feat(notifications):`, `fix(booking):`, `chore(infra):`
- Omit scope for cross-cutting changes: `feat: redesign profile page`
- Scope uses the domain name, not the file/folder: `notifications` not `src/lib/components/Notifications`
- Skill file changes use `skill` scope: `docs(skill): add lib utilities`

## Description

- Lowercase, no period at the end
- Start with a verb: `add`, `fix`, `replace`, `update`, `remove`, `move`, `split`, `improve`
- Use `add` for wholly new things, `update` for enhancements, `fix` for bugs
- Be specific about what changed, not vague: `add zone filtering` not `update properties`
- Keep it concise — one line, ideally under 72 chars
- Can mention multiple things with `+` when tightly coupled: `add floor support`

## Examples from this repo

```
feat(notifications): push full notification via sse instead of refetching
feat(infra): split consumer into three separate services by domain
fix(booking): prevent double-booking with optimistic lock on slot state
refactor(notifications): use satisfies for compile-time type safety on emitted event
chore: add satisfies vs v.parse guideline to data validation skill
docs(skill): add lib utilities
style: apply formatting
feat: replace blob storing with object store + refactor upsert file
chore: move config files to config folder + symlink script
```

## No trailers

Never append `Co-Authored-By`, `Signed-off-by`, or any other trailer to commit messages. Keep messages clean — just the `type(scope): description` line.

## What NOT to do

```bash
# WRONG — vague description
feat: update stuff

# WRONG — uppercase or period
Feat: Add new feature.

# WRONG — scope is a file path
feat(src/lib/components): add button

# WRONG — missing verb
feat: notification system

# WRONG — trailer appended
feat: add button
Co-Authored-By: ...
```
