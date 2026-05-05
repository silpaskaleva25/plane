**JIRA Work Item Link:**

<!-- All work must be tracked using a JIRA work item. Paste the full JIRA work item URL here -->

---

## Pull Request Summary

<!-- Provide a brief description of the changes in this pull request -->

### Changes Made

<!-- Describe the changes made in this PR. Include any relevant technical details. -->

-
-
-

## Code Review Checklist

### Guidelines

- [ ] Code follows the project's [coding guidelines](docs/coding-guidelines.md)
- [ ] Code follows the project's [secure coding guidelines](docs/secure-coding-guidelines.md)
- [ ] Code follows the [Secure Coding Standards](https://internal-docs.sharepoint.com/sites/S400D27-PROJECT/Starter%20Documents/Forms/AllItems.aspx?csf=1&web=1&e=884iZR&CID=c517e5e7%2D8698%2D4d56%2Dbd14%2Ddd10112f75ad&FolderCTID=0x012000769E6CF691030F4FA24EFDD8020AD1A6&id=%2Fsites%2FS400D27%2DPROJECT%2FStarter%20Documents%2FPlatform%20and%20Data%20Team%2FSecure%20Coding%20Standards%20Draft)

### Code

- [ ] No new warnings or errors are introduced
- [ ] Comments have been added, when necessary, for hard-to-understand areas. Unnecessary comments have been removed.
- [ ] All TODO's have been removed. They have either been addressed or added as work items in the backlog.

## Testing

- [ ] I have added/updated unit tests for all executable code
- [ ] I have manually tested this change locally
- [ ] All the tests execute successfully and pass

## Local Scanning

I have run the following scans before requesting a code review.
The scans execute successfully and **all high/critical** alerts have been addressed.

**Static code analysis**

- [ ] lint
- [ ] format:check
- [ ] SonarQube

**Software composition analysis (SCA)**

- [ ] pnpm audit

**Other**

- [ ] trivy
- [ ] TruffleHog

## Deployment Considerations

- [ ] Environment configuration changes have been made
  - [ ] If yes, then the changes have been documented

## Additional Notes

<!-- Add any additional notes, context, or screenshots that would be helpful for reviewers -->

## Reviewer Guidelines

- Ensure JIRA work item is properly linked
- Verify all checkboxes are completed appropriately
- Check that tests are adequate for the changes
- Confirm documentation is updated if needed


