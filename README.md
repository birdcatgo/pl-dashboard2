This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

# PL Dashboard

This is a comprehensive dashboard for performance and financial tracking.

## Dynamic Media Buyer Support

The dashboard now automatically detects and includes new media buyers without requiring code changes:

### How it Works

1. **Performance Components**: The `MediaBuyerPerformance` and `ThirtyDayChallenge` components automatically detect active media buyers using commission data status (`ACTIVE`/`INACTIVE`).

2. **Campaign Parsing**: The `campaign-utils.js` file includes known media buyer names for proper campaign parsing. Currently includes: Aakash, Asheesh, Bikki, Daniel, Edwin, Gagan, Isha, Ishaan, Mike, Mike C, Nick N, Pavan, Zel.

3. **Meeting Tracking**: The `MediaBuyerProgress` component dynamically generates the meeting tracking list based on actual performance data.

4. **Highlights Component**: Automatically includes media buyers who have been active in the last 30 days.

5. **Cash Flow Planning**: Uses hardcoded budget structures for specific media buyers (necessary for budget allocation).

### Adding New Media Buyers

To ensure a new media buyer (like "Pavan") appears correctly:

1. **Commission Data**: Add the media buyer to your commission spreadsheet with status "ACTIVE"
2. **Campaign Naming**: If using new campaign naming patterns, the system will auto-detect the buyer name, but you can optionally add to `knownMediaBuyers` in `campaign-utils.js` for better parsing
3. **Cash Flow Planning**: If the buyer needs budget tracking, add them to the `mediaBuyerSpend` state in `CashFlowPlanner.jsx`

The system is designed to automatically pick up new media buyers from your data without code changes in most cases.

## Features
