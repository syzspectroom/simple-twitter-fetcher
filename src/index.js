const { Scraper } = require('agent-twitter-client');
const fs = require('fs').promises;
const path = require('path');
const TweetStorage = require('./tweet_storage');
const logger = require('./logger');

// Format tweets into our standard structure
const formatTweet = (rawTweet) => {
  return {
    id: rawTweet.id,
    created_at: rawTweet.timeParsed,
    text: rawTweet.text,
    author: {
      id: rawTweet.userId,
      username: rawTweet.username,
      name: rawTweet.name
    },
    stats: {
      likes: rawTweet.likes,
      replies: rawTweet.replies,
      retweets: rawTweet.retweets,
      views: rawTweet.views || 0
    },
    media: [...(rawTweet.photos || []), ...(rawTweet.videos || [])],
    permalink: rawTweet.permanentUrl,
    type: rawTweet.isRetweet ? 'retweet' :
      rawTweet.isQuoted ? 'quoted' :
        rawTweet.isReply ? 'reply' : 'tweet'
  };
};

// Main class for fetching tweets
class TwitterFetcher {
  constructor(accountToFetch, intervalMinutes) {
    this.accountToFetch = accountToFetch;
    this.intervalMinutes = intervalMinutes;
    this.scraper = new Scraper();
    this.isRunning = false;
    this.fetchTimeout = null;
    this.storage = new TweetStorage(accountToFetch);
  }

  // Start the fetcher
  async start() {
    if (this.isRunning) {
      logger.warn(`Already running, monitoring @${this.accountToFetch}`);
      return;
    }

    this.isRunning = true;
    logger.info(`Starting Twitter Fetcher for @${this.accountToFetch}`);
    logger.info(`Fetch interval: ${this.intervalMinutes} minutes`);

    // Load existing tweets from storage
    const loadResult = await this.storage.load();
    if (loadResult.success) {
      if (loadResult.newFile) {
        logger.info(`No existing tweet file found for @${this.accountToFetch}, will create new file`);
      } else {
        logger.info(`Loaded ${loadResult.count} tweets (${loadResult.uniqueIds} unique) for @${this.accountToFetch}`);
      }
    } else {
      logger.error(`Failed to load tweets: ${loadResult.error}`);
    }

    await this.fetchTweets();
    this.scheduleNextFetch();
  }

  // Clean shutdown
  async stop() {
    if (!this.isRunning) {
      logger.warn('Twitter Fetcher is not running');
      return;
    }

    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout);
      this.fetchTimeout = null;
    }

    this.isRunning = false;
    logger.info('Twitter Fetcher stopped');
  }

  // Core method to get tweets
  async fetchTweets() {
    try {
      logger.info(`Fetching tweets for @${this.accountToFetch}...`);

      // Get tweets from the API
      const tweetGenerator = this.scraper.getTweets(this.accountToFetch);
      
      // Collect all tweets
      const rawTweets = [];
      for await (const tweet of tweetGenerator) {
        rawTweets.push(tweet);
      }

      logger.info(`Found ${rawTweets.length} tweets from @${this.accountToFetch}`);

      // Process only if we actually got tweets
      if (rawTweets.length > 0) {
        // Format the tweets
        const formattedTweets = rawTweets.map(tweet => formatTweet(tweet));

        const addResult = this.storage.addTweets(formattedTweets);

        if (addResult.success) {
          logger.info(`Added ${addResult.added} new tweets (total: ${addResult.total})`);

          const saveResult = await this.storage.save();
          if (saveResult.success) {
            logger.info(`Saved ${saveResult.count} tweets to ${saveResult.path}`);
          } else {
            logger.error(`Failed to save tweets: ${saveResult.error}`);
          }

          return addResult.newTweets;
        } else {
          logger.error('Failed to add tweets to storage');
          return [];
        }
      } else {
        logger.info('No tweets found for this account');
        return [];
      }
    } catch (err) {
      logger.error(`Error fetching tweets: ${err.message}`);
      console.error(err);
      return [];
    }
  }

  // Queue up next run
  scheduleNextFetch() {
    if (!this.isRunning) return;

    const intervalMs = this.intervalMinutes * 60 * 1000;

    logger.info(`Next fetch scheduled in ${this.intervalMinutes} minutes`);

    this.fetchTimeout = setTimeout(async () => {
      try {
        await this.fetchTweets();
        this.scheduleNextFetch();
      } catch (err) {
        logger.error(`Error in fetch cycle: ${err.message}`);
        this.scheduleNextFetch();
      }
    }, intervalMs);
  }
}

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.log('Usage: node src/index.js <twitter_account> <interval_minutes>');
      console.log('Example: node src/index.js elonmusk 5');
      process.exit(1);
    }

    const accountToFetch = args[0];
    const intervalMinutes = parseInt(args[1], 10);

    if (isNaN(intervalMinutes) || intervalMinutes <= 0) {
      console.log('Error: interval must be a positive number');
      process.exit(1);
    }

    const fetcher = new TwitterFetcher(accountToFetch, intervalMinutes);
    await fetcher.start();

    logger.info('Twitter Fetcher is running...');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Process interrupted, shutting down...');
      await fetcher.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Process terminated, shutting down...');
      await fetcher.stop();
      process.exit(0);
    });

  } catch (err) {
    logger.error(`Startup error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Start the application
main().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
