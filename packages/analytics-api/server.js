const fastify = require('fastify')({
  logger: true
})

fastify.register(require('./db'), {
  url: 'mongodb://localhost:27017/'
});

fastify.register(require('./routes'))

const start = async () => {
  try { 
    await fastify.listen(7896);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();