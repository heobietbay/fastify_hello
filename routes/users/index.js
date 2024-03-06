'use strict'

module.exports = async function (fastify, opts) {

  fastify.get('/', async function (req, reply) {
    const { firebase_id } = req.query;
    if(firebase_id !== undefined) {
      const { rows } = await fastify.pg.query('SELECT * FROM users Where coalesce($1, firebase_id) = firebase_id', [firebase_id]);    
      reply.send(rows);
    } else {
      const { rows } = await fastify.pg.query('SELECT * FROM users', []);    
      reply.send(rows);
    }
  });

  fastify.get('/:id', function (req, reply) {
    const userId = req.params.id;
    fastify.pg.query(
      'SELECT * FROM users WHERE id=$1', [userId],
      function onResult(err, result) {
        if (err) {
          req.log.error(err);
          throw new Error(err.message || "Error during query database.");
        }
        const item = result.rowCount === 1 ? result.rows[0] : undefined;
        reply.code(item ? 200 : 404)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send(item);
      }
    )
  });

  fastify.get('/:id/tasks', async function (req, reply) {
    const userId = req.params.id;
    const { error, rows } = await fastify.pg.query('SELECT * FROM task where cur_assignee_id = $1', [userId]);    
    if(error) {
      reply.code(400).send(error.message);
    } else {
      reply.send(rows);
    }
  });
}
