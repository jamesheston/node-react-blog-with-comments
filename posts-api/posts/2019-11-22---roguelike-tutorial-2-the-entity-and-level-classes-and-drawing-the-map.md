---
title: Roguelike Tutorial 2 - The Entity and Level Classes, and Drawing the Map
date: 20191122
draft: false
slug: "roguelike-tutorial-2-the-entity-and-level-classes-and-drawing-the-map"
category: "Roguelike Tutorials"
tags:
  - "JavaScript"
  - "Roguelike Tutorials"
description: "In this post, we will add a proper Entity class to create the player and NPCs with. We'll also add a Level class that creates and stores data about the current game level and its tiles."
---

In the [previous post](/posts/roguelike-tutorial-1-draw-the-@-symbol-and-move-it-around), we set up rot.js in a new create-react-app project, configured a custom font, and rendered the player's "@" symbol on an otherwise empty canvas. We also got the player symbol to move around in response to keyboard input.

In this post, we will write up a proper Entity class to create the player and NPCs with. We'll also add a Level class that creates and stores data about the current game level and its tiles.  

Then, we'll update the engine to prevent the player from moving through blocking tiles like dungeon walls. We'll also create a `renderMap` function that redraws the level's environmental tiles and entities as the state of the game changes.

## But first, some housekeeping...

But before we get into any of that, let's refactor our project a bit to establish a good file and directory structure that will help our codebase stay organized and manageable as the project grows.

If the refactoring seems a bit tedious or you get stuck, you can just checkout or clone [this commit](//bitbucket.com/jamesheston/es6-javascript-roguelike-tutorial/tree/e658ed92a708f2a53e5bf49ef932bba14f0bec82) and then skip ahead to _"The Entity Class"_ section below. 

1. Create a `lib` folder inside the `src` folder. This will hold our utility files and any other supplementary bits of code that don't quite fit anywhere else as our project grows.

2. Our `constants` object variable in `index.js` will be soon be referenced in various places throughout the project, so let's create a new file `src/lib/constants.js` and move the constants code there:
  ```js
  export const constants = {
    MAP_WIDTH: 80,
    MAP_HEIGHT: 45,
  };
  ```

3. Create a `ui` folder inside the `src` directory that will hold our code related to displaying the game and capturing user input. Move `addInputListeners.js` into this folder.

4. Move `app.css` into the `ui` directory, and update its import path at the top of `src/index.js`. Move the Metrickal-Regular.otf font file into the ui folder too.

5. Let's treat `src/index.js` as merely a mount point for our app. Create a new `engine` folder in the `src` directory, and a new file `src/engine/engine.js`, and then move the Engine class code into it.

After moving around all the files above, you will of course have to update all the relevant import paths at the top of each file. 

`src/index.js` should now look like this:
```js
import Engine from './engine/engine';
import WebFont from 'webfontloader';
import './ui/app.css';

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

`src/engine/engine.js` should look like this:
```js
import * as ROT from 'rot-js';
import {addInputListeners} from '../ui/addInputListeners';
import {constants} from '../lib/constants';

export default class Engine {
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

    this.addInputListeners = addInputListeners.bind(this);
    this.addInputListeners();

    this.update();
  }

  update(action = {}) { 
    if( 'PLAYER_MOVE' in action ) {
      const dx = action.PLAYER_MOVE[0];
      const dy = action.PLAYER_MOVE[1];

      this.playerX += dx;
      this.playerY += dy;
    }

    this.mapDisplay.clear();
    this.mapDisplay.draw(this.playerX, this.playerY, '@');
  }
}
```

Also, as we start drawing the different entities and map tiles in this tutorial, we're going to start using more and more colors. Instead of using hex values like `#FFFF00`, wouldn't it be nicer to just say `colors.YELLOW`? I went ahead and grabbed all the colors listed in the [tcod documentation](//roguecentral.org/doryen/data/libtcod/doc/1.5.1/html2/color.html) and set them up in a JSON file for this project. Grab the code [here]() and paste it into a new file `src/ui/colors.js`. 

That's enough housekeeping for now, let's get to Entity programming!

## The `Entity` class

If you've looked into design patterns for roguelike game programming, you've probably heard of the _Entity, Component, System_ approach. It's used by almost everyone, including Thomas Biskup of ADOM, Brian Bucklew of Caves of Qud, and Bob Nystrom, the author of [_Game Programming Patterns_](//gameprogrammingpatterns.com), [Hauberk](//github.com/munificent/hauberk), and [Amaranth](//github.com/munificent/amaranth). The Entity is a generic class used to represent almost any _thing_ in the game, whether it's the player, a monster, or items. 

