# Contributing

## Prerequisites

Node.js 20.19.0 or later — `powerbi-visuals-tools` 7.x requires it, and CI runs on 20.x and 22.x.

## Development

```bash
npm ci              # install from the lock file
npm start           # pbiviz start — serve the visual for debugging
npm run lint        # eslint
npm test            # packages the visual, then runs the karma suite
npm run package     # pbiviz package — produce the .pbiviz
```

Run `npm run cert` once to install the local certificate required by `pbiviz start`.

## GitHub Actions must be pinned to full-length commit SHAs

Every `uses:` entry in `.github/workflows/**` must reference a **40-character commit SHA**, with the
human-readable version in a trailing comment:

```yaml
- uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
```

Not allowed: `@v4`, `@main`, `@latest`, or an abbreviated SHA.

### Why this matters

A tag or branch name is a *mutable pointer*, and it is resolved when the workflow runs, not when the
pull request is reviewed. Whoever controls the action's repository can move `v4` to a different commit
at any time, and every workflow referencing `@v4` silently starts executing that new code — with no
diff, no pull request and no review on our side.

That code does not run in a sandbox. A workflow step has the checked-out repository, the
`GITHUB_TOKEN`, any secrets passed to the job, and write access to the Actions cache, which later jobs
restore. Compromising a single popular action is therefore a supply-chain attack on every repository
that consumes it.

This is not theoretical. In March 2025 an attacker retagged existing version tags of
`tj-actions/changed-files` (CVE-2025-30066) to point at a malicious commit that dumped the runner's
memory and leaked secrets into publicly readable build logs; roughly 23,000 repositories referenced
that action. The entry point was another compromised action, `reviewdog/action-setup`
(CVE-2025-30154). Repositories that pinned by commit SHA were unaffected, because the moved tags never
reached them.

Even without an attacker, tag drift is a problem: a maintainer repointing `v4` at a release with
different behaviour turns a green pipeline red — or worse, quietly changes what gets built and
published — without anything to bisect. Pinning by SHA makes every change to third-party code arrive
as a reviewable line in a pull request.

The OSSF Scorecard `Pinned-Dependencies` check enforces exactly this.

### Updating a pinned action

`.github/dependabot.yml` watches the `github-actions` ecosystem and opens a weekly pull request with
the new SHA and an updated version comment, so in the normal case there is nothing to do by hand. The
configured 7-day cooldown deliberately delays picking up a freshly published release.

When you do need to update manually — a security release you do not want to wait for, an action
Dependabot does not track, or a new step you are adding — resolve the tag to a commit SHA rather than
copying it from documentation:

```bash
gh api repos/actions/checkout/tags --paginate \
  --jq '.[] | select(.name=="v4.4.0") | .commit.sha'
```

Use the `/tags` endpoint rather than `/git/ref/tags/<tag>` — for annotated tags the latter returns the
SHA of the tag object instead of the commit it points at, and pinning that value does not work.

Then:

- update the trailing `# vX.Y.Z` comment to match, since Dependabot reads it to work out the current
  version;
- update *every* occurrence across `.github/workflows/**`, and keep actions that ship from one
  repository on one SHA — `github/codeql-action/init`, `/autobuild` and `/analyze` must always agree;
- read the release notes before bumping a major version; the pin is not a substitute for that.

If you change a workflow step that another pull request also touches, keep the pinned form when
resolving the conflict — replacing it with a plain tag silently reverts this policy.
