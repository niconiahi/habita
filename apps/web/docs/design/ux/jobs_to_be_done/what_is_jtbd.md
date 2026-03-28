# What is Jobs to Be Done?

Jobs to Be Done (JTBD) is a framework for understanding why people use products. Instead of asking "what features do users want?", it asks "what progress is the user trying to make in their life?"

The core idea: people don't buy products — they **hire** them to get a job done. When someone subscribes to a property management platform, they're not buying a dashboard. They're hiring a tool to move properties from vacant to occupied with a signed contract and a paying tenant. The dashboard is one possible solution. The job is the constant.

This document explains the framework, how to read the JTBD files in this directory, and how JTBD relates to other tools the team uses.

---

## The job statement format

Every job follows this structure:

> **"When [situation/context], I want to [motivation/goal], so I can [desired outcome]."**

For example:

> "When I need a place to live in a new area, I want to find and secure a rental that fits my needs, so I can settle in and get on with my life."

The three parts serve different purposes:

- **"When..."** anchors the need in a real situation. This is what triggers the need — not a persona, not a feature, but a circumstance. The same person might have completely different needs in different situations.
- **"I want to..."** captures what the user is trying to accomplish. This must be solution-independent — it should never mention a specific product, feature, or interface element.
- **"so I can..."** reveals the deeper outcome. This is often where the real insight lives. The user doesn't want to "compare properties" for the sake of comparing — they want to "avoid wasting time on places that don't match."

### The "When" clause is what makes JTBD different

User stories start with "As a [role]..." — the identity drives the need. JTBD starts with "When [situation]..." — the context drives the need. This matters because the same person behaves differently in different situations. A property manager creating their first listing has different needs than one publishing their twentieth. The role is the same; the situation is not.

---

## Three dimensions of every job

Every job has three layers. All three must be understood to design well, but they have different weights:

### 1. Functional — what they need to accomplish

The practical, measurable task. This is the core job that defines whether the product succeeds or fails. If the functional job isn't done well, nothing else matters.

> Example: "Find available properties, evaluate them against personal criteria, visit the best options, get accepted as a tenant, and formalize the rental agreement."

