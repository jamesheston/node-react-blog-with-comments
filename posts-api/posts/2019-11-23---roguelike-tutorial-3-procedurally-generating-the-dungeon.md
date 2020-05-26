---
title: Roguelike Tutorial 3 - Procedurally Generating the Dungeon
date: 20191123
draft: false
slug: "roguelike-tutorial-3-procedurally-generating-the-dungeon"
category: "Roguelike Tutorials"
tags:
  - "JavaScript"
  - "Roguelike Tutorials"
description: "This post has to be one of the coolest one in the series, as we code up a dungeon generation algorithm from scratch!"
---

This post has to be one of the coolest one in the series, as we code up a dungeon generation algorithm from scratch!

In the previous post, we added an `Entity` class for defining the player and NPCs, a `Level` class for defining the dungeon itself, and a `renderMap` function to draw the level and its inhabitants. We now have the basic elements with which we can describe and illustrate the environment the player will explore. The next step is to define a process that puts these elements together to create new levels for us.

## Digging rooms

Let's revisit our `Level` class's `initTiles` method. Delete these lines where we added some wall tiles:
```js
    tiles['30,22'] = new Tile( tileDict['dungeon wall'] );
    tiles['31,22'] = new Tile( tileDict['dungeon wall'] );
    tiles['32,22'] = new Tile( tileDict['dungeon wall'] );
```

Then, right above that, where we looped through all the x and y values of the map and filled them in with floor tiles, change the one innermost line of the loop to create wall tiles instead:
```js
    for( let y = 0; y < this.height; y++ ) {
      for( let x = 0; x < this.width; x++ ) {
        tiles[`${x},${y}`] = new Tile( tileDict['dungeon wall'] );
      }
    }
```

In defining a process for generating a dungeon, the idea here is to start off with a fully walled off map, and then dig out rooms and tunnels as our procgen loop chugs along. This is the standard approach roguelikes use for dungeon generation.

![Fill map with wall tiles](/posts/roguelike-tutorial-3/map-filled-with-wall-tiles.jpg)

The rooms in _this_ dungeon will be rectangles of varying sizes, so let's define a reusable `Rectangle` class for generating the rooms. Create a file `rectangle.js` in the `src/level` folder with this code:
```js
export default class Rectangle {
  constructor(x, y, width, height) {
    this.x1 = x;
    this.y1 = y;
    this.x2 = x + width;
    this.y2 = y + height;
  }
}
```

Now, back in our `level.js` file, at the top, import the new `Rectangle` class:
```js
import Rectangle from './rectangle';
```

Then add a new method to the `Level` class below `initTiles` to dig out a rectangular room:
```js
  digRoom(room) {
    for(let x = room.x1 + 1; x < room.x2; x++) {
      for(let y = room.y1 + 1; y < room.y2; y++) {
        this.tiles[`${x},${y}`] = new Tile( tileDict['dungeon floor'] );
      }
    }
  }
```

One important detail to note about the excavation dimensions in the `digRoom` method, is the loops for digging out the floor skip the first and last values of both x and y, so a room's floor is always 2 units less in width and height than the total size of the rectangular room passed in. Another way to think about this is that __a room's width and height include the walls that enclose it__.

As an example, here is a room where x1 is 1, y1 is 1, x2 is 6, and y2 is 6: 
```
  0 1 2 3 4 5 6 7
0 # # # # # # # #
1 # # # # # # # #
2 # # . . . . # #
3 # # . . . . # #
4 # # . . . . # #
5 # # . . . . # #
6 # # # # # # # #
7 # # # # # # # #
```

The reason for including the walls in a room's size is to ensure that later on, as we dig out more rooms, as long as one room's coordinates don't overlap another, there will always be a wall between them.

Let's run a little demo using the Rectangle class to create a couple rooms so we can see it in action on the map. Add a `generate` method below the `initTiles` method to the `Level` class:
```js
  generate(player, entities) {
    const room1 = new Rectangle(5, 5, 10, 5);
    const room2 = new Rectangle(35, 20, 5, 10);

    this.digRoom(room1);
    this.digRoom(room2);
  }
```

