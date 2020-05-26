const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

let posts = [];

class Post {
  /**
   * 
   * @param {string} yamlMeta 
   * @param {string} content 
   */
  constructor(meta, body) {
    this.title = meta.title;
    this.date = meta.date;
    this.draft = meta.draft;
    this.slug = meta.slug;
    this.category = meta.category;
    this.tags = meta.tags;
    this.description = meta.description;
    this.body = meta.body;
  }
}

// For every file in the posts directory, create a post object to be
// consumed by the react app.
const directoryPath = path.join(__dirname, 'posts');
fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }
  files.forEach(function (filename) {
    let post = {};
    const fileText = fs.readFileSync(directoryPath + '/' + filename).toString();
    // Use regex to split each file's text into 2 sections;
    // 1. commented out YAML portion with post meta information
    // 2. post body markdown
    const matches = fileText.match(/---([\s\S]*)---([\s\S]*)/m);
    const yamlMeta = matches[1];
    const mdBody = matches[2];
    const meta = yaml.safeLoad(yamlMeta);
    post = {...meta, body: mdBody};
    posts.push(post);
  });
});

module.exports = posts;