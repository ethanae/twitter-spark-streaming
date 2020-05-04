const chalk = require('chalk');
const Twitter = require('twitter');

const [consumerKey, consumerSecret, accessToken, tokenSecret] = process.argv.slice(2);
const hashTags = process.argv.slice(7);
if (!(consumerKey && consumerSecret && accessToken && tokenSecret)) {
  throw new Error('Missing argument: <consumerKey> <consumerSecret> <accessToken> <tokenSecret>');
}

const BYTES_PER_MB = Math.pow(2, 20);

streamTweets(hashTags).then()

async function streamTweets(tags) {
  const tagsString = tags.join(',');
  let totalBytes = 0;
  try {
    const msg = 'Twitter stream started';
    const delimeter = '='.repeat(msg.length);
    console.log(chalk.greenBright(`\n${delimeter}\n${msg}\n${delimeter}`));
    console.log(chalk.greenBright(chalk.yellow(`\nWatching hash tags:\n${tags.map(x => '#' + x).join(' ')}\n`)));

    const client = new Twitter({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
      access_token_key: accessToken,
      access_token_secret: tokenSecret
    });
    const stream = client.stream('statuses/filter', { track: tagsString });

    stream.on('data', async event => {
      const buffer = Buffer.from(JSON.stringify(event));
      totalBytes += buffer.byteLength;
      process.stdout.write(chalk.blueBright(`Data streamed: ${(totalBytes / BYTES_PER_MB).toFixed(2)}MB\r`));
    });
  } catch (err) {
    throw err;
  }
}
