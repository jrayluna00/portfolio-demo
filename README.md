# Compliance Brief

A FedScoop-style desk for FedRAMP, CMMC, FISMA, and DoD IL6 news, plus customer-impact alerts.

The top row shows the latest item from each source. The main column is a keyword-filtered stream. The sidebar matches stories against seeded customer profiles (including a Qwen / Chinese-model example).

The **Guidance desk** (News → Guidance desk) answers SAP-through-SAR questions against current FedRAMP Consolidated Rules for 2026 and NIST SP 800-53 / 800-53A. Every briefing cites the official rule, control, or page it used, and labels legacy SAP/SAR templates when they still apply to agency-sponsored Rev5 work.

## Local

```bash
npm install
npm run ingest
npm test
npm run dev
```

## Feeds

| Tile | Source |
| --- | --- |
| FedRAMP | [fedramp.gov/changelog/rss.xml](https://www.fedramp.gov/changelog/rss.xml) (HTML changelog fallback) |
| LinkedIn Feed | CyberScoop RSS stand-in until LinkedIn Community Management API access |
| Discord | Federal News Network cybersecurity RSS stand-in |
| News crawler for FedRAMP | FedScoop RSS, compliance-keyword filtered |
| Other source | CISA news / advisories |
| CMMC Plug | FNN CMMC tag + NIST Cybersecurity Insights |

Customer profiles live in `src/data/customers.json`. Edit that file to add real customers and watch terms.

## Guidance desk

`npm run ingest:guidance` rebuilds `public/data/guidance.json` from:

- [FedRAMP Consolidated Rules JSON](https://github.com/FedRAMP/rules)
- [FedRAMP 2026 Markdown corpus](https://github.com/FedRAMP/2026-markdown) (the PMO's AI-agent snapshot of the rendered 2026 site)
- [NIST SP 800-53 Rev 5.2.0 / SP 800-53A OSCAL catalog](https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5)
- [FedRAMP Rev5 OSCAL baseline profiles](https://github.com/OSCAL-Foundation/fedramp-resources/tree/main/baselines/rev5)

Ask questions such as whether a 20x package still needs a SAP, what a legacy agency-sponsored SAR must contain, or how AC-2 is assessed. The desk retrieves those sources, adds SAP-to-SAR analysis, and prints citations.

GitHub Actions refresh feeds every two hours and deploy the static build to GitHub Pages from `main`.
