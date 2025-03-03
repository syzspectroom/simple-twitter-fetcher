# Simple Twitter Fetcher 🐦

A simple command-line tool to fetch tweets from specific Twitter accounts, save them to JSON files.

![Node Version](https://img.shields.io/badge/node-18%2B-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-agent--twitter--client%2Cwinston-blue)

## Features ✨

- Monitor a specific Twitter account for new tweets
- Regular polling with configurable interval
- Saves all tweets to JSON files
- Persists tweet history between runs

## Installation 📦

```bash
npm install
```

## Usage 🚀

```bash
npm start <twitter_account> <interval_minutes>
```

Or directly with Node:

```bash
node src/index.js <twitter_account> <interval_minutes>
```

### Examples 🔍

Monitor Twitter's official account every 10 minutes:

```bash
npm start twitter 10
```

Monitor Elon Musk's tweets every 5 minutes:

```bash
npm start elonmusk 5
```

## Data Storage 💾

Tweets are stored in JSON files in the `data` directory, with filenames based on the account being monitored:

```
data/
  elonmusk_tweets.json
  twitter_tweets.json
  ...
```

The JSON files contain all tweets collected from the account, sorted by date (newest first).

## Tweet Format 📋

Each tweet is stored in a structured JSON format:

```json
{
  "id": "1234567890",
  "created_at": "2024-07-13T22:51:28.000Z",
  "text": "Tweet content here",
  "author": {
    "id": "12345",
    "username": "elonmusk",
    "name": "Elon Musk"
  },
  "stats": {
    "likes": 3389186,
    "replies": 72189,
    "retweets": 408762,
    "views": 243909699
  },
  "media": [
    {
      "id": "1812258569280233472",
      "url": "https://pbs.twimg.com/media/GSZvkScbIAAwHQi.jpg"
    }
  ],
  "permalink": "https://twitter.com/elonmusk/status/1812258574049157405",
  "type": "tweet"
}
```

## Configuration ⚙️

You can modify these settings in the source code:

- Tweet formatting is handled in the `formatTweet` function in `index.js`
- Log settings can be adjusted in `logger.js`

## Disclaimer ⚠️

- This tool is for personal use only
- Usage must comply with Twitter's terms of service

## Contributing 🤝

Found a bug? Open an issue! Want to add features? Submit a PR!

## License

ISC

