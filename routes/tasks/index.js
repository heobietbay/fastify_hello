'use strict'
const config = require('../../config')

module.exports = async function (fastify, opts) {

  if (config.authenticationRequired) {
    // https://fastify.dev/docs/latest/Reference/Hooks/
    fastify.addHook('onRequest', async (req, reply) => {

      // verify token
      const authHeader = req.headers.authorization;
      req.log.debug(authHeader);

      if (!authHeader) {
        reply.code(401).send("Unauthenticated user")
      }
      return reply;
    })
  }

  fastify.get('/', function (req, reply) {
    const { unassigned } = req.query;
    const isNotAssigned = unassigned === 'true' ? true : false;
    let query = isNotAssigned ? 'SELECT * FROM task Where cur_assignee_id is null' : 'SELECT * FROM task';
    fastify.pg.query(query,
      null,
      function onResult(err, result) {
        if (err) {
          req.log.error(err);
          throw new Error(err.message);
        }
        reply.send(result.rows);
      }
    )
  });

  fastify.get('/:id', async function (req, reply) {
    const taskId = req.params.id;
    const { error, rows } = await fastify.pg.query('SELECT * FROM task where id = $1', [taskId]);
    if (error) {
      reply.code(400).send("Error during retrieving task:  " + taskId);
    } else if (!rows || rows.length === 0) {
      reply.code(404).send("Unknown task:  " + taskId);
    } else {
      reply.send(rows[0]);
    }
  });

  fastify.put('/:id/self-assign', async function (req, reply) {
    const taskId = req.params.id;
    const { error, rows } = await fastify.pg.query('SELECT * FROM task where id = $1 and cur_assignee_id is null', [taskId]);
    if (error) {
      reply.code(400).send("Error during self assigning task:  " + taskId);
    } else if (!rows || rows.length === 0) {
      reply.code(422).send("Not found or already been assigned:  " + taskId);
    } else {
      const { userId } = req.body;
      return fastify.pg.transact(async client => {
        const res = await client.query('Update task set cur_assignee_id = $2, status=\'TODO\' where id = $1  RETURNING id, status',
          [taskId, userId]);
        if (res && res.rows) {
          return res.rows[0];
        }
        throw new Error("Unable to insert new task")
      });
    }
  });

  fastify.put('/:id/progress', async function (req, reply) {
    const taskId = req.params.id;
    const { userId, status, note } = req.body;
    const { error, rows } = await fastify.pg.query('SELECT * FROM task where id = $1 and cur_assignee_id = $2', [taskId, userId]);
    if (error) {
      reply.code(400).send("Error during self progressing task:  " + taskId);
    } else if (!rows || rows.length === 0) {
      reply.code(422).send("Not found:  " + taskId);
    } else {
      return fastify.pg.transact(async client => {
        await client.query('Update task set status=$2 where id = $1', [taskId, status]);
        const { error, rows } = await client
          .query('insert into task_execution_logs(task_id, cur_task_status , note) Values($1, $2, $3) RETURNING task_id, cur_task_status as status',
            [taskId, status, note]);
        if (error) {
          throw new Error(error.message)
        }
        if (!rows || rows.length !== 1) {
          throw new Error("Unexpected error during progressing task.")
        }
        return rows[0];
      });
    }
  });

  // Create
  fastify.post('/', {}, async (request, reply) => {
    const taskDto = request.body;
    // will return a promise, fastify will send the result automatically
    return fastify.pg.transact(async client => {
      const { title, instruction, due_date, status, warehouse, estimation_in_hours } = taskDto;
      // will resolve to an id, or reject with an error
      const id = await client.query('INSERT INTO task(title, instruction, due_date, status, warehouse, estimation_in_hours) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
        [title, instruction, due_date, status, warehouse, estimation_in_hours])
      // potentially do something with id
      if (id && id.rows) {
        return id.rows[0];
      }
      throw new Error("Unable to insert new task")
    })
  })


}
