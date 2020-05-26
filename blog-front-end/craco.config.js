const sassSourcemapsPlugin = require("./craco-plugin-sass-sourcemaps");

module.exports = {
    plugins: [
        { plugin: sassSourcemapsPlugin }
    ]
};