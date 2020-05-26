const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const args = require('minimist')(process.argv.slice(2));
const app = express();
const posts = require('./posts-api/posts');
const {getComments, getCommentsForPost, createComment, updateComment, deleteComment} = require('./comments-api/requestHandlers');

// Serve posts data requests at '/api/posts'
app.get("/api/posts", (req, res) => {
  res.json(posts);
});

// comments API endpoints
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.get('/comments', getComments)
app.get('/comments/:post', getCommentsForPost)
app.post('/comments', createComment)
app.put('/comments/:id', updateComment)
app.delete('/comments/:id', deleteComment)

// In production, serve static blog build at '/'.
// During development, react-scripts will serve watched build on localhost.
if (! args.dev) {
  app.use('/', express.static('./blog-front-end/build'));
  app.use(/^\/posts\/.*/, express.static('./blog-front-end/build'));
}

// During dev, port is 3001. In production, port is 80 or 8080.
const PORT = (args.dev) ? 3001 : 80; 
app.listen(PORT, () => {
  console.log(`Express server is listening on port ${PORT}`);
});