Functional jobs are:
- **Solution-independent** — they never mention a product or feature
- **Measurable** — you can tell whether the job was done (the tenant signed a contract or didn't)
- **Stable over time** — the job "formalize a rental agreement legally" has existed for centuries; the solutions changed (handshake → paper contract → digital signature)

### 2. Emotional — how they want to feel

The internal experience the user seeks or avoids while getting the job done.

> Example: "Feel in control of a high-stakes decision. Renting is one of the largest recurring expenses — the process should feel transparent, not opaque."

Emotional jobs answer: "How does the user want to feel during and after completing the functional job?" Common emotional jobs include wanting to feel confident, safe, in control, relieved, or not anxious.

Emotional jobs are harder to observe than functional ones. Users rarely say "I want to feel less anxious." Instead, they exhibit behaviors that imply it — checking the same information multiple times, asking for reassurance, delaying decisions. The features a product builds often reveal emotional jobs indirectly: encryption exists because users worry about data exposure; credit report requirements exist because managers worry about unreliable tenants.

### 3. Social — how they want to be perceived

How the user wants others to see them while getting the job done.

> Example: "Be perceived as a responsible, reliable candidate by the property manager."

Social jobs answer: "How does the user want to be seen by others involved in the process?" These tie into identity, status, and group belonging. A property manager wants landlords to see them as competent. A tenant wants managers to see them as trustworthy. A realtor wants the market to see their agency as professional.

Social jobs are the most difficult to uncover because people rarely admit to them. Nobody says "I want to look professional." But they choose tools, workflows, and communication styles that signal professionalism — and they avoid tools that make them look disorganized or unprepared.

### The hierarchy between dimensions

These three dimensions are not equal:

1. **Functional jobs define the market.** If the product doesn't get the functional job done, users will leave — regardless of how good the emotional or social experience is. A property listing platform with a beautiful interface but no properties will fail.
2. **Emotional and social jobs differentiate.** When multiple products solve the functional job, the emotional and social dimensions determine which one wins. All property platforms let you list properties; the one that makes the manager feel organized and look professional to landlords has an edge.

This hierarchy matters for design prioritization: fix functional gaps first, then enhance emotional and social dimensions.

---

## The job hierarchy

Jobs decompose into layers, from broad to specific:

### Primary job

The overarching goal that encompasses everything the user is trying to accomplish in their relationship with the product.

> "When I'm responsible for renting out properties, I want to move each property from vacant to occupied with a signed contract and paying tenant, so I can generate income for the landlord and justify my management fee."

There's typically one primary job per actor. It's the "big picture" that all other jobs serve.

### Secondary jobs

Specific goals that must be accomplished to fulfill the primary job. Each secondary job is a step in the broader process, but it has its own situation, motivation, and outcome.

> "When people have visited a property, I want to review their profiles and documents, so I can pick the most reliable tenant and avoid future problems."

Secondary jobs are where most design work happens. They're specific enough to inform feature design but broad enough to leave room for multiple solutions.

### Sub-jobs

Detailed tasks that break down secondary jobs. These are close to the implementation level and are useful for detailed interaction design.

> "Review each candidate's credit report and income documentation."

A key principle from Nielsen Norman Group: **don't confuse goals with tasks.** A user's goal isn't to fill in a form — filling in a form is the task they perform to achieve the goal of registering for a service. When writing JTBD, always check: am I describing a goal (why) or a task (what)? If it's a task, ask "why?" until you reach the goal.

### Consumption jobs

A special category: the tasks required to use the solution itself. These are not user goals — they're friction imposed by the product. They're valuable precisely because they represent design opportunities.

> "If the tenant doesn't have a digital certificate, they need to complete an identity verification process with an external provider before they can sign. This is outside the platform's control but blocks a critical step."

Consumption jobs reveal where the product creates unnecessary steps, confusion, or dependency on external systems. They're the most immediately actionable type of job for a designer — reducing consumption friction improves the experience without changing any functional capability.

---

## Quality rules for writing JTBD

### Solution-independent

A job statement must never mention the product, a feature, a UI element, or a technology. The job should be true regardless of which product is hired to solve it.

- **Bad:** "When I want to invite a landlord, I want to send them an email from the property edit page."
- **Good:** "When I manage a property on behalf of an owner, I want to give them visibility into the rental agreement, so they trust that their asset is being handled properly."

The bad version describes a feature. The good version describes a need that could be solved many ways — email invitation, shared dashboard, WhatsApp message, phone call. The designer's job is to find the best solution for the need, not to build the solution the statement prescribes.

Nielsen Norman Group frames this as **"think in verbs, not nouns"**: users don't need a dropdown — they need to see choices and select one. Users don't need a dashboard — they need to digest varied information in one place.

### Stable over time

Jobs don't change; solutions do. If a job statement would have been true 50 years ago and will still be true in 50 years, it's well-written. "Formalize a rental agreement with legal validity" has always been a job. Paper contracts, notarized documents, and digital signatures are all solutions that changed over time.

If a job statement would become false when a technology changes, it's describing a solution, not a job.

### Use the 5 Whys

Surface-level tasks hide deeper jobs. The "5 Whys" technique drills past tasks to find the real motivation:

- "I need to upload a credit report." → Why?
- "Because the platform requires it to book a visit." → Why does the platform require it?
- "Because the manager wants to know I'm financially reliable." → Why does that matter?
- "Because accepting an unreliable tenant is expensive and stressful." → Why is that the manager's concern?
- "Because the manager's reputation with the landlord depends on choosing good tenants."

The real job isn't "upload a credit report." It's "prove financial reliability to get taken seriously as a candidate." The credit report is one solution to that job. A bank reference letter, a salary certificate, or a co-signer could also work.

### Avoid the "faster horse" trap

Henry Ford's (possibly apocryphal) quote: "If I had asked people what they wanted, they would have said faster horses." Users describe solutions, not jobs. They say "I want a comparison table" when the job is "quickly identify which option best fits my needs." They say "I want notifications" when the job is "know when something needs my attention without constantly checking."

When writing JTBD, use expertise to derive insights from behavior and feature usage patterns rather than taking user requests at face value. What they do reveals more than what they say.

---

## How JTBD relates to other tools

### JTBD vs User Stories

| Dimension | JTBD | User Stories |
|-----------|------|--------------|
| **Format** | "When [situation], I want to [goal], so I can [outcome]" | "As a [role], I want [feature], so that [benefit]" |
| **Purpose** | Strategic — understand *why* users need something | Tactical — describe *what* to build |
| **Focus** | Situation and context drive the need | Role and feature drive the specification |
| **Scope** | Entire journey, unmet needs | Single actionable product step |
| **Timing** | Discovery and strategy phase | Sprint planning and execution |
| **Solution reference** | Never | Always |
| **Stability** | Jobs don't change | Stories change as features evolve |
| **Audience** | Designers, product, strategy | Developers, QA, sprint teams |

These are **complementary**, not competing. JTBD identifies the need → User Need Statements frame the design problem → User Stories go into the backlog. The flow is:

1. **JTBD:** "When both parties agree to rental terms, I want to sign the contract in a way that's legally binding, so neither side can dispute the agreement later."
2. **User Need Statement:** "A tenant needs to formalize their rental agreement with legal validity in order to feel protected."
3. **User Story:** "As a tenant, I want to sign the contract digitally so that I don't need to visit an office."

The JTBD is stable — it was true before digital signatures existed. The user story is ephemeral — it will change when the signing technology changes.

### JTBD vs User Need Statements

Nielsen Norman Group's User Need Statement format is: **"[User] needs [need-as-verb] in order to [goal]."** It sits between JTBD and User Stories in specificity — it names the user (like a story) but keeps the need solution-independent (like a job).

| Format | Template | When to use |
|--------|----------|-------------|
| **JTBD** | "When [situation], I want to [goal], so I can [outcome]" | Discovery: understanding the problem space |
| **User Need Statement** | "[User] needs [need] in order to [goal]" | Define: framing the design problem |
| **User Story** | "As a [role], I want [feature], so that [benefit]" | Build: specifying what to implement |

### JTBD and Empathy Maps

Nielsen Norman Group's empathy maps have four quadrants — Says, Thinks, Does, Feels — and an optional Goals section. JTBD maps directly onto these:

- **Says** → surface-level requests (the "faster horse")
- **Thinks** → internal concerns and considerations (emotional dimension)
- **Does** → observable actions (functional dimension)
- **Feels** → emotional states (emotional dimension)
- **Goals** → the job itself

The most valuable insights come from **juxtapositions between quadrants** — when what users say contradicts what they do, or when what they think contradicts what they feel. These conflicts reveal hidden jobs that users don't articulate.

### JTBD and Journey Maps

Journey maps trace the phases a user moves through to accomplish a goal. Each phase is a secondary job. The journey map's "mindsets" layer (thoughts, questions, motivations) maps to the "When" clause. The "emotions" layer maps to the emotional dimension.

A journey map shows the sequence; JTBD explains the motivation at each point in that sequence.

---

## How to read the JTBD files in this directory

Each file in this directory covers one actor: tenant, manager, landlord, or realtor. The structure is:

1. **Primary job** — the overarching goal for this actor, with all three dimensions
2. **Secondary jobs** — specific goals, each with the "When..., I want to..., so I can..." statement and functional/emotional/social dimensions
3. **Consumption jobs** — friction points in using the current solution

Emotional and social dimensions that were **inferred from the codebase** (rather than validated with users) are marked with *(validate)*. These are educated guesses based on what the features imply about user motivations — but they need to be confirmed through user research. The functional dimensions are derived directly from the code and are reliable.

When using these files for design work:

- **Start with the primary job** to understand the actor's big picture
- **Use secondary jobs** to identify which part of the experience you're designing for
- **Check consumption jobs** for quick wins — reducing friction in using the platform itself
- **Validate the *(validate)* markers** through user interviews, especially the emotional and social dimensions
- **Never design a feature that doesn't serve a job** — if you can't trace a proposed feature back to a job, question whether it's needed
