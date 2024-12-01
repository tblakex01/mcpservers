#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import {
  GitHubForkSchema,
  GitHubReferenceSchema,
  GitHubRepositorySchema,
  GitHubIssueSchema,
  GitHubPullRequestSchema,
  GitHubContentSchema,
  GitHubCreateUpdateFileResponseSchema,
  GitHubSearchResponseSchema,
  GitHubTreeSchema,
  GitHubCommitSchema,
  CreateRepositoryOptionsSchema,
  CreateIssueOptionsSchema,
  CreatePullRequestOptionsSchema,
  CreateBranchOptionsSchema,
  type GitHubFork,
  type GitHubReference,
  type GitHubRepository,
  type GitHubIssue,
  type GitHubPullRequest,
  type GitHubContent,
  type GitHubCreateUpdateFileResponse,
  type GitHubSearchResponse,
  type GitHubTree,
  type GitHubCommit,
  type FileOperation,
  CreateOrUpdateFileSchema,
  SearchRepositoriesSchema,
  CreateRepositorySchema,
  GetFileContentsSchema,
  PushFilesSchema,
  CreateIssueSchema,
  CreatePullRequestSchema,
  ForkRepositorySchema,
  CreateBranchSchema,
  AssignIssueSchema,
  SetIssuePrioritySchema,
  AddIssueLabelSchema,
  ReviewPullRequestSchema,
  MergePullRequestSchema,
  CreateWorkflowSchema,
  ScanVulnerabilitiesSchema,
  ApplyPatchSchema,
  LiveCodeEditSchema,
  IntegratedChatSchema,
  CustomNotificationSchema,
  GenerateAnalyticsSchema
} from './schemas.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const server = new Server({
  name: "github-mcp-server",
  version: "0.1.0",
}, {
  capabilities: {
    tools: {}
  }
});

const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

if (!GITHUB_PERSONAL_ACCESS_TOKEN) {
  console.error("GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set");
  process.exit(1);
}

async function forkRepository(
  owner: string,
  repo: string,
  organization?: string
): Promise<GitHubFork> {
  const url = organization 
    ? `https://api.github.com/repos/${owner}/${repo}/forks?organization=${organization}`
    : `https://api.github.com/repos/${owner}/${repo}/forks`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "github-mcp-server"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubForkSchema.parse(await response.json());
}

async function createBranch(
  owner: string,
  repo: string,
  options: z.infer<typeof CreateBranchOptionsSchema>
): Promise<GitHubReference> {
  const fullRef = `refs/heads/${options.ref}`;
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ref: fullRef,
        sha: options.sha
      })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubReferenceSchema.parse(await response.json());
}

