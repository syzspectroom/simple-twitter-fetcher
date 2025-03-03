const fs = require('fs').promises;
const path = require('path');

// Handles saving/loading tweets to files
class TweetStorage {
  constructor(accountName) {
    this.accountName = accountName;
    this.dataDir = path.join(__dirname, '..', 'data');
    this.filePath = path.join(this.dataDir, `${accountName}_tweets.json`);
    this.tweets = [];
    this.tweetIds = new Set();
  }

  // Get tweets from disk
  async load() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });

      // Try to read the file
      try {
        const data = await fs.readFile(this.filePath, 'utf8');
        this.tweets = JSON.parse(data);

        this.tweets.forEach(tweet => {
          if (tweet.id) this.tweetIds.add(tweet.id);
        });

        // Everything loaded OK
        return {
          success: true, 
          count: this.tweets.length,
          uniqueIds: this.tweetIds.size
        };
      } catch (err) {
        // If file doesn't exist, that's fine - we'll create it later
        if (err.code === 'ENOENT') {
          this.tweets = [];
          return {
            success: true,
            count: 0,
            uniqueIds: 0,
            newFile: true
          };
        } else {
          throw err;
        }
      }
    } catch (err) {
      this.tweets = [];
      this.tweetIds = new Set();
      return {
        success: false,
        error: err.message
      };
    }
  }

  // Add tweets and filter out dupes
  addTweets(newTweets) {
    if (!newTweets || newTweets.length === 0) {
      return {
        success: true,
        added: 0,
        newTweets: []
      };
    }

    const actuallyNewTweets = [];

    newTweets.forEach(tweet => {
      // Skip if no ID or already seen
      if (!tweet.id || this.tweetIds.has(tweet.id)) return;

      // Add to our collections
      this.tweets.push(tweet);
      this.tweetIds.add(tweet.id);
      actuallyNewTweets.push(tweet);
    });

    // Sort newest first
    this.tweets.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    return {
      success: true,
      added: actuallyNewTweets.length,
      newTweets: actuallyNewTweets,
      total: this.tweets.length
    };
  }

  // Write to disk
  async save() {
    try {
      // Create directory if needed
      await fs.mkdir(this.dataDir, { recursive: true });

      await fs.writeFile(this.filePath, JSON.stringify(this.tweets, null, 2), 'utf8');
      return {
        success: true,
        count: this.tweets.length,
        path: this.filePath
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  // Simple getters
  getAllTweets() {
    return this.tweets;
  }

  getKnownIds() {
    return this.tweetIds;
  }
}

module.exports = TweetStorage;
