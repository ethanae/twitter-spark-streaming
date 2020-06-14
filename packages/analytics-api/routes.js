async function routes(fastify, options) {
  const database = fastify.mongo.db('twitter-data');

  fastify.get('/api/analytics/words/frequencies', async () => {
    const seenWords = database.collection('seenWords');
    const result = await seenWords.find().toArray();
    return result;
  });

  fastify.get('/api/analytics/words/offensive', async () => {
    const offensiveWords = database.collection('offensiveWords');
    const result = await offensiveWords.aggregate([
      {
        "$group": {
          _id: "$value",
          count: {
            $sum: 1
          }
        }
      }
    ]).toArray();
    return result;
  });

  fastify.get('/api/analytics/words/misspelled', async () => {
    const offensiveWords = database.collection('spellingCorrections');
    const result = await offensiveWords.aggregate([
      {
        "$group": {
          _id: { original: "$original" },
          count: {
            $sum: 1
          }
        }
      }
    ]).toArray();
    return result;
  });
  fastify.get('/api/analytics/words/corrections', async () => {
    const offensiveWords = database.collection('spellingCorrections');
    const result = await offensiveWords.aggregate([
      {
        "$group": {
          _id: "$original",
          corrections: {
            $addToSet: "$$ROOT.correction"
          }
        }
      }
    ]).toArray();
    return result;
  });

  fastify.get('/api/analytics/words/count', async () => {
    const seenWords = database.collection('seenWords');
    const result = await seenWords.find().count();
    return result;
  });

  fastify.get('/api/analytics/tweets/times', async () => {
    const tweets = database.collection('tweets');
    const result = await tweets
      .find({})
      .project({ created_at: 1, 'user.location': 1 })
      .toArray();
    return result;
  });
}

module.exports = routes;