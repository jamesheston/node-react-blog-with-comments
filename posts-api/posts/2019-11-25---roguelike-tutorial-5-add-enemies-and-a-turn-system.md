---
title: Roguelike Tutorial 5 - Add Enemies and a Turn System
date: 20191125
draft: false
slug: "roguelike-tutorial-5-add-enemies-and-a-turn-system"
category: "Roguelike Tutorials"
tags:
  - "JavaScript"
  - "Roguelike Tutorials"
description: ""
---

In this post, we add monsters to our level generation recipe, placing them randomly throughout the map. We'll also extend the Entity class to create a specialized `Actor` class which holds the logic for the player, monsters, and NPCs in our game. Finally, we are going implement a turn-based system that waits for the player to input an action, and then cycles through all the all the other actors in the level, triggering their actions. This will serve as a foundation for the combat system convered in the next post.

## Update `Level.generate()` to add enemies to rooms
First, delete the lines in Engine.constructor() which were creating our old test NPC, and update the `this.entities = [this.player, npc]` declaration since we're no longer passing it anything other than the player.
```js
    document.querySelector('#root').appendChild(this.mapDisplay.getContainer());

    this.player = new Entity('Player', -1, -1, '@', colors.WHITE);
    this.entities = [this.player];

    this.level = new Level(constants.MAP_WIDTH, constants.MAP_HEIGHT);
    this.level.generate(this.player, this.entities);
```

Also, over in `src/level/level.js`, remove the following lines which placed the NPC in the middle of the last room generated. Since he no longer exists, these lines will crash the program.
```js
    // Place the NPC in the middle of the last room
    const lastRoom = rooms[rooms.length - 1];
    const [centerX, centerY] = lastRoom.center();
    const npc = entities.find( e => e.name === 'NPC');
    npc.x = centerX;
    npc.y = centerY;
```

Let's continue working in `src/level/level.js`. Near the top of the file, add another procgen parameter by inserting the following line below `const MAX_ROOMS = 30;`.
```js
const MAX_ENEMIES_PER_ROOM = 3;
```

Also, at the very top of the file, add these import statements:
```js
import {colors} from '../ui/colors';
import Entity from '../entity/entity';
```

Now add a new method `addEnemiesToRoom()` to the Level class. This will be run on every room generated, where it will create a random number of enemies between 0 and the `MAX_ENEMIES_PER_ROOM` value. Each enemy that is created is placed on a random tile in that room, and it has an 80% change of being an orc, and a 20% chance of being a troll. 
```js
  addEnemiesToRoom(room, entities) {
    const numOfEnemies = randInt(0, MAX_ENEMIES_PER_ROOM);
  
    for( let i = 0; i < numOfEnemies; i++ ) {
      // Choose a random tile in the room to place the new enemy.
      const x = randInt(room.x1 + 1, room.x2 - 1);
      const y = randInt(room.y1 + 1, room.y2 - 1);
      
      // Only add this enemy if no other entity is already occupying the tile 
      // at x, y.
      if(! entities.some( e => e.x === x && e.y === y ) ) {
        let enemy;
        // 80% chance the new enemy is an orc, 20% chance it's a troll.
        if( randInt(1, 100) <= 80 ) {
          enemy = new Entity('orc', x, y, 'o', colors.DESATURATED_GREEN, true);
        } else {
          enemy = new Entity('troll', x, y, 'T', colors.DARKER_GREEN, true);
        }
        // Add the new entity to the list of entities held by the Engine.
        entities.push(enemy);
      }
    }
  }
```

Call `addEnemiesToRoom()` toward the end of the for loop in Level.generate(), after each new room is generated.
```js
      this.addEnemiesToRoom(newRoom, entities);

      numRooms++;
      rooms.push(newRoom);
```

In your browser, the level should now be populated with monsters, though depending on the procgen results, you may have to explore beyond the starting room to find them, or refresh the browser a few times. To get a better feel for the overall distribution of enemies on the map, you could hop into the `renderMap.js` file and temporarily edit the code so that it will draw an entity, regardless of whether it's in the player's FOV or not:

```js
  // Draw entities
  for( const entity of entities ) {
    const isVisible = fovMap.indexOf(`${entity.x},${entity.y}`) !== -1;
    // if( isVisible ) {
    if( true ) {
      mapDisplay.draw(entity.x, entity.y, entity.char, entity.color);
    }
  }
```

