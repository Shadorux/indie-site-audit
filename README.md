# Indie Site Audit

> Fast, open-source website health checks for the weird web.

![Indie Site Audit interface](docs/indie-site-audit.png)

Indie Site Audit gives independent website owners a quick, readable health check without an enterprise dashboard, signup wall, or giant pile of vanity metrics.

Paste a public URL and get a server-side audit covering the boring-but-important pieces that make a site easier to discover, understand, and share.

## What it checks

- page title and meta description
- canonical URL
- H1 structure
- image alt-text coverage
- Open Graph metadata
- mobile viewport
- document language
- `robots.txt`
- `sitemap.xml`
- RSS / Atom autodiscovery
- basic internal-link discoverability

The report assigns a simple 0–100 score and explains what passed, what needs attention, and why it matters.

## Why this exists

Most website audit products are built for agencies, enterprise SEO teams, or lead-generation funnels. Small personal sites, fan sites, blogs, portfolios, and IndieWeb projects usually need something much simpler: a fast answer to “is the basic stuff actually set up correctly?”

Indie Site Audit is intentionally small, readable, open source, and useful without an account.

## Run locally

```bash
npm install
npm run dev
```

Astro will print a local URL. Open it and audit any public website.

For a production build:

```bash
npm run build
npm run preview
```

## Stack

- [Astro](https://astro.build/)
- TypeScript
- [Cheerio](https://cheerio.js.org/)
- Astro Node adapter

## Roadmap

- [ ] broken-link crawler
- [ ] favicon and web manifest checks
- [ ] IndieWeb / Webmention checks
- [ ] deeper accessibility heuristics
- [ ] shareable audit reports
- [ ] historical score snapshots

Issues and pull requests are welcome.

## License

MIT

Built by [Shadorux](https://shadorux.dev/).