Now add a line of code in `Engine.constructor()` to call the generate function right after this.level is instantiated.
```js
    this.level = new Level(constants.MAP_WIDTH, constants.MAP_HEIGHT);
    this.level.generate(this.player, this.entities);
```

![Rectangular rooms digging test](/posts/roguelike-tutorial-3/rectangular-rooms-dig-test.jpg)

In the browser, you should now see two disconnected rooms, one in the upper-left of the map, and another in the center with our player (and our poor NPC entombed in the wall). 

## Digging tunnels

How do we typically connect different rooms in a roguelike? With tunnels!

Let's connect the two demo rooms with simple tunnel that goes up in a straight vertical line from the center room until it reaches the y-level of the upper-left room, and then left in a straight horizontal line until it reaches the upper-left room.

We'll split this into two new methods added to the `Level` class: `digHTunnel` and `digVTunnel`.

```js
  digHTunnel(x1, x2, y) {
    for(let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      this.tiles[`${x},${y}`] = new Tile( tileDict['dungeon floor'] );
    } 
  }

  digVTunnel(y1, y2, x) {
    for(let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      this.tiles[`${x},${y}`] = new Tile( tileDict['dungeon floor'] );
    } 
  }
```

Now call these tunneling methods in `Level.generate()` to connect our rooms. Below `this.digRoom(room2)` add the lines:
```js
    this.digVTunnel(20, 7, 37);
    this.digHTunnel(37, 15, 7);
```

_Hooray_. The player can now move between the two rooms via our freshly dug tunnel. 

![Tunnel digging test](/posts/roguelike-tutorial-3/tunnel-digging-test.jpg)

Now that we have demonstrated that our room and tunnel digging code works, let's build a system which generates a randomized dungeon for us using these methods.

## Procgen prep

### Room and tunnel alignment helpers
To proceed with procgen, we need to add these 2 helper methods to our `Rectangle` class:

```js
  center() {
    const centerX = Math.round((this.x1 + this.x2) / 2);
    const centerY = Math.round((this.y1 + this.y2) / 2);
    return [centerX, centerY];
  }

  intersects(other) {
    // returns true if this rectangle intersects with the `other` rectangle passed
    return ( this.x1 <= other.x2 && this.x2 >= other.x1 
          && this.y1 <= other.y2 && this.y2 >= other.y1 
    );
  }
```

`Rectangle.center()` returns the x and y coordinates of the center point of the Rectangle, which we'll use to place our tunnels. We'll need `Rectangle.intersects()` to ensure that a new room with a random position and size doesn't overlap any previously generated rooms.

### (R)andom (N)umber (G)eneration with rot.js

The one final tool required for our level generation algorithm is a Random Number Generator. While JavaScript's `Math.random()` function is fine, rot.js's `ROT.RNG.getUniform()` method is better for development. That's because it lets us use a *seed* number. A seed is a number we can pass to our RNG that will cause it to generate the same sequence of "random" values every time. This is invaluable for debugging as the project grows. If we run into some buggy behavior that only occurs occasionally through a truly random set of generated circumstances, we don't have any reliable way of reproducing that bug in order to fix it. On the other hand, if we used a seed value and have a log it somewhere, we can just reuse that seed and our RNG will reproduce the circumstances that led up to the bug, making it much easier fix.

Let's use the timestamp of the moment the game engine is instantiated as our seed, and log that seed in our JavaScript console.

Make a new `randomUntil.js` file in the `src/lib` folder with this code:
```js
import * as ROT from 'rot-js';

export const setRNGSeed = function() {
  // Date.now() returns a integer that will always be different from a previous 
  // game, making it a good seed for our RNG.
  let seed = Date.now();
  console.log("seed:", seed);
  ROT.RNG.setSeed(seed); 
};

export const randInt = function (min, max) {
  const range = max + 1 - min;
  // generate a random number within the given range
  const a = Math.floor((ROT.RNG.getUniform() * range));
  return a + min;
};
```

Remember, we need to seed our RNG before it generates any random values, so it's important to do this at the very beginning of our game engine initialization. In `src/engine/engine.js`, add this import line at the top:
```js
import {setRNGSeed} from '../lib/randomUtil';
```

Now insert these two lines at the very beginning of `Engine.constructor()`
```js
    // init and log rot.js random number generator seed for debugging
    setRNGSeed();
```

