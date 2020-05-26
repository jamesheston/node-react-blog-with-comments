CREATE TABLE comments (
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ DEFAULT Now(),
  post VARCHAR(255) NOT NULL,
  text VARCHAR(5000) NOT NULL,
  parent_comment_id INTEGER,
  moderated BOOLEAN DEFAULT FALSE
);

INSERT INTO
  comments (name, text, post, parent_comment_id)
VALUES
  ('Joe Schmoe', 'What a terrific post. I learned so much', 'how-to-make-a-thing', null);