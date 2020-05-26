---
title: React, Node, PostgresSQL Comment System Part 2 - Create Node API
date: 20200430
draft: false
slug: "react-node-postgressql-comment-system-part-2-create-node-api"
category: "Comment System"
tags:
  - "Node"
  - "PostgresSQL"
description: "In part 2 out of 3 for creating a comment system with React, Node, and PostgresSQL, we'll be creating a CRUD API for interacting with a PostgresSQL database via HTTP requests."
---
This is part 2 in a series of 3 posts where I create a comment system to add to my create-react-app blog, using Node to create the CRUD API and PostgresSQL to store comments in a database. Most of the code was lifted from Tania Rascia's [blog post]() covering the same material.

In the [last post](), I installed and configured PostgresSQL on Ubuntu and established the data structure for my comments table. In this post I'll be coding the CRUD API in node for interacting with the postgres database, allowing http requests to (C)reate, (R)ead, (U)pdate, and (D)elete entries in the comments table.

## Create an Express server
In my case, I already had a node server set up with express to serve my posts data to my react blog, but to keep this comments tutorial self-contained, I'm going to cover creating a new node server from scratch.

Go ahead and create a new folder for the blog server to reside in, and initialize an npm project there.
```sh
mkdir blog-with-comments
cd blog-with-comments
npm init -y
```

Now we'll add the Express package, an incredibly popular and easy-to-use web server framework.
```
npm i express
```

You should now see `express` show up under `dependencies` in the `blog-with-comments/package.json` file. Also, in the `package.json` file, you'll see the line: `main:index.js`. This means that there should be a file `blog-with-comments/index.js` that serves as the entry point for your app. Go ahead and create that now, and add this code:

```js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/', (request, response) => {
  response.json({ test: 'GET request at "/" successfully served some JSON.' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}.`)
})
```

The above code describes a web server that listens on port 3000, and sends some test JSON data to anyone that visits the root url (i.e. makes a GET request) of the site. Let's test this basic situation. Run the server by typing `node index.js` in your terminal, then visit the url `localhost:3000` in your web browser. The page should be empty except for the text `{"test":"GET request at root successfully served some JSON."}`. 

Cool, we have confirmed we can respond to HTTP requests by sending data in JSON format. This is the basic functionality our completed API will rely on, except with more methods and data.

As an aside, the `bodyParser` bit is important - it is an Express middleware that automatically translates the HTTP request  and response data from [complicated](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/#request-body) `ReadableStream` `Buffer`s into easy-to-use json objects and plain text.


## Code the Node CRUD API 
Aside from handling HTTP requests to send data between the server and the web browser, the other important part of our node app is facilitating interactions between the server and the PostgresSQL database.

We'll install the the node-postgress (`pg`) package, which makes this a breeze. Run `npm i pg` in the terminal from your project root directory.

Add a folder `comments-api` in your project root directory. The next few files below should be created inside this new folder.

Overall, the app structure will look like:
```
index.js
comments-api/.env
comments-api/connectToDB.js
comments-api/createTable.sql
comments-api/requestHandlers.js
```

### 1. Create `.env` file to store Postgres environment variables
Create a file `.env` in the `comments-api` folder with these contents:
```
DB_USER=blog_admin
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=comments_api
```

The `.env` file is used to hold all the environment variables used to log in to the Postgres service. Only a dummy version of this with placeholder values should be kept under version control, for security reasons, so you'll want to add this file to your .gitignore file after making your first commit with the placeholder values.

### 2. Create `connectToDB.js` file to initialize Postgres client pool
```js
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve( process.cwd() + '/comments-api/.env' ) });

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: isProduction,
});

module.exports = { pool };
```

In the 3rd line of the `connectToDB.js` file, we use the `dotenv` package to add our environment variables to our node process, so make sure to install that package with `npm i dotenv`.

After this, we use initialize a _connection pool_ using our environment variables. A connection pool is a list of authenticated clients, or web visitors, and speeds up our API service by not requiring a client to reauthenticate after their first successful request.

### 3. Add `createTable.sql` file with query that creates the comments table
```sql
CREATE TABLE comments (
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ DEFAULT Now(),
  post VARCHAR(255) NOT NULL,
  text VARCHAR(5000) NOT NULL,
  parent_comment_id INTEGER,
  moderated BOOLEAN DEFAULT FALSE
);
```
This file is just included for reference for anyone perusing the API code, but in production we could use it to automatically set up our database.

### 4. Add `requestHandlers.js` file
```js
const { pool } = require('./connectToDB');

