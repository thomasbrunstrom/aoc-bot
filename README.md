# aoc-bot

A bot for advent of code for tretton37

Start the server with `npm run dev` to watch the directory for changes while developing.

## Start with PM2

```bash
pm2 start dist/app.js --name aocbot
```

## .env file

```
session=### A valid session from the the advent of code site. https://adventofcode.com
token=### A token obtained from the slack developer page. https://api.slack.com/
channelId=### The channel-id you want to post messages to.
isDev=true/false if we're on dev (I cache to not be rate limited)
privateLeaderboardCode=### Private leaderboard code
sponsorJoinCode=### Sponsor join code
```
