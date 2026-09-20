# Indie Site Audit

A fast, open-source website health check for indie sites.

It audits the boring-but-important stuff in one shot: title and description quality, canonical URLs, heading structure, image alt text, Open Graph metadata, mobile viewport, document language, `robots.txt`, `sitemap.xml`, RSS/Atom discovery and basic link discoverability.

## Why this exists

Most SEO audit tools are either enterprise dashboards, signup funnels, or overloaded with metrics that small-site owners do not need. Indie Site Audit is intentionally small, readable and useful.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Astro URL and audit any public website.

## Stack

- Astro
- TypeScript
- Cheerio
- Astro Node adapter

## Roadmap

- broken-link crawler
- favicon and web manifest checks
- IndieWeb / Webmention checks
- accessibility heuristics
- shareable audit reports
- historical score snapshots

Built by [Shadorux](https://shadorux.dev/).
