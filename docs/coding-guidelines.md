# Coding Guidelines

This file provides a short, actionable set of coding and contribution guidelines for the repo. Ensure code is readable, testable, and secure. Follow these guidelines on all feature, bugfix and maintenance work.

## Security

- Use the [Secure Coding Guidelines](secure-coding-guidelines.md)
- Use the [Org Secure Coding Standards](https://internal-docs.sharepoint.com/sites/S400D27-PROJECT/Starter%20Documents/Forms/AllItems.aspx?csf=1&web=1&e=884iZR&CID=c517e5e7%2D8698%2D4d56%2Dbd14%2Ddd10112f75ad&FolderCTID=0x012000769E6CF691030F4FA24EFDD8020AD1A6&id=%2Fsites%2FS400D27%2DPROJECT%2FStarter%20Documents%2FPlatform%20and%20Data%20Team%2FSecure%20Coding%20Standards%20Draft)

## Work tracking

**ALL WORK WILL BE DONE FOR A JIRA WORK ITEM IN THE CURRENT SPRINT**

Work outside of the scope of the work item will not be accepted and should be tracked as a separate work item.

## IDE

VS Code will be used.

## Branching workflow

[GitHub Flow](github-flow.md) will be used

## Style & Formatting

- Follow the project's linter and formatter. Run them before opening a PR (e.g. `nx run-many -t lint` and `nx format:check`).
- Ensure the 'Default Formatter' is set to use Prettier
- Turn on VS Code's 'Format on save' setting
- Use consistent naming

## Tests

- Add or update unit tests for all code changes.
- Add integration tests where contracts between services or packages change.
- Run test suite locally prior to opening a PR: `nx run-many -t test`.

### Unit tests

The intention of unit testing is to ensure the code is behaving as expected, not to verify the visual design or functionality of dependencies.

**All dependencies should be mocked.**

Unit tests should cover, at least:

- all inputs e.g. when badge has a type input set to warning, the warning css class is applied
- all outputs e.g. when button click is fired, the appropriate event and information is sent
- all public methods

Unit tests will not cover:

- visual styling e.g. button is 48px wide

## Infrastructure

- All infrastructure will be managed via code, i.e. Infrastructure as Code (IAC).
- All infrastructure resources will be appropriately named with the environment and tagged.

## TODOs and Technical Debt

- Address and remove TODOs before creating a PR. If a TODO cannot be addressed, enter it as a Jira work item, then remove the TODO.


