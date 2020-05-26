const { pool } = require('./connectToDB');

const getComments = (request, response) => {
  pool.query('SELECT * FROM comments ORDER BY date DESC', (error, results) => {
    if (error) {
      response.json({ error: 'Could not retrieve comments at this time. Please try again later.' });
      return console.error(error.stack);
    }
    response.status(200).json(results.rows);
  });
};

const getCommentsForPost = (request, response) => {
  const post = request.params.post;

  pool.query(
    'SELECT * FROM comments WHERE post = $1 ORDER BY date DESC', 
    [post],
    (error, results) => {
    if (error) {
      response.json({ error: 'Could not retrieve comments at this time. Please try again later.' });
      return console.error(error.stack);
    }
    response.status(200).json(results.rows);
  });
};

const createComment = (request, response) => {
  const { name, post, text } = request.body;
  const parentCommentId = parseInt(request.body.parentCommentId) || null;

  pool.query(
    'INSERT INTO comments (name, post, text, parent_comment_id) VALUES ($1, $2, $3, $4)', 
    [name, post, text, parentCommentId], 
    error => {
      if (error) {
        response.json({ error: `The server couldn't process your submission at this time. Please try again later.`});
        return console.error(error.stack);
      }
      response.status(201).json({ status: 'success', message: 'Comment added.' });
    }
  );
};

const updateComment = (request, response) => {
  const { name, post, text } = request.body;
  const id = parseInt(request.params.id);
  const parentCommentId = parseInt(request.body.parentCommentId) || null;
  let moderated = request.body.moderated;
  if (moderated === 'true' || moderated === true) {
    moderated = true;
  } else {
    moderated = false;
  }

  pool.query(
    'UPDATE comments SET name = $1, post = $2, text = $3, parent_comment_id = $4, moderated = $5 WHERE id = $6',
    [name, post, text, parentCommentId, moderated, id],
    error => {
      if (error) {
        response.json({ error: `The server couldn't process your request at this time. Please try again later.`});
        return console.error(error.stack);
      }
      response.status(200).json({ status: 'success', message: `Comment modified with ID: ${id}` });
    }
  );
};

const deleteComment = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query('DELETE FROM comments WHERE id = $1', [id], error => {
    if (error) {
      response.json({ error: `The server couldn't process your request at this time. Please try again later.`});
      return console.error(error.stack);
    }
    response.status(200).json({ status: 'success', message: `Comment deleted with ID: ${id}` });
  });
};

module.exports = {getComments, getCommentsForPost, createComment, updateComment, deleteComment};