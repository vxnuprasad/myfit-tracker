# Attribution and independent deployments

MyFit Tracker is designed so that anyone can run their own copy while the facts about authorship and operation stay accurate.

## Three separate facts

| Fact | Where it appears | Who controls it |
|---|---|---|
| **Original author:** Vishnu Prasad created the project | `README.md`, the footer, page metadata (`lib/brand.ts`), and the licence notice once a licence is added | Keep as is in forks |
| **Canonical source:** the upstream repository | `README.md`, footer "Source code" link | Keep as is, so people can find upstream and contribute |
| **Operator:** who runs *this particular* deployment | Optional footer line ("Operated independently by ...") | Each deployment owner |

## What the footer shows

- **Default (no operator set):** "Designed and built by Vishnu Prasad", links to the personal website, GreyNod Labs and GreyNod Digital, and a "Source code" link to the canonical repository.
- **With an operator set:** the credit changes to "Original project designed and built by Vishnu Prasad", an "Operated independently by *Name*" line is added, and the brand links are labelled as the original creator's. This tells visitors that the deployment is run by someone else, so nobody is led to think every deployment is owned, maintained or endorsed by the original author.
- The "Open source" label appears only when `OPEN_SOURCE_CONFIRMED` in `lib/brand.ts` is `true`. It is `false` until a licence has been chosen and added.

## Identifying yourself as an operator

Set these in `.env.local` and in your Vercel project's environment variables (they are **public**, shown to every visitor, so never put secrets in them):

```
NEXT_PUBLIC_OPERATOR_NAME=Your Name or Organisation
NEXT_PUBLIC_OPERATOR_URL=https://your-site.example   # optional, https only
```

Redeploy after changing them (`NEXT_PUBLIC_` values are baked in at build time). The name is trimmed and limited to 60 characters; a URL that is not `https` is ignored.

## Customising further

Everything is plain code: you can restyle or remove the footer, change the page title and metadata (`lib/brand.ts`, `app/layout.tsx`) and rebrand your deployment. Nothing phones home, injects remote content, or checks that attribution is present.

What you should keep, because it is simply true:

- Do not state or imply that you created the original project.
- Keep the original-author credit and licence notice in `README.md` and in the source files that carry them, as the chosen licence requires.
- Do not state that your deployment is run, hosted, maintained or endorsed by Vishnu Prasad or GreyNod unless that is true.

## No forced backlinks

There is no backlink requirement. A licence cannot be assumed to impose one, and none has been reviewed for that purpose. The footer credit is a courtesy and a statement of fact, and a licence's notice requirements (for example MIT's "keep the copyright and licence notice") are met by keeping the licence file, not by displaying links on a website.