Let's create our own Entity class now. To represent something in a roguelike, we'll need a character symbol and color to draw it, an x and y coordinate to place it on the level, and a name so we can reference it in our code and talk about it in messages to the player.

If the entity is an actor, like a Player, NPC, or monster (as opposed to an inanimate item), we'll need to move it around the level, so let's make sure to add a move method to our Entity class definition.

Create a new `entity` folder in the `src` directory, and add a new file `src/entity/entity.js` with the following code:
```js
export default class Entity {
  constructor(name, x, y, char, color) {
    this.name = name;
    this.x = x;
    this.y = y;
    // char is the symbol drawn to represent this entity, like "@" for the Player 
    this.char = char; 
    this.color = color;
  }

  move(dx, dy) {
    // Adjust entity x and y position by adding passed values to current values
    this.x += dx;
    this.y += dy;
  }
}
```

Now let's update engine.js to use our Entity class to create the player, and a new NPC too.

Import the new Entity class at the top of engine.js. Import the new colors file too.
```js
import Entity from '../entity/entity';
import {colors} from '../ui/colors';
```

Change the Engine.constructor() method to use the Entity class to create the player and an NPC.
```js
    // Initially, place player in the center of the map.
    const playerX = Math.floor(constants.MAP_WIDTH / 2) - 1;
    const playerY = Math.floor(constants.MAP_HEIGHT / 2) - 1;    
    this.player = new Entity('Player', playerX, playerY, '@', colors.WHITE);
    // Create a yellow NPC with a position 5 tiles left of the player.   
    const npc = new Entity('NPC', playerX - 5, playerY, '@', colors.YELLOW);
    this.entities = [this.player, npc];
```

Now update Engine.update() to reference the new player entity's properties when it renders them.
```js
    if( 'PLAYER_MOVE' in action ) {
      const dx = action.PLAYER_MOVE[0];
      const dy = action.PLAYER_MOVE[1];
      const destinationX = this.player.x + dx;
      const destinationY = this.player.y + dy;

      this.player.move(dx, dy);
    }

    this.mapDisplay.clear();
    this.mapDisplay.draw( this.player.x, this.player.y, this.player.char, this.player.color );
```

If you run the code in your browser now, the player symbol should still be drawn onto the display and update its position in response to keyboard input. However, the new NPC entity isn't being rendered. Before we add the code to draw the NPC as well, let's go ahead and create a new function `renderMap` in it's own file `src/ui/renderMap.js`. 

For now, it should look like this:

```js
export const renderMap = function(mapDisplay, entities) {
  mapDisplay.clear();
  
  // Draw all entities
  for( const entity of entities ) {
    mapDisplay.draw(entity.x, entity.y, entity.char, entity.color);
  }
};
```

In `engine.js`, make sure to `import {renderMap} from '../ui/renderMap';` at the top, and replace the 2 `this.mapDisplay...` lines with this:
```js
    renderMap(this.mapDisplay, this.entities);
```

If you check the browser, both the white player entity and the yellow NPC entity should be drawn on the map. 

![Drawing the entities](/posts/roguelike-tutorial-2/drawing-the-entities-2.jpg)

Now that we've got the beginnings of an Entity system working, let's start fleshing out the environment they'll be inhabiting.

## Building the dungeon `Level`
The environment in our game will be structured like many classic roguelikes, where you proceed through different levels or floors of a dungeon. 

The structure for each dungeon level will actually be pretty simple. Since going up or down on the z-axis means going to a different dungeon floor/game level, we only have to worry about 2 dimensions. So, a `Level`'s basic structure is just a list of tiles associated with an x and y position. Easy!

Let's define the `Tile` class which will create the building blocks that each level is made of. Create a new file in a new folder `src/level/tile.js` and add this code:
```js
import {colors} from '../ui/colors';

export default class Tile {
  constructor(props) {
    const {
      name,
      char,
      color,
      blocksMove,
      blocksSight,
    } = {...props};

    this.name = name;
    this.char = char;
    this.color = color;
    this.blocksMove = blocksMove;
    this.blocksSight = blocksSight;
  }
}

export const tileDict = {
  'dungeon floor': {
    name: 'dungeon floor',
    char: '.',
    color: colors.SEPIA,
    blocksMove: false,
    blocksSight: false,
  },
  'dungeon wall': {
    name: 'dungeon wall',
    char: '#',
    color: colors.DARK_SEPIA, 
    blocksMove: true,
    blocksSight: true,
  },
};
```

