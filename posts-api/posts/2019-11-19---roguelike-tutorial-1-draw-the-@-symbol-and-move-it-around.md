---
title: Roguelike Tutorial 1 - Draw the @ Symbol and Move It Around
date: 20191119
draft: false
slug: "roguelike-tutorial-1-draw-the-@-symbol-and-move-it-around"
category: "Roguelike Tutorials"
tags:
  - "JavaScript"
  - "Roguelike Tutorials"
description: "In the first tutorial in our series for developing a Roguelike in JavaScript, we begin by setting up our development environment, using create-react-app as a foundation, and rot.js as our (Ro)guelike development (T)oolkit. By the end, we'll be rendering the player symbol in <canvas>, and moving it around with the keyboard."
---
This tutorial series is a JavaScript version of the Python & TCOD [tutorials](//rogueliketutorials.com/tutorials/tcod/) on rogueliketutorials.com, which itself was based on the classic [Complete Roguelike Tutorial](//www.roguebasin.com/index.php?title=Complete_Roguelike_Tutorial,_using_python%2Blibtcod) from roguebasin.com.

Instead of tcod, which isn't available for JavaScript, we'll be using the closest available library: [rot.js](//github.com/ondras/rot.js/), the __(Ro)__guelike __(T)__oolkit. Rot.js will greatly reduce the amount of work we have to do by handling tasks like pathfinding and field of view calculations, and providing a `Display` module for drawing text characters _or_ sprites in an xy grid onto the HTML `<canvas>`. 

## Install create-react-app as a project base
First, you'll need node and npm installed on your computer. If you don't have them, you can find the best installation instructions for your operating system on the [official nodejs download page](//nodejs.org/en/download/). Npm, the node package manager, is usually included with node installations.

Once you have node and npm installed on your machine, start a new react project with create-react-app by running this command in your terminal:
```sh
npx create-react-app es6-javascript-roguelike-tutorial
```

You'll now have a modern web app project base set up for you in the `es6-javascript-roguelike-tutorial` folder. While we aren't going to be using a lot of React code in this series, create-react-app provides a great environment for developing ES6 JavaScript apps, without requiring us to spend a lot of time on configuration, as you'll soon see.

Once create-react-app finishes installing, run the following commands in your terminal to verify the starter kit works:
```sh
# move into the project root directory
cd es6-javascript-roguelike-tutorial
# run the web app
npm start
```

In the root folder of a create-react-app project, running `npm start` will open your web browser to the url `localhost:3000` and display your web app on that page. It may take a few seconds to launch, but after it does, any changes you make to your codebase by saving a file will automatically be updated in the browser. (C)reate (R)eact (A)pp also has great error-reporting, including a stack trace, if an update you make contains a bug that breaks compilation.

If you want to stop running your web app at any time, simply type _CTRL + C_ in your terminal.

Once your browser finishes loading and runs the app, you should see the default CRA splash page.

![create-react-app splash screen](/posts/roguelike-tutorial-1/create-react-app_splash.jpg)

Great! Now that we've verified our create-react-app project base is properly installed and running, go ahead and delete all the files inside the `es6-javascript-roguelike-tutorial/src` directory. We won't be needing them. 

## Use rot.js's `Display` module to render the map in an HTML &lt;canvas&gt;
So, let's get started on the first main goal in this post: drawing the `@` symbol the game map.

The de facto rendering engine for HTML games is the &lt;canvas&gt; element. Rot.js's `Display` module provides an easy to use API for rendering roguelike games that uses the &lt;canvas&gt; element without requiring us to interact with the native canvas API directly. If you're familiar with the popular roguelike development library `tcod`, you can think of `Display` as the equivalent of a console in tcod - it is the API to which we pass colored text characters, each with a position assigned by x and y coordinate values, that represent all the floors, walls, items, heroes, and monsters which make up our game world.

Add the rot.js library to our project. In your terminal, run:
```sh
npm install rot-js
```

After rot-js is installed, you should see it has been added to the list of dependencies in your `package.json` file.

Now, create a blank `index.js` file in the src directory. This is the root file of our project that create-react-app expects. Add the following code:
```js
import * as ROT from 'rot-js';

// We'll need to use variables like MAP_WIDTH and MAP_HEIGHT across various parts 
// of our codebase as this project progresses, so let's go ahead and create a
// "constants" object that can be easily put in its own file later.
const constants = {
  MAP_WIDTH: 80,
  MAP_HEIGHT: 45,
};

class Engine {
  constructor() {
    // Create a rot.js canvas interface which we'll be using to render our 
    // roguelike dungeon map. Set it as a property of the main Engine object so we 
    // can access this Display instance from other methods.
    this.mapDisplay = new ROT.Display({
      width: constants.MAP_WIDTH,
      height: constants.MAP_HEIGHT,
    });
    // getContainer() returns the canvas element. We then need to use 
    // appendChild() to insert the canvas into the web page "document" or our map 
    // will not be displayed. 
    document.querySelector('#root').appendChild(this.mapDisplay.getContainer());

    // Print a test message in the upper-left corner of the display.
    this.mapDisplay.drawText(0, 0, "Greetings earthling.");
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const engine = new Engine();
  // Attach the engine instance to the window object for console debugging.
  window.ENGINE = engine;
});
```
In your browser, you should now see the display's <canvas> element show up as large black rectangle with "Greetings earthling" printed on it. 
 
Note that in the native canvas API, and in rot.js's Display module, a y value of 0 places something at the top of the render window, while higher values indicate a lower position on the vertical axis. In other words, the y plane values on canvas are inverted compared to the normal coordinate plane you probably used in math class. This is, however, conventional for graphics programming.

![rot.js Display test](/posts/roguelike-tutorial-1/rot-js-display-test.jpg)

## Add and configure a monospaced font
A monospaced font is a font whose glyphs all take up the same amount of horizontal space. This makes monospaced fonts great for drawing roguelikes! We're going to use [Metrickal](https://github.com/robey/metrickal-typeface), a geometric monospaced font optimized for retina displays that Ondřej Žára, the author of rot.js, uses a lot.

First, [download](https://github.com/robey/metrickal-typeface/blob/master/downloads/Metrickal-Regular.otf) the Metrickal-Regular.otf file and put it in the `src` directory.

Then, create a new `app.css` file in the `src` directory, and add the following contents:

```css
@font-face {
  font-family: Metrickal;
  src: url(./Metrickal-Regular.otf);
}
* {
  box-sizing: border-box;
}
body {
  line-height: 1.2;
  margin: 0;
  font-family: Metrickal, monospace;
}
```
The @font-face declaration imports the Metrickal font file, and associates it with the `font-family` value `Metrickal`. Then, within our `body` styles, we set it as the default font for all the html elements on our web page.

Add the line `import './app.css';` at the top of `index.js` to include these style rules in the project.

You'll probably notice the "Greetings earthling" font hasn't changed. This is because we also need to set Metrickal as the rendering font for our rot.js `Display`, separately from our CSS and HTML. We can do this by specifying the `fontFamily` property in the options object it gets passed when it's created. Update `Engine.constructor()` in `index.js` to initialize the `mapDisplay` like this:

```js
    this.mapDisplay = new ROT.Display({
      width: constants.MAP_WIDTH,
      height: constants.MAP_HEIGHT,
      fontFamily: 'metrickal, monospace',
    }); 
```

Now, there is one final problem you may notice if you refresh the page a few times. Sometimes the display renders the "Greetings earthling" message using the default system font instead of Metrickal. This is because &lt;canvas&gt; images don't automatically rerender after fonts are loaded. This might not seem like a big deal at the moment, but it looks really janky when your entire game map is drawn using the wrong font on the first pass, and then changes after the player moves.

To fix this, we'll use the Web Font Loader package from typekit. This let's us run a callback function _after_ a specified font finishes loading. So we'll instantiate our Engine in this callback. Add the library to your project by running this command in your terminal:
```
npm install webfontloader
```

Add this line at the top of `index.js`:
```js
import WebFont from 'webfontloader';
```

Finally, at the bottom of `index.js` replace these lines:
```js
window.addEventListener('DOMContentLoaded', () => {
  const engine = new Engine();
  // Attach the engine instance to the window object for console debugging.
  window.ENGINE = engine;
});
```
with these lines:
```js
WebFont.load({
  custom: {
    families: ['Metrickal'],
  },
  // runs after specified font has finished loading
  active: function() {
    const engine = new Engine();
    window.ENGINE = engine;  
  },
});
```

Awesome, now we have a custom font that is used by the &lt;canvas&gt; map and our regular HTML content, and we don't have to worry about the map rendering before the font file loads.

## Draw player/`@` symbol and move it around 
OK, we've finally got the map display properly set up, so let's take the first step in programming a roguelike: drawing the player symbol onto the map and moving it around.

Update your index.js file to match the code below:
```js
import * as ROT from 'rot-js';
import {addInputListeners} from './addInputListeners';
import WebFont from 'webfontloader';
import './app.css';

const constants = {
  MAP_WIDTH: 80,
  MAP_HEIGHT: 45,
};

class Engine {
  constructor() {
    this.mapDisplay = new ROT.Display({
      width: constants.MAP_WIDTH,
      height: constants.MAP_HEIGHT,
      fontFamily: 'metrickal, monospace',
    });
    document.querySelector('#root').appendChild(this.mapDisplay.getContainer());

    // Initially, place player in the center of the map.
    this.playerX = constants.MAP_WIDTH / 2 - 1;
    this.playerY = Math.floor(constants.MAP_HEIGHT / 2) - 1;

    // Use bind to pass _this_ Engine instance to the addInputListener() method 
    // defined in a separate file, so it can make calls to Engine.update().
    this.addInputListeners = addInputListeners.bind(this);
    this.addInputListeners();

    this.update();
  }

  update(action = {}) { 
    // Notice that in the update parameters above, we define the default action 
    // as an empty object so that we can check if a key such as 'PLAYER_MOVE' 
    // exists without worrying about throwing an error when it doesn't, like
    // in our constructor's call to update(), where no action was passed.
    
    if( 'PLAYER_MOVE' in action ) {
      const dx = action.PLAYER_MOVE[0];
      const dy = action.PLAYER_MOVE[1];

      this.playerX += dx;
      this.playerY += dy;
    }

    // Before redrawing the '@' symbol at its new position, we need to clear the
    // display, or the drawings of the player at previous positions will remain,
    // resulting in a bunch of undesired '@'s cluttering our map.
    this.mapDisplay.clear();
    this.mapDisplay.draw(this.playerX, this.playerY, '@');
  }
}

WebFont.load({
  custom: {
    families: ['Metrickal'],
  },
  active: function() {
    const engine = new Engine();
    window.ENGINE = engine;  
  },
});
```

For now, the only variables we need to represent the player in the game are integer values for x and y to track their position on the map, so we've added `playerX` and `playerY` properties to the Engine. These values should be adjusted when the player presses directional keys, so we're going to capture these keypresses in the `addInputListeners` function, which are defined in a separate file.

Create the `addInputListeners.js` file in the `src` directory, and add this code:

```js
export const addInputListeners = function() {
  // Catch any keyboard input, and pass whatever key was pressed to our 
  // handleKeyDown function. If the key code passed matches any movement keys, 
  // handleKeyDown() will return an action object with movement data. We then 
  // pass the PLAYER_MOVE action to Engine.update(), which will adjust the 
  // player's x and y position, and redraw the map to reflect the update.
  window.addEventListener('keydown', event => {
    const action = handleKeyDown(event.code);
    if( action ) {
      this.update(action);
    }
  });
}

function handleKeyDown(code) {
  // 'directions' is a list of arrays, with each array representing a movement 
  // in a cardinal direction as a change in x and y values. The movements are 
  // listed starting from northwest, clockwise to finish at west.
  // For example, if you recall that in <canvas>, the higher the y value is, 
  // the lower down something will be rendered, we can see that the third 
  // direction listed, [1, -1] represents a movement northeast, since the x 
  // value is increased by 1 (to the right), and the y value is decreased by 1 
  // (going up). So if a player was in the middle of the map, with an x and y
  // of 39, 21, pressing Numpad9 would move them northeast to 40, 20.
  const directions = [ [-1,-1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0] ];

  // Below, you'll notice that vim, numPad, and arrows are a list of keydown 
  // codes whose entries' index positions correspond to appropriate move in the 
  // 'directions' array. 
  const vim = [ 'KeyY', 'KeyK', 'KeyU', 'KeyL', 'KeyN', 'KeyJ', 'KeyB', 'KeyH' ];
  const numPad = [ 'Numpad7', 'Numpad8', 'Numpad9', 'Numpad6', 'Numpad3', 'Numpad2', 'Numpad1', 'Numpad4' ];
  const arrows = [ null, 'ArrowUp', null, 'ArrowRight', null, 'ArrowDown', null, 'ArrowLeft' ];

  if( numPad.indexOf(code) !== -1 ) {
    const direction = directions[ numPad.indexOf(code) ];
    return { PLAYER_MOVE: direction };

  } else if( arrows.indexOf(code) !== -1 ) {
    const direction = directions[ arrows.indexOf(code) ];
    return { PLAYER_MOVE: direction };
  
  } else if(  vim.indexOf(code) !== -1  ) {
    const direction = directions[ vim.indexOf(code) ];
    return { PLAYER_MOVE: direction };
  
  } else {
    // By returning false here, we ensure that no call to Engine.update() is 
    // made from our 'keydown' listener at the top of this file unless it 
    // matches one of our specified keys.
    return false;
  }
}
```

Now, the @ symbol should respond to numpad keys, hjklyubn keys, and arrow keys to move around the display. Congratulations, you have finished the first step of developing a roguelike game on the web! 

![Draw the @ symbol and move it around screenshot](/posts/roguelike-tutorial-1/draw-the-@-symbol.jpg)

You can view or download the final code for this post [here](//github.com/jamesheston/es6-javascript-roguelike-tutorial).

You can play around with a working demo of the final code for this post [here](/demos/rl-tuts-01).

In the [next post](/posts/roguelike-tutorial-2-the-entity-and-level-classes-and-drawing-the-map) of this tutorial series, we'll write an `Entity` class to create the Player and NPCs with. We'll also write a dungeon `Level` class to define the details of our environment, and expand our map rendering code to display those details. 