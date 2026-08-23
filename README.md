# Compliance Brief

A FedScoop-style desk for FedRAMP, CMMC, FISMA, and DoD IL6 news, plus customer-impact alerts.

The top row shows the latest item from each source. The main column is a keyword-filtered stream. The sidebar matches stories against seeded customer profiles (including a Qwen / Chinese-model example).

## Local

```bash
npm install
npm run ingest
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

GitHub Actions refresh feeds every two hours and deploy the static build to GitHub Pages from `main`.
