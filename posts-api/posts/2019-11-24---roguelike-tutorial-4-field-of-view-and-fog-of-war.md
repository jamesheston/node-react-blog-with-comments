---
title: Roguelike Tutorial 4 - Field of View and Fog of War
date: 20191124
draft: false
slug: "roguelike-tutorial-4-field-of-view-and-fog-of-war"
category: "Roguelike Tutorials"
tags:
  - "JavaScript"
  - "Roguelike Tutorials"
description: 'In this post, we’ll be implementing a classic (F)ield (of) (View) around the player that prevents them from seeing any level tiles outside of it. We’ll also be adding a memory field to the Tile object so that after a player has explored an area, it will still show up on the map, through the classic "Fog of War."'
---
In the previous post, we hooked a seeded Random Number Generator up to our game engine, and then defined a procedural level generation algorithm so that our player has a different dungeon to explore every time they run the game.

Unfortunately, in it's current state, the entire dungeon is visible as soon as the page loads. This makes exploring it rather boring. Let's fix that! In this post, we'll be implementing a classic (F)ield (of) (View) around the player that limits them from seeing any level tiles outside of it.

We'll also be adding a memory property to the `Tile` object so that after a player has explored an area, it will remain drawn on the map, but greyed out, and no dynamic information such as which enemies are there will show up through the "Fog of War."

## Creating an FOV map with rot.js

How can we represent a player's field of view in our game? 

Simple! It's just a list of the tiles we have determined a player can see. So, the data structure for our fovMap can be as basic as an array like this:
```js
[
  '55,5',
  '54,6',
  '54,7',
  // and so on
]
```

Now for the more difficult question. How do we calculate which tiles make up the player's FOV map? How do tunnels and corners affect the shape of our FOV?

Fortunately for us, rot.js has a module we can use to generate FOV maps with ease. Let's add some functions to do just that.

Create a new file `src/lib/fov.js` with the following code:
```js
import * as ROT from 'rot-js';

let fovMap = [];
let fovComputer;

export const initFovComputer = (level) => {
  const lightPasses = (x, y) => level.tiles[`${x},${y}`] && level.tiles[`${x},${y}`]['blocksSight'] === false;

  fovComputer = new ROT.FOV.PreciseShadowcasting(lightPasses);
};

export const computeFov = (x, y, radius) => {
  fovMap = []; // clear out old fovMap computation
  fovComputer.compute(x, y, radius, function(x, y, r, visibility) {
    fovMap.push(`${x},${y}`);
  });
  return fovMap;
};
```

In rot.js, before you can calculate a FOV with the PreciseShadowcasting algorithm we're going to use, you have to define an "input callback," which, when passed the x and y values for a tile on the level, returns true if a player or npc can see through that tile. In our case, the input callback is the `lightPasses()` arrow function. When we call `initFovComputer()`, we pass the current level data to `lightPasses()`, and then our fovComputer gets instantiated. 

At this point, the only thing in the game which blocks sight are the dungeon wall tiles, so we should only have to initialize the fovComputer once per level, and after `initFovComputer()` is called, we can run `computeFov()` any number of times against the same dungeon floor.

Every time `computeFov()` runs, we get a new fovMap array with a list of updated tiles the player can see from their current position. In practice, this means that `computeFov()` gets called whenever a player is first placed on a level, and then any time they move onto a new tile.

