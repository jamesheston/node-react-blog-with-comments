## Run localhost development server:
* In project root: `npm run dev`
* In _blog-front-end_ folder, run: `npm start`

## In production:
First, build the front end. In the _blog-front-end_ directory, run `npm run build`.

Once the front-end is built, run the node server in the background via:
```
node index.js > stdout.txt 2> stderr.txt &
```

## Comments system and Postgres
For comments to work, you need to install and configure Postgres. Then, run `sudo service postgres start`. 