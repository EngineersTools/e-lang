# Main

Main entry point file for agents. Read this file first to understand the structure of this project and your next instructions.

# Project Information

- Name: e-lang
- Description: `e-lang` is an experimental, domain-specific programming language designed from the ground up for engineering disciplines. By providing higher-level abstractions tailored to physical computing, `e-lang` makes it easier to write safe, mathematically verifiable engineering software.
- Tech Stack:
    - Main programming language: TypeScript
    - Package manager: npm
    - Organisation: mono-repo organised in packages
    - Main frameworks used:
        - Langium
            - Used as the basis of e-lang language implementation
            - Framework docs URL: https://langium.org/docs/introduction/
        - Typir
            - Used to add a type system and type checking capabilities to e-lang
            - Framework docs URL: https://github.com/TypeFox/typir/blob/main/documentation/index.md

# Operating Model

This project follows the 120x Architect / Builder methodology.

- The Architect defines requirements, blueprints, acceptance criteria and the handoff prompt to the Builder.
- The Builder executes instructions fro the written artifacts.
- The handoff is a folder, not a converation. The durable source of truth lives in the repository.
- The Lead Developer is the person running the Architect and the Builder, approving their work and has ultimate decision power and has the final authority to approve or reject changes.

# First Files to Read

- main.md (this document)
- planning/state.md

# Builder Rules

- Do not redefine scope. Work from the active sprint requirements and blueprint.
- Do not invent business rules. record open questions in planning/questions.md
- Do not overwrite files without express approval from the Lead Developer
- Do not store secrets, API keys, passwords, tokens or credentials.
- Update planning/state.md when project status changes.
- Update planning/decisions.md when decisions are made or discovered.

# Sprint Workflow

Each sprint folder should contain the following files:
- requirements.md: goals, inputs, constrains, and non-goals.
- blueprint.md: implementation or documentation plan.
- acceptance.md: testable completion criteria.
- handoff-prompt.md: Builder-ready prompt for executing the sprint.

Use the `planning/sprints/0000-sprint-template` directory as a template to create new sprints. Inside the template directory there are template files. The sections that should be customised for each sprint are enclosed in double curly braces `{{}}`. Replace these placeholders with the correct content for each sprint. 

Builders should complete work against the active sprint and leave the folder in a state another agent can resume from.