Let's examine the properties of the Tile class described in the constructor. The purpose of the `name`, `char`, and `color` properties' should be obvious, but what about `blocksMove` and `blocksSight`? `blocksMove` is a boolean used to determine whether entities like the player or monsters can move through the tile. A dungeon wall tile, for example, would have `blocksMove` set to `true`. `blocksSight` will be used to calculate the field of vision for our player when we develop that feature later on. In most instances, a tile that blocks movement will also block sight, like the dungeon wall, but there are exceptions to this, such as a fence tile you could see through but not move through. Because of this, it's best to keep `blocksMove` and `blocksSight` as two distinct properties.

Also, notice that below the Tile class code, theres a `tileDict` (shorthand for tile dictionary) with 2 example tile objects. This should be enough for us to start making a level with. Let's do that now.

Create a file `level.js` in the `src/level` folder with the following code:

```js
import Tile, {tileDict} from './tile';

export default class Level {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = this.initTiles();
  }

  initTiles() {
    let tiles = {};
    for( let y = 0; y < this.height; y++ ) {
      for( let x = 0; x < this.width; x++ ) {
        tiles[`${x},${y}`] = new Tile( tileDict['dungeon floor'] );
      }
    }

    tiles['30,22'] = new Tile( tileDict['dungeon wall'] );
    tiles['31,22'] = new Tile( tileDict['dungeon wall'] );
    tiles['32,22'] = new Tile( tileDict['dungeon wall'] );

    return tiles;
  }
}
```

To generate a level, we first need to know it's width and height, which is why they are passed into the constructor. We then loop through every x and y value in that range, creating "dungeon floor" tiles until the map is filled. To test out movement blocking tiles, we then reset 3 of those tiles to "dungeon wall." 

One thing you may notice is that the `tiles` variable is 1-dimensional list of tiles with coordinate strings for keys, not a 2-D array as is commonly used in game programming. This is the de facto way of representing map structures in rot.js according to the docs, and it's actually a pretty convenient approach to working with this code.

Now let's instantiate this level by hooking it up to our game engine. In `engine.js`, import the Level class:
```js
import Level from '../level/level';
```

Then, add the following line in the Engine.constructor() method, right below where `this.entities` is set:
```js
    this.level = new Level(constants.MAP_WIDTH, constants.MAP_HEIGHT);
```

In the Engine.update() method, change the call to renderMap() so that we pass in this.level as well:
```js
    renderMap(this.mapDisplay, this.level, this.entities);
```

Let's hop over to the the `src/ui/renderMap.js` file and update it to render our new level:
```js
export const renderMap = function(mapDisplay, level, entities) {
  mapDisplay.clear();

  // Draw all tiles
  for( let x = 0; x < level.width; x++ ) {
    for( let y = 0; y < level.height; y++ ) {
      const tile = level.tiles[`${x},${y}`];
      mapDisplay.draw( x, y, tile.char, tile.color );
    }
  }

  // Draw all entities
  for( const entity of entities ) {
    mapDisplay.draw( entity.x, entity.y, entity.char, entity.color );
  }
};
```

Notice that we draw our tiles _before_ we draw our entities, otherwise our entities wouldn't be visible.

![Drawing the Level](/posts/roguelike-tutorial-2/drawing-the-level.jpg)

## Getting walls to block movement

If you test the program in your browser at this point, everything should be rendering properly. However, our walls aren't blocking player movement! Let's fix that by adding a new method to our Level class, below the initTiles() method:
```js
  blocksMoveAt(x, y) {
    return this.tiles[`${x},${y}`].blocksMove;
  }
```

We can now call this method in our game engine when the player attempts to move. Just wrap the line `this.player.move(dx, dy);` in `engine.js` with a new condition:
```js
      if(! this.level.blocksMoveAt(destinationX, destinationY) ) {
        this.player.move(dx, dy);
      }
```

In the browser, your player entity should get blocked by the wall tiles if he tries to move through them.

You now have a working, albeit basic, Entity and game Level system in place! We have all the parts we need to start procedurally generating more interesting dungeons, which we'll tackle in the next tutorial.


We now have a working, albeit basic Entity and dungeon Level system in place. Now that we have defined the essential parts for describing our environment and its inhabitants, we can use these parts to start procedurally generating more interesting dungeons, which is exactly what we'll be tackling in the [next post]() in this tutorial series.

You can view or download the final code for this post [here](//github.com/jamesheston/es6-javascript-roguelike-tutorial/tree/post01/index.html).

You can check out a working version of the final state of this post [here](//165.227.94.249/es6-rl-tuts/01/).