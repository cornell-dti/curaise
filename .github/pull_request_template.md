## Summary

<!-- One or two sentences: what this PR does and why. Link the Notion task or GitHub issue. -->

Task: 

## Changes

<!-- What changed, by package (frontend / backend / common). Call out anything a reviewer should look at closely. -->

- 

## How to test

<!-- Steps a reviewer can follow locally. Include the account type (buyer, seller, admin) and any seed data needed. -->

1. 

## Screenshots

<!-- UI changes only. Before and after if the change is visual. Blur any real names or emails. -->

## Checklist

- [ ] Targets `main`
- [ ] Runs locally with `pnpm assemble` and both dev servers
- [ ] If `schema.prisma` changed: migration file is included and existing rows are backfilled
- [ ] If `common/` changed: `pnpm build` in `common` and both consumers updated
- [ ] No `.env*` files, keys, or real user data in the diff or screenshots
- [ ] I read every line of this diff and can explain it in review
