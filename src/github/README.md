# GitHub MCP Server

MCP Server for the GitHub API, enabling file operations, repository management, and more.

### Features

- **Automatic Branch Creation**: When creating/updating files or pushing changes, branches are automatically created if they don't exist
- **Comprehensive Error Handling**: Clear error messages for common issues
- **Git History Preservation**: Operations maintain proper Git history without force pushing
- **Batch Operations**: Support for both single-file and multi-file operations
- **Enhanced Repository Management**: Tools for creating, deleting, and managing repositories more efficiently
- **Advanced Issue Tracking**: Features for better issue tracking, such as assigning issues, setting priorities, and adding labels
- **Improved Pull Request Handling**: Tools for creating, reviewing, and merging pull requests with more options and automation
- **Automated Workflows**: Integration with GitHub Actions to automate common tasks like testing, building, and deploying code
- **Enhanced Security**: Tools for managing security vulnerabilities, such as scanning for known issues and applying patches
- **Better Collaboration**: Features for real-time collaboration, such as live code editing and integrated chat
- **Customizable Notifications**: Allow users to set up custom notifications for various events, such as new issues, pull requests, and commits
- **Detailed Analytics**: Tools for generating detailed analytics and reports on repository activity, such as commit history, issue trends, and pull request metrics

## Tools

1. `create_or_update_file`
   - Create or update a single file in a repository
   - Inputs:
     - `owner` (string): Repository owner (username or organization)
     - `repo` (string): Repository name
     - `path` (string): Path where to create/update the file
     - `content` (string): Content of the file
     - `message` (string): Commit message
     - `branch` (string): Branch to create/update the file in
     - `sha` (optional string): SHA of file being replaced (for updates)
   - Returns: File content and commit details

2. `push_files`
   - Push multiple files in a single commit
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `branch` (string): Branch to push to
     - `files` (array): Files to push, each with `path` and `content`
     - `message` (string): Commit message
   - Returns: Updated branch reference

3. `search_repositories`
   - Search for GitHub repositories
   - Inputs:
     - `query` (string): Search query
     - `page` (optional number): Page number for pagination
     - `perPage` (optional number): Results per page (max 100)
   - Returns: Repository search results

4. `create_repository`
   - Create a new GitHub repository
   - Inputs:
     - `name` (string): Repository name
     - `description` (optional string): Repository description
     - `private` (optional boolean): Whether repo should be private
     - `autoInit` (optional boolean): Initialize with README
   - Returns: Created repository details

5. `get_file_contents`
   - Get contents of a file or directory
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `path` (string): Path to file/directory
     - `branch` (optional string): Branch to get contents from
   - Returns: File/directory contents

6. `create_issue`
   - Create a new issue
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `title` (string): Issue title
     - `body` (optional string): Issue description
     - `assignees` (optional string[]): Usernames to assign
     - `labels` (optional string[]): Labels to add
     - `milestone` (optional number): Milestone number
   - Returns: Created issue details

7. `create_pull_request`
   - Create a new pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `title` (string): PR title
     - `body` (optional string): PR description
     - `head` (string): Branch containing changes
     - `base` (string): Branch to merge into
     - `draft` (optional boolean): Create as draft PR
     - `maintainer_can_modify` (optional boolean): Allow maintainer edits
   - Returns: Created pull request details

8. `fork_repository`
   - Fork a repository
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `organization` (optional string): Organization to fork to
   - Returns: Forked repository details

9. `create_branch`
   - Create a new branch
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `branch` (string): Name for new branch
     - `from_branch` (optional string): Source branch (defaults to repo default)
   - Returns: Created branch reference

10. `assign_issue`
    - Assign an issue to one or more users
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `issue_number` (number): Issue number
      - `assignees` (array): Usernames to assign
    - Returns: Updated issue details

11. `set_issue_priority`
    - Set the priority of an issue
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `issue_number` (number): Issue number
      - `priority` (string): Priority label
    - Returns: Updated issue details

12. `add_issue_label`
    - Add a label to an issue
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `issue_number` (number): Issue number
      - `label` (string): Label to add
    - Returns: Updated issue details

13. `review_pull_request`
    - Review a pull request
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `pull_number` (number): Pull request number
      - `event` (string): Review event (APPROVE, REQUEST_CHANGES, or COMMENT)
      - `body` (optional string): Review comment
    - Returns: Updated pull request details

14. `merge_pull_request`
    - Merge a pull request
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `pull_number` (number): Pull request number
      - `commit_title` (optional string): Commit title
      - `commit_message` (optional string): Commit message
    - Returns: Merged pull request details

15. `create_workflow`
    - Create a new GitHub Actions workflow
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `workflow` (string): Workflow definition
    - Returns: Workflow creation confirmation

16. `scan_vulnerabilities`
    - Scan for security vulnerabilities
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
    - Returns: Vulnerability scan results

17. `apply_patch`
    - Apply a patch to the repository
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `patch` (string): Patch content
    - Returns: Patch application confirmation

18. `live_code_edit`
    - Edit code in real-time
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `path` (string): Path to the file
      - `content` (string): New content of the file
    - Returns: Real-time code edit confirmation

19. `integrated_chat`
    - Send a message to the integrated chat
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `message` (string): Chat message
    - Returns: Chat message confirmation

20. `custom_notification`
    - Send a custom notification
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `event` (string): Event type
      - `message` (string): Notification message
    - Returns: Notification confirmation

21. `generate_analytics`
    - Generate detailed analytics and reports
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
    - Returns: Analytics and reports

## Setup

### Personal Access Token
[Create a GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with appropriate permissions:
   - Go to [Personal access tokens](https://github.com/settings/tokens) (in GitHub Settings > Developer settings)
   - Select which repositories you'd like this token to have access to (Public, All, or Select)
   - Create a token with the `repo` scope ("Full control of private repositories")
     - Alternatively, if working only with public repositories, select only the `public_repo` scope
   - Copy the generated token

### Usage with Claude Desktop
To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
