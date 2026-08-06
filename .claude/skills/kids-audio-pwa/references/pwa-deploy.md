# Deploying a PWA to a phone, and the ways it goes quiet

Three distinct failures all look like "my changes aren't there." Diagnose in this order,
because each check is cheaper than the one after it and rules the next one out.

1. **Did the deploy actually run?** Check the CI/Actions history for a run matching the
   merge commit. No run means nothing was published — stop here, it isn't caching.
2. **Did it publish where you think?** A blank white page is almost always a base-path
   mismatch.
3. **Is the phone showing a cached build?** Only now is the service worker the suspect.

## Base paths on a project site

A GitHub Pages project site is served from `https://<user>.github.io/<repo>/`, so the app
lives at a subpath. Three settings must agree, and a mismatch produces a page that loads
and then renders nothing:

- the bundler's `base`
- the PWA manifest `scope`
- the manifest `start_url`

```ts
const BASE = '/<repo-name>/'   // note: case-sensitive, matches the repo name exactly
export default defineConfig({ base: BASE, /* … manifest scope + start_url: BASE */ })
```

Renaming the repository without updating this ships a blank screen. When assets 404 with
paths that look almost right, this is the cause.

Reference bundled assets through the build-time base (`import.meta.env.BASE_URL` in
Vite) rather than hardcoding, so audio and icons resolve under the subpath.

## Service workers serve the previous build once

Even with an auto-update registration, an installed PWA typically serves the cached
build on the first load after an update and only then swaps. On iOS, home-screen apps
are especially stubborn.

Tell the user plainly: close the tab entirely, or delete and re-add the home-screen icon.
This is not a bug to fix; it is how the offline guarantee is paid for. What you *can* do
is stop it from being confusing — never let cache be the first hypothesis until you have
confirmed a deploy actually happened.

Precache the audio deliberately (`globPatterns` including your media extensions) and
raise the per-file cache limit if samples exceed the default, or the offline promise
quietly fails for exactly the files that matter.

## When CI stops running

CI can go silent — no runs of any kind, no failure anywhere to notice. Merges then land
on the default branch and are never built or published, and the live site sits on an old
build indefinitely.

Diagnose it by looking at the *whole* run history rather than one workflow: if nothing
of any kind has run since some timestamp, the problem is repository- or account-level,
not your deploy config. Check the repository's Actions setting, the account's billing
page, and the provider's status page.

`scripts/publish.sh` (bundled with this skill) is the fallback: it builds and pushes the
output to a `gh-pages` branch, which Pages can serve without CI. Point Pages at
**Deploy from a branch → `gh-pages` → / (root)**.

The catch worth stating up front, because it silently strands people: **the two Pages
sources are mutually exclusive.** While `gh-pages` is selected, the CI pipeline will not
publish even after CI recovers. Switch the source back once it does.

## Sanity checks that catch most of this

- Build and serve the production bundle locally at the same subpath before deploying.
- Assert in an end-to-end test that no control is clipped by the viewport — check real
  bounding boxes, not `scrollHeight`, since `overflow: hidden` masks the overflow and a
  clipped UI reports a clean scroll height.
- Screenshot the built app at every viewport it will be used at and *look at it*.