const getComments = (request, response) => {
  pool.query('SELECT * FROM comments ORDER BY date DESC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
};

const getCommentsForPost = (request, response) => {
  const post = request.params.post

  pool.query(
    'SELECT * FROM comments WHERE post = $1 ORDER BY date DESC', 
    [post],
    (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
};

const createComment = (request, response) => {
  const { name, post, text } = request.body
  const parentCommentId = parseInt(request.body.parentCommentId) || null

  pool.query(
    'INSERT INTO comments (name, post, text, parent_comment_id) VALUES ($1, $2, $3, $4)', 
    [name, post, text, parentCommentId], 
    error => {
      if (error) {
        throw error
      }
      response.status(201).json({ status: 'success', message: 'Comment added.' })
  })
};

const updateComment = (request, response) => {
  const { name, post, text } = request.body
  const id = parseInt(request.params.id)
  const parentCommentId = parseInt(request.body.parentCommentId) || null;

  pool.query(
    'UPDATE comments SET name = $1, post = $2, text = $3, parent_comment_id = $4 WHERE id = $5',
    [name, post, text, parentCommentId, id],
    error => {
      if (error) {
        throw error
      }
      response.status(200).json({ status: 'success', message: `Comment modified with ID: ${id}` })
    }
  )
};

const deleteComment = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM comments WHERE id = $1', [id], error => {
    if (error) {
      throw error
    }
    response.status(200).json({ status: 'success', message: `Comment deleted with ID: ${id}` })
  })
};

module.exports = {getComments, getCommentsForPost, createComment, updateComment, deleteComment};
```

### 5. Update `index.js` to connect request handlers to http methods and URLs
```js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {getComments, getCommentsForPost, createComment, updateComment, deleteComment} = require('./comments-api/requestHandlers');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/comments', getComments)
app.get('/comments/:post', getCommentsForPost)
app.post('/comments', createComment)
app.put('/comments/:id', updateComment)
app.delete('/comments/:id', deleteComment)

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
```

Replace the old contents of index.js with the above code which connects the request handlers to their urls and methods, and the API is complete. 

`cors` is a middleware module that lets your front-end code make requests to the API, even when it is on a different port, which is prohibited by default on modern browsers. You'll need to install the cors module by running `npm i cors` in the terminal.

Launch the API by running `node index.js` in your terminal.

## Testing the new API endpoints with curl
Now we want a way to confirm the API endpoints work, but we haven't built the client-side react code that will talk to it yet.

Curl is a command-line tool for transferring data with URLs, making it great for this situation. The following commands can be run in your terminal to test all the API endpoints.

### GET all comments
`curl http://localhost:3002/comments`

### GET all comments for a specific post
`curl http://localhost:3002/comments/some-amazing-blog-post` 

### POST a new comment
`curl -X POST -d "name=Bob&post=some-amazing-blog-post&text=Wow, what a great post."`
or 
`curl -X POST -H "Content-Type: application/json" -d '{"name": "Bob", "post": "some-amazing-blog-post", "text": "Wow what a great post."}' http://localhost:3002/comments`

### PUT an update to an existing comment
A PUT request is used to update an existing resource, and requires the entire body be sent.
`curl -X PUT -d "name=Bob" -d "post=some-amazing-blog-post" -d "text=Hurrah hurrah what a great post." http://localhost:3002/comments/3`
or
`curl -X PUT -H 'Content-Type: application/json' -d '{"name":"Bob" "post":"some-amazing-blog-post"  "text":"Hurrah hurrah what a great post."}' http://localhost:3002/comments/3`

### PATCH an update to an existing comment
A PATCH request is also used to update an existing resource, but doesn't require the entire body.
`curl -X PATCH -d "moderated=true" http://localhost:3002/comments/1`
or
`curl -X PATCH -H "Content-Type: application/json" -d '{"moderated": true}' http://localhost:3002/comments/1`


### DELETE a comment
`curl -X "DELETE" http://localhost:3002/comments/2`

We've now got a tested, working CRUD API for our comments system! That wraps up this post. In the [next post](), we'll add the front-end React code that displays the comments in the browser, and let's visitors submit new comments.

## Reference Links
* [taniarascia.com/add-comments-to-static-site](//www.taniarascia.com/add-comments-to-static-site)
* [blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8/](//blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8/)
* [taniarascia.com/making-api-requests-postman-curl/](//www.taniarascia.com/making-api-requests-postman-curl/)

