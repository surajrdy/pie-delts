# Pie Delts 2026

Donation website for MIT Phi Delts' Pie Delts 2026 fundraiser.

## Payment Targets

- Venmo: `mitpdt`
- Zelle: `phi-treasurer@mit.edu`
- Payment description format: `Pie-[group name]-[names of people you want to pie]`
- Pricing: `$5` for 1 pie, `$12` for each 3-pie bundle; custom pie counts are converted into the cheapest bundle/single combination.

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Leaderboard

The site reads top-5 leaderboard data through the Netlify Function at `/api/leaderboard`.

- Spreadsheet: `https://docs.google.com/spreadsheets/d/1yEqKEgDuustlwxYinGIzCGwybixrZIEMLFkTcDwCn5w/edit`
- Brother source: gid `0`, with names in column A and total pies in column B.
- Group source: gid `1049888553`, with group names in column A and total pies in column B.
- Browser refresh interval: 30 minutes.

## Deployment

Netlify builds the site from GitHub using `npm run build` and publishes `dist/`.

- Netlify subdomain: `https://piedelts.netlify.app/`
- Intended custom domain: `https://piedelts.org/`
