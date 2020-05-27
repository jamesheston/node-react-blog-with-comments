const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const args = require('minimist')(process.argv.slice(2));
const app = express();
const {getComments, getCommentsForPost, createComment, updateComment, deleteComment} = require('./comments-api/requestHandlers');

// comments API endpoints
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.get('/comments', getComments);
app.get('/comments/:post', getCommentsForPost);
app.post('/comments', createComment);
app.put('/comments/:id', updateComment);
app.delete('/comments/:id', deleteComment);

// During dev, port is 3001. In production, port is 80 or 8080.
const PORT = (args.dev) ? 3001 : 80; 
app.listen(PORT, () => {
  console.log(`Express server is listening on port ${PORT}`);
});