You should see something like this:

![Render all entities](/posts/roguelike-tutorial-5/draw-all-entities-2.jpg)

Before we move forward, make sure to undo the edit we just made to `renderMap.js`, and return any monsters outside our FOV to the darkness from whence they came.

## Add a `blocksMove` property to `Entity` class, and extend it to create an `Actor` class

If you've played some of the classic roguelike games, you know that a common mechanic for engaging enemies in melee combat is by walking into them. This brings us to our next problem. Currently, if the player presses a move key in the direction of an adjacent enemy, instead of attacking that enemy, the player will simply move through them to occupy the same tile. What, are they all ghosts or something? This doesn't feel like a roguelike at all! Terrible! 

Let's modify the player and monster entities to block movement. While we're at it, we'll go ahead and create an `Actor` class that will be used to create the player and the monsters, and later on, friendly NPCs like shopkeepers and townspeople too. 

First things first though - add a `blocksMoves` property to the Entity class:
```js
export default class Entity {
  constructor(name, x, y, char, color, blocksMove = false) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.char = char;
    this.color = color;
    this.blocksMove = blocksMove;
  }
```

Now create the Actor class. Make a new file in a new folder: `src/entity/actor/actor.js`:
```js
import Entity from '../entity';

export default class Actor extends Entity {
  constructor(name, x, y, char, color, blocksMove = true) {
    // Calling `super` here passes the listed arguments to Entity.constructor, so that the
    // parent class can access this important data from any methods it might have.
    super(name, x, y, char, color, blocksMove);
  }
}
```

Notice that the parent Entity class doesn't block movement by default, but the Actor class does. The idea here is that the vast majority of actor entities will block movement by default, while other entity types, like items you can pick up, or stairs, should not prevent the player from moving onto their tile.

Also, move the `move()` method from the Entity class to the Actor class for semantic reasons. Our eventual non-Actor entities, like potions, weapons, armor, doors, etc, aren't going to be walking around the map.

Since we've added this new Actor class, we need to update the code where our player and enemies were previously created using the old Entity class.

In `src/level/level.js`, replace this line:
```js
import Entity from '../entity/entity';
```
with this line:
```js
import Actor from '../entity/actor/actor';
```

Then, update the `Level.addEnemiesToRoom()` method:
```js
      if(! entities.some( e => e.x === x && e.y === y ) ) {
        let enemy;
        // 80% chance new enemy is an orc, 20% chance it's a troll
        if( randInt(1, 100) <= 80 ) {
          enemy = new Actor('orc', x, y, 'o', colors.DESATURATED_GREEN);
        } else {
          enemy = new Actor('troll', x, y, 'T', colors.DARKER_GREEN);
        }
        entities.push(enemy);
```

Back in the `src/engine/engine.js` file, update the player instance to use the Actor class too. In `Engine.constructor()`, replace this line:
```js
    this.player = new Entity('Player', -1, -1, '@', colors.WHITE);
```
with this line:
```js
    this.player = new Actor('Player', -1, -1, '@', colors.WHITE);
```

Remember to import the new Actor class into the engine.js file. Replace this line:
```js
import Entity from '../entity/entity';
```
with this line:
```js
import Actor from '../entity/actor/actor';
```

## Update the 'PLAYER_MOVE' action handler to "attack" adjacent enemies
Now that the player and monsters are all members of the `Actor` class and have `blocksMove` set to `true`, we need to update our engine to check for this property whenever the player tries to move onto a new tile.

First though, let's add a helper method that checks if there are any blocking actors at a specified coordinate tile.

Create a new function `getBlockingActorAtTile()` at the end of `level/level.js`, _outside_ the Level class's definition:
```js
export const getBlockingActorAtTile = function(actors, x, y) {
  for( const actor of actors ) {
    if( actor.x === x && actor.y === y && actor.blocksMove) {
      return actor;
    }
  }
  return false;
}
```

Now import it at the top of `src/engine/engine.js`.
```js
import {getBlockingActorAtTile} from '../level/level';
```

Finally, in `Engine.update()`, we adjust the block that handles the `PLAYER_MOVE` action to check if there is a blocking actor at the tile the player is trying to move onto. If there is, the player will "attack" that actor instead of moving. Since we don't have an actual combat system set up yet, the attack will simply be represented by a console log message for now. 

