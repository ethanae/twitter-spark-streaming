async function routes(fastify, options) {
  const database = fastify.mongo.db('twitter-data');

  fastify.get('/api/analytics/words/frequencies', async (req, reply) => {
    const seenWords = database.collection('seenWords');
    const result = await seenWords
      .find({ $expr: { $gt: [{ $strLenCP: '$word' }, 3] } })
      .sort({ frequency: -1 })
      .limit(10)
      .toArray();
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });

  fastify.get('/api/analytics/words/offensive/count', async (req, reply) => {
    const offensiveWords = database.collection('offensiveWords');
    const result = await offensiveWords.find().count();
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });

  fastify.get('/api/analytics/words/offensive', async (req, reply) => {
    const offensiveWords = database.collection('offensiveWords');
    const result = await offensiveWords.aggregate([
      {
        $match: { $expr: { $gt: [{ $strLenCP: '$value' }, 2] } }
      },
      {
        "$group": {
          _id: "$value",
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ]).limit(10).toArray();
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });

  fastify.get('/api/analytics/words/misspelled/count', async (req, reply) => {
    const offensiveWords = database.collection('spellingCorrections');
    const result = await offensiveWords.find().count();
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });

  fastify.get('/api/analytics/words/misspelled', async (req, reply) => {
    const offensiveWords = database.collection('spellingCorrections');
    const result = await offensiveWords.aggregate([
      {
        $match: {
          $and: [
            {
              $expr: { $gt: [{ $strLenCP: '$original' }, 3] }
            }
          ]
        }
      },
      {
        "$group": {
          _id: { original: "$original" },
          count: {
            $sum: 1
          }
        },
      },
      {
        $sort: {
          count: -1
        }
      }
    ]).limit(10).toArray();
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });

  fastify.get('/api/analytics/words/corrections', async (req, reply) => {
    const spellingCorrections = database.collection('spellingCorrections');
    const words = req.query.words.split(',');
    const result = await spellingCorrections.aggregate([
      {
        $match: {
          original: { $in: words }
        }
      },
      {
        "$group": {
          _id: "$original",
          corrections: {
            $addToSet: "$$ROOT.correction"
          }
        }
      }
    ]).toArray();
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });

  fastify.get('/api/analytics/words/count', async (req, reply) => {
    const seenWords = database.collection('seenWords');
    const [result] = await seenWords.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$frequency"
          }
        }
      }
    ]).toArray();
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });

  fastify.get('/api/analytics/tweet/locations', async (req, reply) => {
    const tweets = database.collection('tweets');
    const result = await tweets
      .aggregate([
        {
          $match: { $and: [{ 'user.location': { $ne: null } }, { 'user.location': { $ne: '' } }] }
        },
        {
          $group: {
            _id: '$user.location',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
      .limit(15)
      .toArray();

    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });

  fastify.get('/api/analytics/tweet/count', async (req, reply) => {
    const tweets = database.collection('tweets');
    const result = await tweets.find().count();

    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Access-Control-Allow-Origin', '*')
      .send(result)
  });
}

module.exports = routes;