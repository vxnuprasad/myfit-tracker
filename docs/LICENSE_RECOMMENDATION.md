# Licence recommendation (for the owner's approval)

**Current status: no licence exists in the project.** The canonical repository is public, so anyone can view and fork it on GitHub (allowed by GitHub's Terms of Service), but without a licence other people have **no permission** to reuse, modify or redistribute the code outside that. Nothing in this repository has been licensed on your behalf.

This is not legal advice. For anything commercial, or if GreyNod LLP is to become the rights holder, ask a lawyer.

## Options

| Licence | Reuse and redistribution | Attribution | Contributions | Fits when |
|---|---|---|---|---|
| **MIT** (recommended) | Anyone may use, modify, sell and relicense, including in closed-source products | Copies must keep the copyright and licence notice | Contributions are generally understood to come under the same terms | You want the widest adoption and the simplest rules |
| **Apache-2.0** | Same freedoms, plus an explicit patent grant | Must keep the licence and a `NOTICE` file; changes must be marked | Includes explicit contribution terms | You want stronger attribution trail and patent clarity; slightly heavier |
| **AGPL-3.0** | Anyone may use and modify, but modified versions, **including ones only run as a hosted service**, must publish their source under AGPL | Strong | Copyleft applies to contributions | You want hosted forks to stay open; many hobbyists and companies avoid AGPL |

## Recommendation

**MIT.** It matches the stated goal (developers fork, customise and deploy freely) and it keeps authorship traceable in the one place that legally matters: the copyright and licence notice that every copy must retain. It does not, and should not, force a visible backlink on deployed websites. If you want a more formal attribution trail, choose Apache-2.0 instead.

## Decisions only you can make

1. Which licence.
2. **Who is the copyright holder named in the notice:** "Vishnu Prasad" (individual) or a legal entity. GreyNod LLP is only proposed, so it should not be named unless it exists and you assign rights to it.
3. Whether to require a Contributor Licence Agreement or DCO sign-off (not needed for MIT, optional).

## What was prepared

A **proposed, not active** licence text is in [`docs/proposed-license/MIT.proposed.txt`](proposed-license/MIT.proposed.txt) with "Vishnu Prasad" as a placeholder holder. To adopt it, after approval: copy it to `LICENSE` in the repository root, set `"license": "MIT"` in `package.json`, update the README licence section, and set `OPEN_SOURCE_CONFIRMED = true` in `lib/brand.ts`.
