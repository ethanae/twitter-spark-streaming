const chalk = require('chalk');
const Twitter = require('twitter');
const { Kafka } = require('kafkajs');

const [consumerKey, consumerSecret, accessToken, tokenSecret] = process.argv.slice(2);
const hashTags = process.argv.slice(7);
if (!(consumerKey && consumerSecret && accessToken && tokenSecret)) {
  throw new Error('Missing argument: <consumerKey> <consumerSecret> <accessToken> <tokenSecret>');
}

const BYTES_PER_MB = Math.pow(2, 20);

streamTweets(hashTags).then();

async function streamTweets(tags) {
  const kafka = new Kafka({
    clientId: 'twitter-stream',
    brokers: ['localhost:9092', 'localhost:9093', 'localhost:9094']
  });
  const kafkaProducer = kafka.producer();
  await kafkaProducer.connect();
  const tagsString = tags.join(',');
  let totalBytes = 0;
  try {
    const msg = 'Tweet stream started';
    const delimiter = '='.repeat(msg.length);
    console.log(chalk.greenBright(`\n${delimiter}\n${msg}\n${delimiter}`));
    console.log(chalk.greenBright(chalk.yellow(`\nWatching hash tags:\n${tags.map(x => '#' + x).join(' ')}\n`)));

    const client = new Twitter({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
      access_token_key: accessToken,
      access_token_secret: tokenSecret
    });
    const stream = client.stream('statuses/filter', { track: tagsString });

    stream.on('data', async event => {
      const stringified = JSON.stringify(event);
      await kafkaProducer.send({
        topic: 'tweets',
        messages: [{ value: stringified }],
      }).catch(err => {
        console.log(chalk.redBright('Error sending message', err));
      });
      const buffer = Buffer.from(stringified);
      totalBytes += buffer.byteLength;
      process.stdout.write(chalk.blueBright(`Data streamed: ${(totalBytes / BYTES_PER_MB).toFixed(2)}MB\r`));
    });
  } catch (err) {
    kafkaProducer.disconnect();
    throw err;
  }
}