The RNG is now properly seeded and configured with our engine. At this point, we finally have all the tools required to procedurally generate a dungeon level. 

_LET'S DO IT!!!_

## Level generation procedure

Return to the `level.js` file, and import our RNG utility at the top:
```js
import {randInt} from '../lib/randomUtil';
```

Right below our imports, above the line `export default class Level {`, add the following code:
```js
const ROOM_MAX_SIZE = 10;
const ROOM_MIN_SIZE = 6;
const MAX_ROOMS = 30;
```
These constants serve as constraint parameters for our level generator that we can easily tweak to taste. 

Now we can turn our attention to the `Level.generate()` method. First delete all the code that was being used before to demo our digging methods, and replace it with this definition:
```js
  generate(player, entities) {
    const rooms = [];
    let numRooms = 0;

    for( let i = 0; i < MAX_ROOMS; i++ ) {
      // generate a room of random width and height within size constraints
      const w = randInt(ROOM_MIN_SIZE, ROOM_MAX_SIZE);
      const h = randInt(ROOM_MIN_SIZE, ROOM_MAX_SIZE);
      // place it on a random position within map boundries
      const x = randInt(0, this.width - w - 1);
      const y = randInt(0, this.height - h - 1);

      const newRoom = new Rectangle(x, y, w, h);
      // make sure this new room doesn't overlap with any previously generated rooms
      // before adding it to the level
      if( rooms.some( r => r.intersects(newRoom) ) ) {
        continue; // continue exits this iteration of loop and goes ahead to next
      }
      // else this room is valid, add it to level
      this.digRoom(newRoom);

      const [newX, newY] = newRoom.center(); 
      // if this is the first room added to the map, place the player in the middle
      // of this room
      if( numRooms === 0 ) {
        player.x = newX;
        player.y = newY;
      
      // if this isn't the first room, we need to dig a tunnel between this room
      // and the previous one
      } else {
        const [prevX, prevY] = rooms[numRooms - 1].center();
        // "Flip a coin" to choose whether to dig up or over first
        if( randInt(0,1) === 1 ) {
          this.digHTunnel(prevX, newX, prevY);
          this.digVTunnel(prevY, newY, newX)
        } else {
          this.digVTunnel(prevY, newY, prevX);
          this.digHTunnel(prevX, newX, newY);
        }
      }

      // finally, update `rooms` and `numRooms` for later iterations to reference
      numRooms++;
      rooms.push(newRoom);
    }
    
    // Place the NPC in the middle of the last room
    const lastRoom = rooms[rooms.length - 1];
    const [centerX, centerY] = lastRoom.center();
    const npc = entities.find( e => e.name === 'NPC');
    npc.x = centerX;
    npc.y = centerY;
  }
```

And that's it. That's our level procgen loop. Refresh the browser a few times to see how the layout varies between instances. You could also fiddle with the constraint parameters `ROOM_MIN_SIZE`, `ROOM_MAX_SIZE`, and `MAX_ROOMS` to check out how they affect the dungeon's structure.

![Procgen dungeon example](/posts/roguelike-tutorial-3/procgen-dungeon.jpg)

Before we wrap up, go back into Engine.constructor and remove the lines that placed the Player and NPC in the middle of the map. It's just dead code now that our level generation algorithm is going to determine entity placement. That section should now look like this:
```js
    document.querySelector('#root').appendChild(this.mapDisplay.getContainer());

    this.player = new Entity('Player', -1, -1, '@', colors.WHITE);
    const npc = new Entity('NPC', -1, -1, '@', colors.YELLOW);
    this.entities = [this.player, npc];
```
I chose x and y values of -1, which aren't valid map coordinates, to make it clear that the Engine.constructor() method isn't responsible for where these actors are actually placed.

Congratulations, you've just generated your first dungeon! In the [next post](), we'll give the player a limited (F)ield (O)f (V)ision, and add memory for previously visited tiles, producing a "fog of war" effect to make the dungeon more fun to explore.

The final code for this post can be found [here](//github.com/jamesheston/es6-javascript-roguelike-tutorial/tree/post03).

You can view a working demo of the end state of this post [here]();
