const { Octokit } = require('@octokit/rest');
const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

if (!repo) {
  console.error('GITHUB_REPOSITORY not set. Set to owner/repo');
  process.exit(1);
}
if (!token) {
  console.error('GH_TOKEN or GITHUB_TOKEN not set. Provide a token as env var');
  process.exit(1);
}

const [owner, repoName] = repo.split('/');
const octokit = new Octokit({ auth: token });

(async () => {
  try {
    const workflows = await octokit.actions.listRepoWorkflows({ owner, repo: repoName });
    const runs = await octokit.actions.listWorkflowRunsForRepo({ owner, repo: repoName, per_page: 5 });
    console.log('Workflows:', workflows.data.workflows.map(w => w.name).join(', '));
    console.log('Recent runs:');
    for (const r of runs.data.workflow_runs) {
      console.log(`${r.name} #${r.run_number} - ${r.event} - ${r.status} - ${r.conclusion || 'n/a'} - ${r.html_url}`);
    }
  } catch (err) {
    console.error('check-ci error', err);
    process.exit(1);
  }
})();
