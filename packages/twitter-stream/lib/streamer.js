const axios = require('axios').default;
const crypto = require('crypto');
const oauthSignature = require('oauth-signature');
const chalk = require('chalk');

const [consumerKey, consumerSecret, accessToken, tokenSecret] = process.argv.slice(2);
const hashTags = process.argv.slice(6).join(',');
if (!(consumerKey && consumerSecret && accessToken && tokenSecret)) {
  throw new Error('Missing argument: <consumerKey> <consumerSecret> <accessToken> <tokenSecret>');
}
const BYTES_PER_MB = +Math.pow(2, 20);

streamTweets(hashTags).then()

async function streamTweets(tags) {
  const url = `https://stream.twitter.com/1.1/statuses/filter.json?track=${tags || ''}`;
  const authorization = createOauthSignature('GET', url, {
    consumerKey,
    consumerSecret,
    accessToken,
    tokenSecret
  });
  let totalBytes = 0;
  const net = require('net');
  const client = new net.Socket();
  client.connect(5555, '127.0.0.1');
  client.on('connect', async () => {
    console.log(chalk.greenBright('Streaming started...'));
    const res = await axios.get(url, {
      responseType: 'stream',
      headers: {
        Authorization: authorization
      }
    });
    res.data.on('data', chunk => {
      totalBytes += chunk.length;
      client.write(chunk);
    });
  });
  client.on('error', (err) => {
    console.log(err)
  });
  setInterval(() => {
    process.stdout.write((chalk.cyan('Total data streamed: ' + (totalBytes / BYTES_PER_MB).toFixed(2) + ' MB \r')));
  }, 1000);
}

function createOauthSignature(method, url, { consumerKey, consumerSecret, accessToken, tokenSecret }) {
  const [baseUrl, query] = url.split('?');
  const queryParams = query.split('&').reduce((acc, q) => {
    const [key, val] = q.split('=');
    acc[key] = val;
    return acc;
  }, {});

  const oauthParameters = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_nonce: crypto.randomBytes(6).toString('hex'),
    oauth_timestamp: Math.floor(new Date().getTime() / 1000),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  };

  const encodedSignature = oauthSignature.generate(method, baseUrl, { ...oauthParameters, ...queryParams }, consumerSecret, tokenSecret);
  const oauthString = Object.keys(oauthParameters)
    .map(k => `${k}=${oauthParameters[k]}`)
    .join(',');
  return `OAuth ${oauthString},oauth_signature=${encodedSignature}`
}