# Prompt for Claude: Plan and Specify the Application

You are acting as a senior product strategist, UX architect, and software architect.

I am providing you with a separate file named:

`need_brief_intention_to_action_en.md`

Treat that document as the primary source of truth for the user need, behavioral context, product principles, risks, and success criteria.

Your task is not to jump directly into implementation. Work through the following phases in order.

## Product Context

The product should ultimately become a real web application.

The user will access it through a web browser using a username and password.

The application must use a persistent database that stores all relevant user data across devices and sessions.

This is initially a personal-use product for one user. Do not overengineer enterprise-grade security, permissions, compliance, or multi-tenant architecture. A straightforward username-and-password authentication flow is sufficient, provided passwords are stored securely using standard practices and the application is not designed in an obviously unsafe way.

You should recommend the technical platform and stack. Explain the reasoning and tradeoffs behind your recommendation.

The preferred system should be practical to build, maintain, deploy, and extend. Avoid unnecessary infrastructure.

## Phase 1: Learn and Interpret the Need

Read the entire need brief carefully.

Produce a concise but rigorous interpretation covering:

1. The core user problem.
2. The behavioral loop the product is meant to address.
3. The deepest user needs.
4. The main product risks.
5. The most important assumptions that still need validation.
6. The difference between this product and a conventional productivity or task-management application.
7. The principles that must remain true throughout product and engineering decisions.

Do not merely summarize the document. Identify tensions, contradictions, open questions, and likely failure modes.

State any assumptions you make.

## Phase 2: Product Scope and System Proposal

Propose the product scope in three layers:

1. Minimum viable product.
2. First complete personal-use version.
3. Later extensions.

For each layer, explain:

- What problems it solves.
- What capabilities it includes.
- What it deliberately excludes.
- What must be validated before moving to the next layer.

Then recommend the technical approach, including:

- Frontend framework.
- Backend framework or backend platform.
- Database.
- Authentication approach.
- Hosting and deployment platform.
- File or export handling, if needed.
- Calendar integration strategy.
- Analytics and event tracking, if appropriate.
- Backup and data portability.
- Development and testing approach.

Keep the architecture proportional to a personal-use application. Prefer a coherent and maintainable stack over a theoretically perfect architecture.

## Phase 3: Milestone-Based Delivery Plan

Create a milestone-based work plan.

Each milestone must:

- Deliver a meaningful, testable increment.
- Have a clear objective.
- Define the user value created.
- Specify dependencies.
- Define acceptance criteria.
- Identify major technical or product risks.
- State what must be approved before work begins on the next milestone.

The plan should cover the full path from foundation to a usable production web application.

For each milestone, create a separate PRD document.

Use clear filenames such as:

- `PRD_01_Foundation_and_Authentication.md`
- `PRD_02_Weekly_Planning_Core.md`
- `PRD_03_Daily_Execution_and_Block_Management.md`
- `PRD_04_Reviews_Goals_and_Insights.md`
- `PRD_05_Calendar_and_Data_Portability.md`

You may choose a different milestone structure if you can justify it.

Each PRD must include at least:

1. Milestone objective.
2. User problem addressed.
3. Scope.
4. User stories.
5. Functional requirements.
6. Non-functional requirements.
7. Data model changes.
8. Main user flows.
9. Edge cases.
10. Acceptance criteria.
11. Analytics or observability requirements.
12. Out-of-scope items.
13. Dependencies.
14. Risks and open questions.
15. Definition of done.

Do not write implementation code during this phase.

## Phase 4: Information Architecture and Product Model

Define the application’s conceptual model and information architecture.

At minimum, evaluate the need for entities such as:

- User.
- Week.
- Weekly goals.
- Default block library.
- Weekly block pool.
- Scheduled block.
- Completion state.
- Deferral or rescheduling history.
- Rest and recovery blocks.
- Screen-free sessions.
- Daily review.
- Weekly review.
- Energy or resistance observations.
- Calendar export or synchronization records.

Do not assume all of these must exist as separate database entities. Recommend the cleanest model.

Provide:

- A proposed entity relationship model.
- Important fields for each entity.
- Relationships.
- Lifecycle rules.
- Data-retention considerations.
- Which historical changes should be preserved.
- Which data should be editable.
- Which data should be derived.

## Phase 5: UX and Interaction Design Proposal

After the planning documents are complete, create a design proposal for the main product flows.

The design must prioritize:

- Low cognitive load.
- Minimal negotiation at the moment of execution.
- Fast weekly and daily planning.
- A strong distinction between the default block library, the current week’s block pool, and scheduled blocks.
- Easy movement of blocks between the pool and days.
- Clear editing of dates, times, duration, expected outcome, and completion state.
- Carrying three goals from one weekly review into the next week.
- Non-judgmental language.
- Clear recovery after a missed block.
- Mobile usability as a first-class requirement.
- Desktop usability for deeper weekly planning.

Produce a standalone interactive HTML design proposal and save it as:

`design_proposal.html`

The HTML should include realistic screens or flows for:

1. Login.
2. Weekly overview.
3. Default block library.
4. Current week block pool.
5. Daily planning.
6. Block editing.
7. In-the-moment execution view.
8. End-of-day review.
9. Weekly review.
10. Three goals for the next week.
11. Insights or data view.
12. Calendar export or integration.

The HTML should be self-contained and viewable locally in a browser.

Use realistic sample data.

Do not implement the real backend at this stage. This is a design and interaction prototype.

## Approval Gates

Stop after each major phase and present the outputs for review.

Do not begin the next phase until I explicitly approve the previous one.

The required approval sequence is:

1. Need interpretation.
2. Product scope and technical proposal.
3. Milestone plan.
4. PRDs.
5. Information architecture and data model.
6. HTML design proposal.
7. Final implementation plan.

After all of the above are approved, prepare a final implementation plan that maps the approved design and PRDs into:

- Repository structure.
- Environments.
- Database migrations.
- Authentication setup.
- Development order.
- Test strategy.
- Deployment steps.
- Rollback and backup strategy.
- Initial production release checklist.

Do not begin coding the production application until I explicitly approve the final implementation plan.

## Working Style

Be concrete and decisive, but make uncertainty visible.

Avoid generic product language.

Whenever you recommend a feature, connect it directly to a user need or behavioral risk from the need brief.

Whenever you reject or defer a feature, explain why.

Do not overengineer.

Do not reduce the problem to a task list, habit tracker, calendar, or productivity score.

Treat mobile and desktop as parts of the same web product, not as unrelated products.

When multiple approaches are reasonable, recommend one and explain why.

Use clear Markdown documents and consistent terminology across all deliverables.