async function getDefaultBranchSHA(
  owner: string,
  repo: string
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
    {
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server"
      }
    }
  );

  if (!response.ok) {
    const masterResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/master`,
      {
        headers: {
          "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "github-mcp-server"
        }
      }
    );

    if (!masterResponse.ok) {
      throw new Error("Could not find default branch (tried 'main' and 'master')");
    }

    const data = GitHubReferenceSchema.parse(await masterResponse.json());
    return data.object.sha;
  }

  const data = GitHubReferenceSchema.parse(await response.json());
  return data.object.sha;
}

async function getFileContents(
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<GitHubContent> {
  let url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  if (branch) {
    url += `?ref=${branch}`;
  }

  const response = await fetch(url, {
    headers: {
      "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "github-mcp-server"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = GitHubContentSchema.parse(await response.json());

  // If it's a file, decode the content
  if (!Array.isArray(data) && data.content) {
    data.content = Buffer.from(data.content, 'base64').toString('utf8');
  }

  return data;
}

async function createIssue(
  owner: string,
  repo: string,
  options: z.infer<typeof CreateIssueOptionsSchema>
): Promise<GitHubIssue> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(options)
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubIssueSchema.parse(await response.json());
}

async function createPullRequest(
  owner: string,
  repo: string,
  options: z.infer<typeof CreatePullRequestOptionsSchema>
): Promise<GitHubPullRequest> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(options)
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubPullRequestSchema.parse(await response.json());
}

async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<GitHubCreateUpdateFileResponse> {
  const encodedContent = Buffer.from(content).toString('base64');

  let currentSha = sha;
  if (!currentSha) {
    try {
      const existingFile = await getFileContents(owner, repo, path, branch);
      if (!Array.isArray(existingFile)) {
        currentSha = existingFile.sha;
      }
    } catch (error) {
      console.error('Note: File does not exist in branch, will create new file');
    }
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  const body = {
    message,
    content: encodedContent,
    branch,
    ...(currentSha ? { sha: currentSha } : {})
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "github-mcp-server",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubCreateUpdateFileResponseSchema.parse(await response.json());
}

async function createTree(
  owner: string,
  repo: string,
  files: FileOperation[],
  baseTree?: string
): Promise<GitHubTree> {
  const tree = files.map(file => ({
    path: file.path,
    mode: '100644' as const,
    type: 'blob' as const,
    content: file.content
  }));

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tree,
        base_tree: baseTree
      })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubTreeSchema.parse(await response.json());
}

async function createCommit(
  owner: string,
  repo: string,
  message: string,
  tree: string,
  parents: string[]
): Promise<GitHubCommit> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        tree,
        parents
      })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubCommitSchema.parse(await response.json());
}

async function updateReference(
  owner: string,
  repo: string,
  ref: string,
  sha: string
): Promise<GitHubReference> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/${ref}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sha,
        force: true
      })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubReferenceSchema.parse(await response.json());
}

async function pushFiles(
  owner: string,
  repo: string,
  branch: string,
  files: FileOperation[],
  message: string
): Promise<GitHubReference> {
  const refResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server"
      }
    }
  );

  if (!refResponse.ok) {
    throw new Error(`GitHub API error: ${refResponse.statusText}`);
  }

  const ref = GitHubReferenceSchema.parse(await refResponse.json());
  const commitSha = ref.object.sha;

  const tree = await createTree(owner, repo, files, commitSha);
  const commit = await createCommit(owner, repo, message, tree.sha, [commitSha]);
  return await updateReference(owner, repo, `heads/${branch}`, commit.sha);
}

async function searchRepositories(
  query: string,
  page: number = 1,
  perPage: number = 30
): Promise<GitHubSearchResponse> {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.append("q", query);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per_page", perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "github-mcp-server"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubSearchResponseSchema.parse(await response.json());
}

async function createRepository(
  options: z.infer<typeof CreateRepositoryOptionsSchema>
): Promise<GitHubRepository> {
  const response = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "github-mcp-server",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubRepositorySchema.parse(await response.json());
}

async function assignIssue(
  owner: string,
  repo: string,
  issue_number: number,
  assignees: string[]
): Promise<GitHubIssue> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/assignees`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ assignees })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubIssueSchema.parse(await response.json());
}

async function setIssuePriority(
  owner: string,
  repo: string,
  issue_number: number,
  priority: string
): Promise<GitHubIssue> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ labels: [priority] })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubIssueSchema.parse(await response.json());
}

async function addIssueLabel(
  owner: string,
  repo: string,
  issue_number: number,
  label: string
): Promise<GitHubIssue> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/labels`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ labels: [label] })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubIssueSchema.parse(await response.json());
}

async function reviewPullRequest(
  owner: string,
  repo: string,
  pull_number: number,
  event: string,
  body?: string
): Promise<GitHubPullRequest> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/reviews`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ event, body })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubPullRequestSchema.parse(await response.json());
}

async function mergePullRequest(
  owner: string,
  repo: string,
  pull_number: number,
  commit_title?: string,
  commit_message?: string
): Promise<GitHubPullRequest> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/merge`,
    {
      method: "PUT",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ commit_title, commit_message })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return GitHubPullRequestSchema.parse(await response.json());
}

async function createWorkflow(
  owner: string,
  repo: string,
  workflow: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ workflow })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
}

async function scanVulnerabilities(
  owner: string,
  repo: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/vulnerability-alerts`,
    {
      method: "GET",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
}

async function applyPatch(
  owner: string,
  repo: string,
  patch: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ patch })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
}

async function liveCodeEdit(
  owner: string,
  repo: string,
  path: string,
  content: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
}