You can view more rot.js FOV information and examples [here](//ondras.github.io/rot.js/manual/#fov) on the official manual page. In addition to the PreciseShadowcasting algorithm we are using, rot.js provides a RecursiveShadowcasting algorithm which provides options like letting you limit the Field of View to 180 degrees or 90 degrees in whatever direction an entity is hypothetically facing, and also determines gradients of visibility for tiles within a FOV depending on their distance to the viewer. Pretty cool!

Now, let's integrate these new FOV functions into our engine to see them in action.

Back in `src/engine/engine.js`, import them at the top of the file.
```js
import {initFovComputer, computeFov} from '../lib/fov';
```

In Engine.constructor(), below the line `this.level.generate(this.player, this.entities);`, add these lines:
```js
    this.fov = {};
    this.fov.radius = 10;
    initFovComputer(this.level);
    this.fov.map = computeFov(this.player.x, this.player.y, this.fov.radius);
    this.fov.needsRecompute = true;
```

Remember how I said the fovMap needs to be calculated whenever the player is initially placed on a level, and then after that, any time the player moves? The 
`this.fov.needsRecompute` variable will keep track of this for us. Let's adjust the `Engine.update()` method to recalculate the fovMap only when necessary.
```js
  update(action = {}) { 
    if( 'PLAYER_MOVE' in action ) {
      const dx = action.PLAYER_MOVE[0];
      const dy = action.PLAYER_MOVE[1];
      const destinationX = this.player.x + dx;
      const destinationY = this.player.y + dy;

      if(! this.level.blocksMoveAt(destinationX, destinationY) ) {
        this.player.move(dx, dy);
        this.fov.needsRecompute = true;
      }
    }

    if( this.fov.needsRecompute ) {
      this.fov.map = computeFov(this.player.x, this.player.y, this.fov.radius);
    }

    renderMap(this.mapDisplay, this.level, this.entities, this.fov.map);
  }
```

## Test the FOV computer in the browser console with a static RNG seed
Since we haven't updated our `renderMap()` function yet, we're obviously not going to see the fovMap updates reflected on the game display. So how can we verify our fov computer is working? Let's take a look at the coordinates for the tiles that are added to our FOV map and see if they make sense. 

First, open up the developer console in your browser. In Chrome, just right-click and choose "Inspect" from the popup menu. Then make sure the "Console" tab is selected.

You should see a line in the console history that reads: `seed: ` and then a very long number. This is the seed our Random Number Generator is using for this session. For our test of the fovMap, let's set the seed to a constant value by going into the `lib/randomUtil.js` file and adding this line after: `let seed = Date.now()`:
```js
  seed = 123;
```
This will ensure that the map which gets generated in your browser is the same one we are referencing in this tutorial. It should look like this:

![fov test with static rng seed map generation](/posts/roguelike-tutorial-4/static-rng-seed-map.jpg)

If your map looks like the one above, and refreshing your browser doesn't generate a different map, that means the seeded RNG we set up in the previous tutorial works! Now, let's turn our attention back to console and testing our fovMap calculations.

In the console, type: `ENGINE.player` and hit return. You'll see the player's starting position on the map, with an x of 74, and a y of 28.

We would expect the player's FOV map to contain the coordinates of their current tile, and any neighboring, non-blocking tiles up to the radius we specified (10).

Typing `ENGINE.fov.map` into the console will confirm this - you should see an array like:
```js
["74,28", "73,29", "73,28", "73,27", "74,27", "75,27" // ... and so on
```

Now click on the map display to focus the app again, and use the keyboard to move the character to a different tile. If you return to the console and type `ENGINE.fov.map` again you should see that the list of tile coordinates has changed. Our FOV computer appears to work! Now let's figure out how to represent this on our map display.

First though, make sure to delete the `seed = 123;` line from `lib/randomUtil.js` since we have finished our test.

## How to not draw what you should not draw

All we need represent our Field of View on the map is to draw dry and tiles outside of it. Update `ui/renderMap.js` to look like this:
```js
export const renderMap = function(mapDisplay, level, entities, fovMap) {
  mapDisplay.clear();

  // Draw tiles
  for( let x = 0; x < level.width; x++ ) {
    for( let y = 0; y < level.height; y++ ) {
      const tile = level.tiles[`${x},${y}`];
      const isVisible = fovMap.indexOf(`${x},${y}`) !== -1;
      if( isVisible ) {
        mapDisplay.draw(x, y, tile.char, tile.color);
      }
    }
  }

  // Draw entities
  for( const entity of entities ) {
    const isVisible = fovMap.indexOf(`${entity.x},${entity.y}`) !== -1;
    if( isVisible ) {
      mapDisplay.draw(entity.x, entity.y, entity.char, entity.color);
    }
  }
};
```

The map should now only show tiles within our player's field of view! Move around the level a bit to see how the player's vision peeks around corners just a little, and opens up as you approach a room from a long corridor. Ondřej Žára did a great job implementing these FOV algorithms in rot.js, and maybe I'm just a huge nerd, but I really enjoyed testing out and observing the effect after I first got it working.

![initial fov on map](/posts/roguelike-tutorial-4/initial-fov-on-map.jpg)

## Adding tile memory and a "Fog of War" effect

Wouldn't it be nice for the map to visually keep track of areas the player has already explored, while still differentiating them from tiles within the Field of View? This can actually be achieved with only a few more lines of code.

In `src/level/tile.js`, add 1 more line at the end of `Tile.constructor()`:
```js
    this.explored = false;
```

Now hop back into `src/ui/renderMap.js` and update it to look like this:
```js
import {colors} from './colors';

const EXPLORED_TILE_COLOR = colors.DARKER_BLUE;

export const renderMap = function(mapDisplay, level, entities, fovMap) {
  mapDisplay.clear();

  // Draw tiles
  for( let x = 0; x < level.width; x++ ) {
    for( let y = 0; y < level.height; y++ ) {
      const tile = level.tiles[`${x},${y}`];
      const isVisible = fovMap.indexOf(`${x},${y}`) !== -1;
      if( isVisible ) {
        mapDisplay.draw(x, y, tile.char, tile.color);
        tile.explored = true;
      } else {
        if( tile.explored ) {
          mapDisplay.draw(x, y, tile.char, EXPLORED_TILE_COLOR);
        }
      }
    }
  }

  // Draw entities
  for( const entity of entities ) {
    const isVisible = fovMap.indexOf(`${entity.x},${entity.y}`) !== -1;
    if( isVisible ) {
      mapDisplay.draw(entity.x, entity.y, entity.char, entity.color);
    }
  }
};
```

![fog of war added](/posts/roguelike-tutorial-4/fog-of-war-added.jpg)

As the player moves around the map, any tiles within their Field of View have their `explored` property set to `true`. Furthermore, any tiles that are outside the FOV but _have_ been explored are rendered, but in a dark blue color, creating the "Fog of War" effect. The only thing I don't like about this solution is that by changing the tile.explored property from inside the renderMap function, we are mixing our engine logic code with our rendering code. It's good enough for now though, and should save us some memory by tackling both operations in the same loop.

That's it for this post. We now have a procedurally generated dungeon that is a bit more fun to explore with Field of View in place, and a visual record of the areas the player has previously explored.

The final code for this post can be found [here](//github.com/jamesheston/es6-javascript-roguelike-tutorial/tree/post04).

You can see a working demo of the final state of this post [here]();

In the [next post]() in this series, we'll be adding enemies to the game, and a turn system for determing whether they or the player gets the next action.