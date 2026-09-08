# Maintaining Lupinum Tree

## Architecture and boundaries

- `src/features/tree/domain/` owns parsing and output generation.
- `src/features/tree/infrastructure/` owns browser APIs and export adapters.
- `src/components/` owns the Vue interface.
- Shared tree links use the validated URL-fragment contract. Browsers do not send fragments to the server.
- Keep the deployment static. Do not add accounts, a backend, remote tree storage, or npm publication without an explicit product decision.
- Preserve keyboard editing, exact text input, local-only processing, Nathan Friend attribution, and the Apache-2.0 license.

## Local development

Lupinum Tree adopts the unpublished agent-led development draft at revision `bace3d8d7f50fb6d5768a04e32c217ea6910b142`, dated 8 September 2026. This is a development workflow, not production certification.

Install dependencies with `pnpm install --frozen-lockfile`. Start the existing development environment with:

```sh
pnpm dev
```

Vite+ prints the usable local URL. Readiness means that the Workbench loads, the Tree source editor contains the example, and Generated tree output is visible. Stop the owned server with `Ctrl+C`. Close owned browser tabs, then confirm that the printed local URL no longer responds.

Use a dedicated browser profile and synthetic folder names. Ordinary edits persist in that profile's local storage, including across reloads. A final disposable check can clear the site's local storage after the journey. Folder import reads file and folder names through the browser picker. It does not read file contents or send data to a backend. Authentication, roles, email, payments, analytics, database setup, and production credentials are not applicable.

The representative browser journey is:

1. Edit the source and confirm that the output updates.
2. Reload and confirm that the source and output persist.
3. Enter an invalid dedent, confirm the inline error, and correct it.
4. Copy the output and create a share link.
5. Open the share link and confirm that the fragment is imported, then removed from the address after local persistence succeeds.
6. Import a synthetic local folder and export the result as PNG.
7. Check the Workbench and Guide at a phone width. Check editor indentation, focus escape, navigation, and the Guide accordion with a keyboard and reduced motion.

On 8 September 2026, this journey was proven in Chromium against `pnpm dev`. Reload persistence, folder import, output copy, share-link roundtrip, malformed input and link recovery, PNG export feedback, mobile layout, keyboard navigation, and zero-duration reduced-motion transitions passed. Browser warnings and errors were empty. The rollout also found and fixed a Tailwind source-scan leak that let maintenance prose change production CSS. Hosted production behavior remains a separate deployment check.

| Outcome                                                        | Status         | Evidence or remaining gate                                                                   |
| -------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| Local start, readiness, persistence, and shutdown              | Proven         | Existing `pnpm dev` flow and the representative browser journey                              |
| Static local containment                                       | Proven         | Loopback origin, synthetic names, browser storage, and no outbound app integration           |
| Authentication, roles, backend, database, and external effects | Not applicable | The product is static and browser-local                                                      |
| Repository handoff gate                                        | Proven         | `pnpm release:verify`: clean audit, 71 tests, checks, client build, SSR build, and prerender |
| Current hosted origin                                          | Proven         | Workbench, Guide, canonical metadata, robots, sitemap, and empty browser error log           |
| Post-change production deployment                              | Unverified     | Requires an authorized merge, Vercel source-commit check, and the deployment checklist below |
| Non-Chromium browser behavior                                  | Unverified     | Run when a release changes a browser API or a supported-browser defect is reported           |

## Quick fix

Create a focused branch. Add a regression test when behavior changes. Run `pnpm verify`. Open a pull request with the result, verification, and risk.

## Large change

Open an issue first. Record important architecture decisions only when the history and tradeoff must remain visible. Keep migration and rollback steps explicit.

## Dependency update

Use Renovate for routine updates. Do not bypass the 24-hour dependency quarantine. Run `pnpm audit:all` and `pnpm verify` after a lockfile change.

## Documentation or copy change

Use plain, direct public copy. Run `pnpm docs:build`. Inspect the app at desktop and mobile widths.

## Deployment

The production mapping is `lupinum-dev/lupinum-tree` branch `main` to the Vercel project `tree-lupinum-com`. Vercel builds from the repository root with `pnpm build`, serves `dist/`, and assigns `https://tree.lupinum.com/` to production. The app has no backend, database migration, server secret, or production-data cutover.

Before a production rollout, run `pnpm release:verify`. Merge only after the required CI and Vercel checks pass. Confirm that the deployment source is the intended `main` commit before moving traffic. A frontend preview cannot fall back to production data because all tree state is browser-local.

After deployment, verify:

- the editor, output settings, copy action, share link, and folder picker;
- the Workbench and Guide navigation in both directions;
- desktop and mobile layouts;
- the distinct home and guide canonical URLs, social image, icons, robots file, and sitemap;
- GitHub, contact, privacy, and legal links;
- the browser console and failed network requests.

## Rollback

Use Vercel to promote the last known-good deployment. Then revert or fix the responsible commit through a pull request. Browser-local workspaces are not changed by a static deployment rollback. Preserve the workspace version 1 and share-fragment version 1 readers unless a separate migration and recovery plan replaces them. Do not leave production and `main` different without an incident note.

## Credential incident

Stop deployments. Revoke the affected credential, review logs, and rotate it in the owning service. Never commit replacement secrets. Confirm that old deployments cannot read the new value.