```js
    if( 'PLAYER_MOVE' in action ) {
      const dx = action.PLAYER_MOVE[0];
      const dy = action.PLAYER_MOVE[1];
      const destinationX = this.player.x + dx;
      const destinationY = this.player.y + dy;

      if(! this.level.blocksMoveAt(destinationX, destinationY) ) {
        const target = getBlockingActorAtTile(this.entities, destinationX, destinationY);
        if( target ) {
          console.log(`You give the ${target.name} a test tickle. Har har.`);
        } else {
          this.player.move(dx, dy);
          this.fov.needsRecompute = true;
        }
      }
    }
```

In your browser, you should now be able to run around as the player, and, according to your JavaScript console, harass any adjacent enemies you move against instead of passing through them. 

## Set up player and enemy turns
At the moment, these mindless monsters can't even retalitate! Where's the sport in that?

Let's give the enemies their turn.

But, how do we keep track of whose turn it is? It's pretty simple, actually. We'll add a new engine property called `engineMode` which will be set to either `PLAYER_TURN` or `ENEMY_TURN`.

To go along with this property, we want to create a static list of all the possible engine modes. For now, it just consists of `PLAYER_TURN` and `ENEMY_TURN`, but later we'll want to expand this so the engine can respond to different conditions like `PLAYER_DEAD`, `LEVEL_UP`, etc. 

Create a new file `src/engine/engineModes.js` with these contents:
```js
const EngineModes = {
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN: 'ENEMY_TURN',
};
// Freeze the object so that it can't be accidentally modified anywhere else
// in the program.
Object.freeze(EngineModes);

export {EngineModes};
```

Import it into `src/engine/engine.js`:
```js
import {EngineModes} from './engineModes';
```

In `Engine.constructor()`, we set the initial game mode to give the player the first turn.
```js
    this.fov.needsRecompute = true;

    this.engineMode = EngineModes.PLAYER_TURN;

    this.addInputListeners = addInputListeners.bind(this);
```

In `Engine.update()`, within the `PLAYER_MOVE` action handler, switch the engineMode to `ENEMY_TURN` if and after the player has made a valid move. 
```js
      if(! this.level.blocksMoveAt(destinationX, destinationY) ) {
        const target = getBlockingActorAtTile(this.entities, destinationX, destinationY);
        if( target ) {
          console.log(`You box the ${target.name} right between the ears. POW!`);
        } else {
          this.player.move(dx, dy);
          this.fov.needsRecompute = true;
        }
        this.engineMode = EngineModes.ENEMY_TURN;
      }
```

Also, modify the `if 'PLAYER_MOVE' in action` conditional to check if it's the player's turn. This prevents the player from moving again while it's still the enemy's turn.
```js
    if( 'PLAYER_MOVE' in action && this.engineMode === EngineModes.PLAYER_TURN ) {
```

If you run the game now, the player will move once, and then become stuck, as the engineMode remains set to `ENEMY_TURN`.

Let's add a new code block in Engine.update() after the player action handler that loops through all the enemies on the level, allows them to perform an action, and then sets the engineMode back to `PLAYER_TURN` after the loop is complete.

```js
    if( this.fov.needsRecompute ) {
      this.fov.map = computeFov(this.player.x, this.player.y, this.fov.radius);
    }

    if( this.engineMode === EngineModes.ENEMY_TURN ) {
      const enemies = this.entities.filter( e => e instanceof Actor && e !== this.player );
      for( const enemy of enemies ) {
        console.log( `The ${enemy.name} awaits further instructions.` );
      }
      this.engineMode = EngineModes.PLAYER_TURN;
    }

    renderMap(this.mapDisplay, this.level, this.entities, this.fov.map);
```

Test the game in your browser with the console open. After the player uses their turn by moving or attacking, all the monsters on the level will use their turn to let you know they're awaiting further instructions. 

![Turn system in place](/posts/roguelike-tutorial-5/awaits-further-instructions-2.jpg)

Now that we have added monsters to the dungeon, and set up player and enemy turns, we are ready to implement a combat system. We'll do that in the [next post]().

The final code for this post can be found [here](//github.com/jamesheston/es6-javascript-roguelike-tutorial/tree/post04).

You can see a working demo of the final state of this post [here]().