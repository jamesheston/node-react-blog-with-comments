---
title: React, Node, PostgresSQL Comment System Part 1 - Set up PostgresSQL
date: 20200430
draft: false
slug: "react-node-postgressql-comment-system-part-1-set-up-postgres-sql"
category: "Comment System"
tags:
  - "Linux"
  - "PostgresSQL"
description: "In part 1 out of 3 for creating a comment system with React, Node, and PostgresSQL, we'll be setting up PostgresSQL on an Ubuntu server, and defining the schema for our comments system in the database."
---
I'm coding up a comment system to add to my blog, and documenting the process in a series of 3 posts. This is the first post, and focuses on installing and using PostgresSQL on Ubuntu.

Before adding the comment system, my setup is as follows: I have a small node backend that serves up the static build of my create-react-app blog at the root URL of my site. I also have an `/api/posts` endpoint on the server that the react app loads all my posts data from when the user first visits the site. My plan is:

1. Set up a Postgres database to store the comments data.

2. Extend the node backend by adding a `/comments` API endpoint to handle CRUD interactions for (C)reating, (R)eading, (U)pdating, and (D)eleting comments between Postgres and the web.

3. Add some React components that send requests to the new comments API endpoint, and provide a nice UI for displaying comments and adding new ones.

## What is PostgresSQL?
PostgresSQL is a relational database management system. As the name suggests, it uses the SQL query language, which I'm already familiar with and find easy to use. Compared to MySQL, PostgresSQL is considered a bit more modern, with features like table inheritance and functional overloading, and it supports a wider variety of data formats than just JSON. PostgresSQL has been around for while and it's open source and popular, so information is easy to find and the support is good!

## Installing PostgresSQL
Before installing Postgres, you _may_ want to run `sudo apt-get remove postgresql` to ensure you've removed any default installation which already exists. If a previous installation is causing you problems, there is a StackOverflow link at the end of this post in the "Reference Links" with information on completely uninstalling postgres that I found helpful.

Now, install the `postgresql` package.
```sh
sudo apt install postgresql
```

Before you can connect to Postgres through the command line, you need start its service:
```sh
sudo service postgresql start
```

You'll need to run that command every time your Linux machine restarts, or you'll get an `Is the server running?` error when you try to connect with `psql` in the next step. Later, if you need to stop the postgresql service, just use `sudo service postgresql stop`.

## Using `psql`, the PostgresSQL command line interface
`psql` is the command line app for interacting with the PostgresSQL installation on your system. `psql --help` offers useful information, including a list of launch arguments.

By default, it is only set up to allow the "postgres" user to connect, so you have 2 options:

1. From your regular user's terminal connection, you can run just the psql command from a different user by using sudo with the -u flag : `sudo -u postgres psql`
2. You can switch to a different unix system user by running: `su - postgres`. Once you're logged in as the "postgres" user, type `psql` to enter the Postgres command line. 

On my system, there was no password set for the "postgres" user, and I got the error "su: Authentication failure" when I tried to switch users. I was able to fix this by manually setting a password using `sudo passwd postgres`.

After you successfully run `psql`, you should see something like:
```
psql (10.12 (Ubuntu 10.12-0ubuntu0.18.04.1))
Type "help" for help.

postgres=#
```

