# aoc-bot

A bot for advent of code for 13|37

Start the server with `npm run serve` to watch the directory for changes while developing.

## Start with PM2
pm2 start app.js --name aocbot 

## .env file

```
session=### A valid session from the the advent of code site. https://adventofcode.com
token=### A token obtained from the slack developer page. https://api.slack.com/
channelId=### The channel-id you want to post messages to.
isDev=true/false if we're on dev (I cache to not be rate limited)
```
