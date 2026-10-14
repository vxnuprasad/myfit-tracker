# Recommended changes to the external sites

These sites are **outside this repository and were not modified**. The observations below come from fetching each page's text and metadata on the date of this review. I could not see raw `<script>` tags, so existing JSON-LD (if any) was **not** inspected; check each page with Google's Rich Results Test or the Schema.org validator before changing anything.

All four URLs responded: <https://vxnuprasad.github.io/>, <https://greynodlabs.com>, <https://greynoddigital.github.io>, and the repository <https://github.com/greynoddigital/myfit-tracker> (public).

## 1. Personal website (vxnuprasad.github.io)

**Already good:** title, description, canonical, Open Graph (with 1200x630 image) and Twitter card tags are present.

**Recommendations**

1. **Name consistency.** The page title and header use "Vxnu Prasad" while the meta author and body use "Vishnu Prasad". Pick one display name for search results and keep the other as an alternate name.
2. **Add `Person` structured data** (the page visibly shows the name, links and role, so this is supported). Suggested JSON-LD, to be adapted by you:

   ```html
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "Person",
     "name": "Vishnu Prasad",
     "alternateName": "Vxnu Prasad",
     "url": "https://vxnuprasad.github.io/",
     "sameAs": [
       "https://github.com/vxnuprasad",
       "https://www.linkedin.com/in/vxnuprasad",
       "https://vxnuprasad.medium.com/"
     ]
   }
   </script>
   ```

   `sameAs` above uses only profiles your own site already lists (GitHub, LinkedIn, Medium); confirm each is yours and public. Instagram is also listed on the site; include it only if you want it tied to your professional identity. Do **not** add `jobTitle`, `worksFor`, `alumniOf` or similar until you confirm exact wording; "cybersecurity student and developer" (your description) and "Cybersecurity Analyst" (the site) currently differ.
3. **Status wording.** The site calls GreyNod Labs "a cybersecurity company" and shows "Founded GreyNod Labs, 2025". If GreyNod Labs is a brand rather than a registered entity (GreyNod LLP is only proposed), consider "founder of the GreyNod Labs brand" wording until registration is confirmed. Also make sure the counters ("Projects Built", "Websites Developed", "Certifications") are accurate and current.
4. **Add MyFit Tracker to the Projects page** with descriptive link text ("MyFit Tracker, an open-source fitness tracker" once a licence exists) linking to <https://github.com/greynoddigital/myfit-tracker>. If you add a `SoftwareSourceCode` entry, make sure the visible page shows the same name, repository and author.

## 2. GreyNod Labs (greynodlabs.com)

**Already good:** canonical, description, Open Graph/Twitter tags, `index, follow`.

**Recommendations**

1. **Verify claims before adding `Organization` schema.** The page says "GreyNod Labs is a team of security researchers, bug bounty hunters, and red-team practitioners" and the logo alt text says "Cybersecurity Company". Only mark it up as an `Organization` if that wording is accurate. A minimal, non-committal version:

   ```html
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "name": "GreyNod Labs",
     "url": "https://greynodlabs.com/",
     "logo": "https://greynodlabs.com/assets/logo1.png",
     "sameAs": ["https://github.com/GreyNodlabs", "https://medium.com/@greynodlabs"]
   }
   </script>
   ```

   Do **not** add `legalName`, `address`, `foundingDate`, `taxID`, `employee` or registration identifiers unless they are real and verified. Do not mention GreyNod LLP anywhere until it is registered.
2. **LinkedIn URL.** This site links `linkedin.com/in/greynodlabs/` (a personal-profile style URL); the GreyNod Digital site links `linkedin.com/company/greynodlabs/`. Use the correct one in both places and in `sameAs`.
3. **Positioning.** This site presents GreyNod Labs as a cybersecurity/VAPT practice; GreyNod Digital's portfolio labels it "Product Studio". Align the wording so search engines and visitors see one consistent description.

## 3. GreyNod Digital (greynoddigital.github.io)

**Recommendations**

1. **Canonical mismatch.** `canonical` is `https://greynoddigital.github.io/` but `og:url` is `https://greynoddigital.com/`. If you own `greynoddigital.com`, decide which is the primary domain and make canonical, `og:url` and sitemap agree (and redirect the other). If you do not own it, remove it.
2. **Absolute social-image URLs.** `og:image` and `twitter:image` are relative (`assets/logo/logo.png`). Social crawlers need absolute `https://` URLs.
3. **Counters.** The static HTML shows "0+ Projects Delivered", "0+ Countries Served", "0% Custom Design". If they are filled by JavaScript, crawlers and users without JS see zeros. Put real, verifiable numbers in the HTML or remove unverified claims.
4. **Substantiate claims.** "Trusted by growing businesses", "Real projects. Real results." and "Available 24/7" should only stay if you can back them up.
5. **Structured data.** Add `Organization` (or `ProfessionalService`) only with details that are visibly on the page and true. Keep it as minimal as the GreyNod Labs example (name, url, logo, sameAs). No fake ratings, reviews or addresses.
6. **Relationship wording.** The footer says "Built with love by GreyNod Labs". If GreyNod Digital and GreyNod Labs are the same owner, say so plainly; do not imply a legal parent/subsidiary relationship.

## 4. Linking the ecosystem (legitimate discoverability)

- Link the three sites to each other and to the MyFit Tracker repository with descriptive text, in places where it is genuinely useful (Projects, About, footer). Avoid link swaps, hidden links and keyword-stuffed anchors.
- Do not add structured data that makes MyFit Tracker look like a GreyNod product unless you decide that is true.
- Verify each site in Google Search Console and Bing Webmaster Tools, submit sitemaps, and use the URL inspection tools to see how pages are indexed. Rankings and indexing take time and are not something this repository can promise or guarantee.