async function integratedChat(
  owner: string,
  repo: string,
  message: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/comments`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ body: message })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
}

async function customNotification(
  owner: string,
  repo: string,
  event: string,
  message: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ event_type: event, client_payload: { message } })
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
}

async function generateAnalytics(
  owner: string,
  repo: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/traffic/views`,
    {
      method: "GET",
      headers: {
        "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-mcp-server"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_or_update_file",
        description: "Create or update a single file in a GitHub repository",
        inputSchema: zodToJsonSchema(CreateOrUpdateFileSchema)
      },
      {
        name: "search_repositories",
        description: "Search for GitHub repositories",
        inputSchema: zodToJsonSchema(SearchRepositoriesSchema)
      },
      {
        name: "create_repository",
        description: "Create a new GitHub repository in your account",
        inputSchema: zodToJsonSchema(CreateRepositorySchema)
      },
      {
        name: "get_file_contents",
        description: "Get the contents of a file or directory from a GitHub repository",
        inputSchema: zodToJsonSchema(GetFileContentsSchema)
      },
      {
        name: "push_files",
        description: "Push multiple files to a GitHub repository in a single commit",
        inputSchema: zodToJsonSchema(PushFilesSchema)
      },
      {
        name: "create_issue",
        description: "Create a new issue in a GitHub repository",
        inputSchema: zodToJsonSchema(CreateIssueSchema)
      },
      {
        name: "create_pull_request",
        description: "Create a new pull request in a GitHub repository",
        inputSchema: zodToJsonSchema(CreatePullRequestSchema)
      },
      {
        name: "fork_repository",
        description: "Fork a GitHub repository to your account or specified organization",
        inputSchema: zodToJsonSchema(ForkRepositorySchema)
      },
      {
        name: "create_branch",
        description: "Create a new branch in a GitHub repository",
        inputSchema: zodToJsonSchema(CreateBranchSchema)
      },
      {
        name: "assign_issue",
        description: "Assign an issue to one or more users",
        inputSchema: zodToJsonSchema(AssignIssueSchema)
      },
      {
        name: "set_issue_priority",
        description: "Set the priority of an issue",
        inputSchema: zodToJsonSchema(SetIssuePrioritySchema)
      },
      {
        name: "add_issue_label",
        description: "Add a label to an issue",
        inputSchema: zodToJsonSchema(AddIssueLabelSchema)
      },
      {
        name: "review_pull_request",
        description: "Review a pull request",
        inputSchema: zodToJsonSchema(ReviewPullRequestSchema)
      },
      {
        name: "merge_pull_request",
        description: "Merge a pull request",
        inputSchema: zodToJsonSchema(MergePullRequestSchema)
      },
      {
        name: "create_workflow",
        description: "Create a new GitHub Actions workflow",
        inputSchema: zodToJsonSchema(CreateWorkflowSchema)
      },
      {
        name: "scan_vulnerabilities",
        description: "Scan for security vulnerabilities",
        inputSchema: zodToJsonSchema(ScanVulnerabilitiesSchema)
      },
      {
        name: "apply_patch",
        description: "Apply a patch to the repository",
        inputSchema: zodToJsonSchema(ApplyPatchSchema)
      },
      {
        name: "live_code_edit",
        description: "Edit code in real-time",
        inputSchema: zodToJsonSchema(LiveCodeEditSchema)
      },
      {
        name: "integrated_chat",
        description: "Send a message to the integrated chat",
        inputSchema: zodToJsonSchema(IntegratedChatSchema)
      },
      {
        name: "custom_notification",
        description: "Send a custom notification",
        inputSchema: zodToJsonSchema(CustomNotificationSchema)
      },
      {
        name: "generate_analytics",
        description: "Generate detailed analytics and reports",
        inputSchema: zodToJsonSchema(GenerateAnalyticsSchema)
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "fork_repository": {
        const args = ForkRepositorySchema.parse(request.params.arguments);
        const fork = await forkRepository(args.owner, args.repo, args.organization);
        return { toolResult: fork };
      }

      case "create_branch": {
        const args = CreateBranchSchema.parse(request.params.arguments);
        let sha: string;
        if (args.from_branch) {
          const response = await fetch(
            `https://api.github.com/repos/${args.owner}/${args.repo}/git/refs/heads/${args.from_branch}`,
            {
              headers: {
                "Authorization": `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "github-mcp-server"
              }
            }
          );

          if (!response.ok) {
            throw new Error(`Source branch '${args.from_branch}' not found`);
          }

          const data = GitHubReferenceSchema.parse(await response.json());
          sha = data.object.sha;
        } else {
          sha = await getDefaultBranchSHA(args.owner, args.repo);
        }

        const branch = await createBranch(args.owner, args.repo, {
          ref: args.branch,
          sha
        });

        return { toolResult: branch };
      }

      case "search_repositories": {
        const args = SearchRepositoriesSchema.parse(request.params.arguments);
        const results = await searchRepositories(args.query, args.page, args.perPage);
        return { toolResult: results };
      }

      case "create_repository": {
        const args = CreateRepositorySchema.parse(request.params.arguments);
        const repository = await createRepository(args);
        return { toolResult: repository };
      }

      case "get_file_contents": {
        const args = GetFileContentsSchema.parse(request.params.arguments);
        const contents = await getFileContents(args.owner, args.repo, args.path, args.branch);
        return { toolResult: contents };
      }

      case "create_or_update_file": {
        const args = CreateOrUpdateFileSchema.parse(request.params.arguments);
        const result = await createOrUpdateFile(
          args.owner,
          args.repo,
          args.path,
          args.content,
          args.message,
          args.branch,
          args.sha
        );
        return { toolResult: result };
      }

      case "push_files": {
        const args = PushFilesSchema.parse(request.params.arguments);
        const result = await pushFiles(
          args.owner,
          args.repo,
          args.branch,
          args.files,
          args.message
        );
        return { toolResult: result };
      }

      case "create_issue": {
        const args = CreateIssueSchema.parse(request.params.arguments);
        const { owner, repo, ...options } = args;
        const issue = await createIssue(owner, repo, options);
        return { toolResult: issue };
      }

      case "create_pull_request": {
        const args = CreatePullRequestSchema.parse(request.params.arguments);
        const { owner, repo, ...options } = args;
        const pullRequest = await createPullRequest(owner, repo, options);
        return { toolResult: pullRequest };
      }

      case "assign_issue": {
        const args = AssignIssueSchema.parse(request.params.arguments);
        const result = await assignIssue(args.owner, args.repo, args.issue_number, args.assignees);
        return { toolResult: result };
      }

      case "set_issue_priority": {
        const args = SetIssuePrioritySchema.parse(request.params.arguments);
        const result = await setIssuePriority(args.owner, args.repo, args.issue_number, args.priority);
        return { toolResult: result };
      }

      case "add_issue_label": {
        const args = AddIssueLabelSchema.parse(request.params.arguments);
        const result = await addIssueLabel(args.owner, args.repo, args.issue_number, args.label);
        return { toolResult: result };
      }

      case "review_pull_request": {
        const args = ReviewPullRequestSchema.parse(request.params.arguments);
        const result = await reviewPullRequest(args.owner, args.repo, args.pull_number, args.event, args.body);
        return { toolResult: result };
      }

      case "merge_pull_request": {
        const args = MergePullRequestSchema.parse(request.params.arguments);
        const result = await mergePullRequest(args.owner, args.repo, args.pull_number, args.commit_title, args.commit_message);
        return { toolResult: result };
      }

      case "create_workflow": {
        const args = CreateWorkflowSchema.parse(request.params.arguments);
        await createWorkflow(args.owner, args.repo, args.workflow);
        return { toolResult: { success: true } };
      }

      case "scan_vulnerabilities": {
        const args = ScanVulnerabilitiesSchema.parse(request.params.arguments);
        await scanVulnerabilities(args.owner, args.repo);
        return { toolResult: { success: true } };
      }

      case "apply_patch": {
        const args = ApplyPatchSchema.parse(request.params.arguments);
        await applyPatch(args.owner, args.repo, args.patch);
        return { toolResult: { success: true } };
      }

      case "live_code_edit": {
        const args = LiveCodeEditSchema.parse(request.params.arguments);
        await liveCodeEdit(args.owner, args.repo, args.path, args.content);
        return { toolResult: { success: true } };
      }

      case "integrated_chat": {
        const args = IntegratedChatSchema.parse(request.params.arguments);
        await integratedChat(args.owner, args.repo, args.message);
        return { toolResult: { success: true } };
      }

      case "custom_notification": {
        const args = CustomNotificationSchema.parse(request.params.arguments);
        await customNotification(args.owner, args.repo, args.event, args.message);
        return { toolResult: { success: true } };
      }

      case "generate_analytics": {
        const args = GenerateAnalyticsSchema.parse(request.params.arguments);
        await generateAnalytics(args.owner, args.repo);
        return { toolResult: { success: true } };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
