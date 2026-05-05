# GitHub Flow

This document describes a simple, practical [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) for feature development, bug fixes and releases in this repository.
It assumes `main` is the always-deployable branch and CI runs on all pull requests and merges.

## Goals

- Keep changes small and reviewable.
- Ensure CI and quality gates pass before merging.
- Link every change to a work item (JIRA).
- Make deployments predictable and auditable.

## High-level steps

1. Create a branch
2. Add small, focused commits
3. Create a Pull Request (PR)
4. Review PR and wait for checks to pass
5. Merge to `main`
6. Automatically deploy from `main`

## 1. Create a branch

Each branch represents a feature, bug fix, or experiment.  
Local feature branches are branched from the `main` branch.  
Remote tracking branches are created so that others can check out the same branch, which can be helpful if someone needs to pick up your work.

### Branch naming

Branch folders are used and organized based on Conventional Commits specification types. See [Allowed Scopes](#allowed-scopes).  
Each branch **must** reference a work item from the sprint backlog, and should be named with the item number and short description

Use descriptive, scoped names that reference the work item. Examples:

- `feat/123-add-user-auth`
- `fix/456-null-pointer-in-service`
- `chore/789-deps-update-2025-10`

### How to create a branch

VS Code provides a Source Control UI in the Activity Bar that can be used to create branches.

Before creating a branch, ensure that the Jira work item status is set to 'In Progress', and assigned to the Developer.

If you prefer to use the command line:

1. Make sure your local copy of the main branch is up to date
2. Create a feature branch from the main branch
3. Setup a remote tracking branch

```
git checkout main
git pull origin main
git checkout -b feat/123-add-user-auth
git push -u origin feat/123-add-user-auth
```

## 2. Add commits

Make changes in your local branch.  
Commit early and often.  
Create and update tests as needed.  
Use feature flags for risky or long-running features to allow incremental releases.
Run tests and scans as needed.  
Keep your local branch synchronized with changes **from** main.  
Keep the remote tracking branch synchronized with changes **from** the local branch.

### Commit message format

Write clear, descriptive commit messages following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.  
The message should include the scope and a short summary (50 characters or less), then if needed, a blank line and optional detail. See [Allowed Scopes](#allowed-scopes).

Explain what and why changes were made, not how.  
Use present tense.

Examples:

- `feat(123): add login component`
-

```
feat(123): add change password component

- implement user name validation
- implement password checks
```

### How to add commits

VS Code provides a Source Control UI in the Activity Bar that can be used to make commits.

If you prefer to use the command line:

1. Make changes
2. Add new files, if necessary
3. Optional: run local linting, formating, tests and scans
4. Commit

```
git add .
git commit -m "feat(123): add login component"
```

### How to keep your local branch up to date with `main`

Following this process, your local feature branch will be synchronized with `main`, and keep the commits linear.

This should be done frequently to ensure that you have the latest changes from `main`. It should also be done just before submitting a PR.

```
# Update local main branch to match remote

git checkout main
git pull origin main

# Switch to your feature branch

git checkout feat/<your-branch-name>

# Ensure latest remote data is available (extra safety)

git fetch origin

# Rebase your feature branch onto the latest main

git rebase origin/main

# Resolve any conflicts, then continue (Git will pause if there are conflicts)

git add <fixed-files>
git rebase --continue
```

## 3. Create a Pull Request (PR)

Code reviews are done using the GitHub pull requests feature.

The Developer who made the changes will submit the pull request and other team member(s) will review the request.

A PR can be used even for work in progress, to get feedback from the team. This can be done by creating a PR as a Draft. Once you want to request a review for the PR, then push the changes to the branch and mark the PR as 'Ready for review'.

Changes that are merged to main from an approved PR will eventually go to Prod.
**Make sure that any changes in a PR are ready for Prod**

Keep PRs small and focused. If a change is large, split into multiple PRs.

### PR template

The repository has a PR template, when you create a PR, make sure to fill out the template completely, including the Jira work item link and all checklist items.

### How to create a PR

The PR template contains content that may be difficult to manage in the command line. It is recommended to use either the GitHub VS Code extension or GitHub online to create the PR.

1. Run all local tests, linters and scanners and fix any issues before creating a PR
2. Use the tool to create a new PR
3. Complete the PR template, including the JIRA work item link and all checklist items
4. Assign reviewers (not assignees), these are team members that may review the PR
5. Submit the PR for review

## 4. Review PR and wait for checks to pass

At least one team member is required to review the code and approve the PR before it can be merged to `main`. On occasion, other reviewers may be required,
such as members from Org Cybersecurity.

When a reviewer wants to discuss a part of the code, they can leave inline comments.

It is then up to the Developer to respond to and address the comments.

In addition, automated checks will have been run by the pull request workflow, and the reviewer will ensure that these have completed successfully

Action pull requests promptly.
Be constructive and respectful.

### How to review a PR

It is recommended to use either the GitHub VS Code extension or GitHub online to review pull requests.

**As a reviewer:**

1. Use the tool to locate the pull request
2. Assign yourself to the pull request
3. Review the pull request
4. Once the review is complete, choose to 'Comment', 'Request Changes' or 'Approve' the pull request

**As a Developer:**

- address review comments promptly by adding comments or commits
- after making changes, ensure your local branch and remote tracking branch are synchronized with any changes from `main`

## 5. Merge to `main`

Once a pull request has been approved, team members can merge the changes to the `main` branch.

### How to merge to `main`

It is recommended to use either the GitHub VS Code extension or GitHub online to merge pull requests.

1. Use the tool to locate the pull request
2. Select the 'Squash' merge option
3. Confirm the merge
4. Delete the feature branch

## 6. Automatically deploy from `main`

Once a pull request is merged to `main`, the main workflow will run and check, build and deploy the artifacts. The artifacts will first be deployed to the Dev environment.

The Developer of the story will monitor the main workflow to see that their changes are successfully deployed to the Dev environment. If not, they will work to correct any issues.

Once the changes are successfully deployed to the Dev environment, the Developer should test the changes in the Dev environment.

When the Developer has completed testing, they will set the Jira work item status to 'Testing' and assign it to the QA Automation Specialist.

---

## Allowed scopes

- `feat` — new feature
- `fix` — bug fix
- `docs` - documentation
- `test` — test changes
- `ci` - changes to workflows, actions or other cicd files
- `chore` — maintenance or housekeeping

## Hotfixes

For urgent production fixes:

1. Create a `hotfix/` branch from the production `main`.
2. Apply only the minimal fix and tests.
3. Open a PR, get fast-track review.
4. Merge and deploy, then create a follow-up branch to backport or rework if needed.

## Links and references

- [`Pull Request Template`](../.github/pull_request_template.md)
- [`Coding Guidelines`](coding-guidelines.md)

