# Releasing

## First release

Status: the code is on GitHub, but not on npm yet. Publishing is waiting on the npm account reset. Until then `dist` is committed, so Valaberget can install this package directly from GitHub.

1. Finish the npm account reset and set up 2FA.
2. Check that the name is still free. A 404 means it is:

   ```sh
   npm view next-interlaced-image
   ```

3. Publish from this folder on Node 26. `prepublishOnly` runs lint and build first.

   ```sh
   nvm use 26
   npm login
   npm publish
   ```

## After the first release: Valaberget

Valaberget installs this package from GitHub.

1. In Valaberget, replace the local install with the published version:

   ```sh
   pnpm add next-interlaced-image
   ```

2. Run lint, `tsc --noEmit` and `pnpm build`, then check the pages in a browser.
3. Commit and open the PR.

## After the first release: clean up

Add `dist` back to `.gitignore` and run `git rm -r --cached dist`.