`psql` commands must be preceded by a backslash (`\`) character, so you'll actually need to type `\help`. And `\help` actually just outputs a giant list of SQL commands, like `CREATE DATABASE`, and `SELECT`.  To view the list of `psql` app commands, type `\?`.

### Useful `psql` commands
* `\?` - list psql commands
* `\help` - list SQL commands
* `\conninfo` - shows connection user, database, and port
* `\l` - list databases
* `\du` - or "defined users", list all roles
* `\dt` - list all tables
* `\c` - connect to database specified in argument
* `\q` - quit psql


## In psql, create a non-super user
Now, take another look at your psql prompt:
```
postgres=#
```

Notice the `#` sign? That indicates you're logged in with super user privileges, which is bad for security reasons. Create a new role, and allow it to create databases.
```
postgres=# CREATE ROLE blog_admin WITH LOGIN PASSWORD 'password';
postgres=# ALTER ROLE blog_admin CREATEDB;
```

Run the command `\du`, and confirm "blog_admin" has been created.

Next, we want to create our database. However, whichever user you're logged in as when you create a new database will own it, so run the `\q` to log out from the "postgres" user sesssion, and log back in as the new user with `sudo psql -d postgres -U blog_admin`. If you get the error `psql: FATAL:  Peer authentication failed for user "blog_admin"`, specify the host: `sudo psql -d postgres -U blog_admin -h localhost`.

When you manage to log in to psql successfully, the prompt should now look like:
```
postgres=>
```
The change from the `#` to the `>` symbol indicates you are no longer logged in as a super user. Additionally, you can confirm you are logged in as "blog_admin" by using the `\conninfo` command.

```
postgres=> \conninfo
You are connected to database "postgres" as user "blog_admin" via socket in "/tmp" at port "5432".
```

### PostgresSQL Roles vs. users vs. groups
Roles in PostgresSQL can be confusing at first. Postgres uses the concept of roles to manage database access permissions. A role can be a user or a group.

A _user_ is a role that has a login right.

A role may be a member of other roles. Any role which contains other roles is know as a _group_.

Also, aside from the "postgres" user, users on your Unix host system don't have anything to do with user roles in your Postgres service. So, a PostgresSQL user doesn't need to have matching user with the same name on the host Unix system in order to login.

## SQL Commands Cheat Sheet
* Create database: `CREATE DATABASE db_name;`
* Delete database: `DROP DATABASE db_name;`
* Create user: `CREATE ROLE user_name WITH LOGIN PASSWORD 'password';`
* Alter user privileges: `ALTER ROLE user_name CREATEDB`;
* Delete user: `DROP ROLE user_name`;
* Create table:
  ```sql
  CREATE TABLE books (
    ID SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
  );
  ```
* Add data row to table:
  ```sql
  INSERT INTO books(title, author)
  VALUES ('Dune', 'Frank Herbert');
  ```
* Edit existing row in a table:
  ```sql
  UPDATE books 
  SET title = 'Dosadi Experiment', author = 'Frank Herbert'
  WHERE ID = 1; 
  ```
* Delete row from a table: `DELETE FROM books WHERE ID = 1`;
* Delete table: `DROP TABLE table_name;`

## Create a database and table to hold comments data

Now, while logged in as `blog_admin`, let's start running some SQL queries. First, create the database.
```
CREATE DATABASE blog;
```

Now connect to the new database.
```
\c blog;
```

Now we'll create a table to hold the data for all the comments made on our blog.
```
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

The above structure defines the following fields for every comment:
* `ID` - just a hash value autogenerated by postgres that uniquely identifies any entry in the comments table
* `name` - name of the poster, supplied by them in the form
* `date` - timestamp autogenerated by postgres when comment is added to the database
* `post` - this will be a post slug like `how-to-steal-and-store-an-ice-sculpted-bear` that can be found in the post url, associates every comment with a particular post
* `text` - whatever delightful message a visitor chooses to leave
* `parent_comment_id` - I won't be using this initially, by later on it will allow a user to create a comment in reply to a previous comment
* `moderated` - to prevent the comments section from devolving into 4chan, or even worse, youtube, comments won't show up on the blog until an admin has set this value to `TRUE`

You can test adding a comment to the table by running the following query:
```
INSERT INTO comments (name, post, text)
VALUES ('Joe Schmoe', 'how-to-make-a-thing', 'What a terrific post. I learned so much');
```

This is the command our node API will run any time a visitor to our blog submits a comment. We'll be covering that in the [next post](), when we add our Node API.

## Reference Links
* [taniarascia.com/add-comments-to-static-site](//www.taniarascia.com/add-comments-to-static-site) - My primary source for implementing comment system. I stole so much from this post of Tania Rascia's.
* [blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8](//blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8) - Another article by Tania Rasci that I "borrowed heavily" from. 
* [medium.com/@harshityadav95/postgresql-in-windows-subsystem-for-linux-wsl-6dc751ac1ff3](//medium.com/@harshityadav95/postgresql-in-windows-subsystem-for-linux-wsl-6dc751ac1ff3) - I'm stuck on Windows, and running Ubuntu under WSL, which apparently has some quirks this post helped me sort out.
* [stackoverflow.com/questions/11874754/eliminating-non-working-postgresql-installations-on-ubuntu-10-04-and-starting-af](//stackoverflow.com/questions/11874754/eliminating-non-working-postgresql-installations-on-ubuntu-10-04-and-starting-af) - This SO post is helpful if you are having trouble completing removing an old installation of Postgres in preperation for another attempt.
* [askubuntu.com/questions/410244/a-command-to-list-all-users-and-how-to-add-delete-modify-users](//askubuntu.com/questions/410244/a-command-to-list-all-users-and-how-to-add-delete-modify-users) - In case you need to create, edit, or delete users on the host Unix system, this SO post provides the shell commands you need.