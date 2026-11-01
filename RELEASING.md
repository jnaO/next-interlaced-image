# Releasing

## First release

Status: the code is ready, but it is not on GitHub or npm yet. Publishing is waiting on the npm account reset.

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

4. Make the GitHub repo public, if it is still private:

   ```sh
   gh repo edit jnaO/next-interlaced-image --visibility public --accept-visibility-change-consequences
   ```

## After the first release: Valaberget

Branch `feat/image-placeholders` in `~/Sites/valaberget` holds the integration as uncommitted changes. It installs this package from `file:../next-interlaced-image`, which fails on Vercel, so do not deploy it yet.

1. In Valaberget, replace the local install with the published version:

   ```sh
   pnpm add next-interlaced-image
   ```

2. Run lint, `tsc --noEmit` and `pnpm build`, then check the pages in a browser.
3. Commit and open the PR.
