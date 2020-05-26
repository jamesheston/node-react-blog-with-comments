---
title: "Roguelike Tutorial 6 - Components, Combat, and Pathfinding"
date: 20191127
draft: false
slug: "roguelike-tutorial-6-components-combat-and-pathfinding"
category: "Roguelike Tutorials"
tags:
  - "JavaScript"
  - "Roguelike Tutorials"
description: ""
---

In the previous post in this tutorial series, we added monsters and a turn system to the game, laying the foundation for what we're going to be doing in this post: implementing a combat system. While this will be one of the more fun and rewarding parts of the game to code, it also requires covering a lot of new ground in a single post, so grab your caffeinated beverage of choice and hunker down for a long coding session. We'll introduce Component classes to add combat and AI capabilities to our entities, add a pathfinding algorithm to our enemy AI so they will chase the player, and establish a pattern for building and processing a list of turn results, allowing our engine to keep track of all the consequences of any action a monster or player takes during their turn.

## Add and Configure the `Combat` and AI Components
The first step in creating a combat system is to add some combat-relevant attributes to our Actors, like hitpoints, attack power, and defense. We're going to achieve this using a programming technique called _composition_, which is an OOP pattern where a _container_ class holds a number of _component_ classes as instance variables. A component class describes a specific functionality that can be added to a container class. You can think of this as a "has a" relationship. For example, a `Car` could be defined as a container class that has an `Engine` component and a `Suspension` component as its properties.

In this tutorial, our `Actor` class will be the container, and we'll create `Combat` and `MeleeAttacker` components that can be attached to actor instances to make them capable of fighting.  The `Combat` component will encapsulate the logic for storing and adjusting  an actor's hitpoints, power, and defense. `MeleeAttacker` will be an AI component with behavior scripts that tell our monsters to chase and attack the player.

The _Entity Component System_ (sometimes abbreviated to "ECS") is a nearly ubiquitous paradigm in roguelike development, and in game development in general, because it let's us isolate different pieces of functionality into specific components, which can be added and reused in our Entity containers in different combinations to produce lots of novel content.

So, let's create some components for our actors to make them combat ready.

Create a new file `src/entity/actor/components/combat.js` with the following contents:
```js
export default class Combat {
  constructor(hp, defense, power) {
    this.maxHp = hp;
    this.hp = hp;
    this.defense = defense;
    this.power = power;
  }
  takeDamage(amount) {
    this.hp -= amount;

    if( this.hp <= 0 ) {
      console.log(`The ${this.owner.name} dies! R.I.P.!`);
    }
  }

  attack(target) {
    const damage = this.power - target.combat.defense;

    if( damage > 0 ) {
      console.log(`The ${this.owner.name} attacks the ${target.owner.name}, dealing ${damage} damage.`);
    } else {
      console.log(`The ${this.owner.name} attacks the ${target.owner.name}, but does no damage.`);
    }
  }  
}
```

We're going to start off with a simple combat system that only requires the attributes defined above. `power` is an integer that represents the potential hit points damage an actor deals when it attacks, and this is lowered by the `defense` number of the defender. So, if a defender's `defense` is equal to or higher than the attacker's `power`, he won't take any damage when attacked. Also, when an actor's hitpoints, or `hp`, drops to 0 or below, it dies.

Now let's create an AI component that will eventually hold some behavioral scripts for our monsters, so they'll chase after the player when they see him, and attack him when he's within range.

Create a new file `src/entity/actor/components/ai.js` with the following code:
```js
class MeleeAttacker {
  takeTurn() {
    console.log(`The ${this.owner.name} wonders when it will get to chase and attack you.`);
  }
}

export {MeleeAttacker};
```

We'll flesh out the `MeleeAttacker` AI later. Right now, we need to suss out how to attach these components to our actors.

Modify the `Actor` class's constructor to receive a list of `components` in a new parameter.
```js
export default class Actor extends Entity {
  constructor(name, x, y, char, color, components, blocksMove = true) {
    super(name, x, y, char, color, blocksMove);
  
    const {
      combat,
      ai,
    } = {...components};

    if( combat ) {
      this.combat = combat;
      this.combat.owner = this;
    }
    if( ai ) {
      this.ai = ai;
      this.ai.owner = this;
    }  
  }
```

The argument passed to the `components` parameter is just an object with the keys `combat` and `ai`, and values that are instances of the `Combat` and `MeleeAttacker` component classes. You'll see some examples of this shortly when we add components to our player and monsters.

One important piece of the code above is these two lines: `this.combat.owner = this` and `this.ai.owner = this`. This allows allows our components to access the properties of the entities they are attached to, and is why the line
```js
    console.log(`The ${this.owner.name} wonders when it will get to chase and attack you.`);
```
in our `MeleeAttacker` code prints the attacking monster's name instead of throwing an error. This is a core piece of the Component pattern, and you will see it used again and again as we create more components to expand the functionality of our game.

Now, let's put these components to use. First, add the `Combat` component to the player by updating the player instantiation in Engine.constructor():
```js
    document.querySelector('#root').appendChild(this.mapDisplay.getContainer());

    // create player
    const combat = new Combat(30, 2, 5);
    this.player = new Actor('Player', 0, 0, '@', colors.WHITE, { combat });

    this.entities = [this.player];
```
Remember to import the `Combat` component by adding this line to the top of `src/engine/engine.js`:
```js
import Combat from '../entity/actor/components/combat';
```

Next we'll need to add the Combat and AI components to our enemies when they are created. At the top of `src/level/level.js` add these imports:
```js
import {Combat} from '../entity/actor/components/combat';
import {MeleeAttacker} from '../entity/actor/components/ai';
```

Update `Level.addEnemiesToRoom()` to look like this:
```js
      if(! entities.some( e => e.x === x && e.y === y ) ) {
        let enemy;
        // 80% chance new enemy is an orc, 20% chance it's a troll
        if( randInt(1, 100) <= 80 ) {
          const combat = new Combat(10, 0, 3);
          const ai = new MeleeAttacker();
          enemy = new Actor('orc', x, y, 'o', colors.DESATURATED_GREEN, {combat, ai});

        } else {
          const combat = new Combat(16, 1, 4);
          const ai = new MeleeAttacker();
          enemy = new Actor('troll', x, y, 'T', colors.DARKER_GREEN, {combat, ai});

        }
        entities.push(enemy);
      }
```

Now edit `Engine.update()` to use the enemy's AI component's `takeTurn()` method.

```js
    if( this.fov.needsRecompute ) {
      this.fov.map = computeFov(this.player.x, this.player.y, this.fov.radius);
    }

    if( this.engineMode === EngineModes.ENEMY_TURN ) {
      const enemies = this.entities.filter( e => e instanceof Actor && e !== this.player );
      for( const enemy of enemies ) {
        if( enemy.ai ) {
          enemy.ai.takeTurn();
        }
      }
      this.engineMode = EngineModes.PLAYER_TURN;
    }

    renderMap(this.mapDisplay, this.level, this.entities, this.fov.map);
```

If you move around in the game now and look in the browser console, you'll see messages like "The orc wonders when it will get to chase and attack you," confirming that our AI component is properly attached to the monster entities and can access attributes of its container class, and the `MeleeAttacker.takeTurn()` method is being called.

## Adding Pathfinding for Enemy AI
Now that our components are properly attached to our actors, we can flesh out their functionality. We want our monsters to chase the player on sight. Let's give them access to a new method called `moveToward` which uses a rot.js pathfinding algorithm to calculate a path to the player, and then moves the monster one step closer to that player each turn. We'll attach this method to the `Actor` class instead of placing it in the monster's `ai.js` file in case the we need to give the player entity access to some pathfinding methods later on, like for an autoexplore feature.

So, in `/entity/actor/actor.js`, first `import * as ROT from 'rot-js';`, and then add this `moveToward()` method to the `Actor` class:

```js
  moveToward(target, level, entities) {
    // First, compute a path array to target that doesn't factor in blocking entities,
    // then loop through the closest 5 steps of that until we find an unoccupied space.
    // Then, we compute a second path array to that unoccupied space. This double-path
    // approach is used to prevent NPCs from just standing still or "fleeing" when one 
    // other actor blocks the path to the player.

    // build a list of tiles with blocking entities
    const occupiedTiles = {};
    for( const entity of entities ) {
      if( entity !== this && entity !== target && entity.blocksMove ) {
        occupiedTiles[`${entity.x},${entity.y}`] = true;
      }
    }

    const passableCallback1 = (x, y) => {
      if( level.tiles[`${x},${y}`].blocksMove === false ) {
        return true;
      }      
    }
    const aStar1 = new ROT.Path.AStar(target.x, target.y, passableCallback1);    
    let path1 = []; 
    aStar1.compute( this.x, this.y, (x, y) => {
      path1.push({x, y});
    });

    // remove the first and last entries from the array because they are 
    // `this` entity and target locations
    path1.splice(0, 1);
    path1.splice(-1);    

    let openX, openY;    

    // Loop through last 5 entries in path array and store x & y of the first unoccupied tile
    // we find. This will become the target for our second path. 
    for( var i = 0; i < 5 && i < path1.length; i++ ) {
      const {x, y} = {...path1[path1.length - 1 - i]};
      if(! occupiedTiles[`${x},${y}`]) {
        openX = x;
        openY = y;
      }
    }

    const passableCallback2 = (x, y) => {
      if( level.tiles[`${x},${y}`] && level.tiles[`${x},${y}`].blocksMove === false && occupiedTiles[`${x},${y}`] === undefined) {
        return true;
      }
    }

    const aStar2 = new ROT.Path.AStar(openX, openY, passableCallback2);
    let path2 = [];

    aStar2.compute( this.x, this.y, (x, y) => {
      path2.push({x, y});
    });

    // remove the first entry from the array because it is 
    // `this` entity's location
    path2.splice(0, 1);

    const maxPathLen = 25;
    // Make sure path exists, and that its length is shorter than maxPathLen. 
    // Keeping the path size relatively low helps ensure monsters don't run all around
    // the map if there's an alternate route.
    if( path2.length > 0 && path2.length <= maxPathLen ) {
      this.x = path2[0]['x'];
      this.y = path2[0]['y'];
    } else {
      // entity just sits around waiting for the rapture
    }
  }
```

To determine if the player is within striking range, we'll also need a function to get the distance between the monster and the player. Let's add this to the `Entity` class though, as I can imagine _lots_ of use cases for a distance function that aren't exclusive to actors.

```js
  distanceTo(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return Math.sqrt(dx**2 + dy**2);
  }
```

Now we'll write a simple combat algorithm for our melee monsters. Whenever a monster sees the player, it should chase him until it is on an adjacent tile. If a monster is next to the player at the start of its turn, it will attack him.

Update `MeleeAttacker.takeTurn()`:
```js
  takeTurn(target, fovMap, level, entities) {
    const actor = this.owner;
    // For now, enemies only act when within the player's FOV and don't have their own FOV maps
    if( fovMap.indexOf(`${actor.x},${actor.y}`) !== -1 ) {
      if( actor.distanceTo(target) >= 2 ) {
        actor.moveToward(target, level, entities);
      } else if (target.combat.hp > 0) {
        actor.combat.attack(target);
      }
    }
  }
```

Now edit `Engine.update()` to pass the required data to `MeleeAttacker.takeTurn()`'s new parameters. 
```js
        if( enemy.ai ) {
          enemy.ai.takeTurn(this.player, this.fov.map, this.level, this.entities);
        }
```

In your browser, the monsters should now chase the player, and attack him when on an adjacent tile. The player's and monster's attacks and damage should be echoed in the console. If you inspect the variable `ENGINE.player.combat` in the console, his `hp` value should decrease after being attacked, and you should see a message saying an actor has died when it's hit points reach 0.

![](monsters-chasing-player.gif)

## Handling combat events in our engine with a turn results system

However, there are no consequences for "dying" right now, as both the player and monsters continue to run around long after their `hp` drops to 0 and runs into the negatives.

Also, while it's okay to to just log battle messages to the console during development, we're eventually going to want to print them to the screen soon for regular users.

To keep track of the messages and state changes related to combat, we're going to start aggregating a list of turn `results` for each actor during their turn. This list of results represents all the consequences of whatever action that actor took during their turn. At the end of their turn, this list of results is passed up to the `Engine.update()` method, where it will be handled by updating the game state (in the case of the player or monsters dying), and printing to the screen messages describing what happened during that turn. As our game grows, this turn results system will handle all sorts of new functionality, like quaffing potions, picking up items, casting spells, and gaining player levels.

For now, let's update the `Combat` component's `takeDamage()` and `attack()` methods to return a list of results describing what happened:
```js
  takeDamage(amount) {
    const results = [];

    this.hp -= amount;

    if( this.hp <= 0 ) {
      results.push({ dead: this.owner });
    }

    return results;
  }

  attack(target) {
    let results = [];

    const damage = this.power - target.combat.defense;
    
    if( damage > 0 ) {
      results.push({ message: new Message(`The ${this.owner.name} attacks the ${target.name}, dealing ${damage} damage.`) });
      results = [...results,  ...target.combat.takeDamage(damage)];
    } else {
      results.push({ message: new Message(`The ${this.owner.name} attacks the ${target.name}, but does no damage.`) });
    }
    } else {
      results.push({ message: `The ${ownerName} attacks the ${target.name}, but does no damage.` });
    }

    return results;
  }
```

Now edit `MeleeAttacker` in `ai.js` so it passes the the results of `Combat.attack()` up to `Engine.update()`. 
```js
  takeTurn(target, fovMap, level, actors) {
    let results = [];

    const actor = this.owner;
    // For now, enemies only act when within the player's FOV and don't have their own FOV maps
    if( fovMap.indexOf(`${actor.x},${actor.y}`) !== -1 ) {
      if( actor.distanceTo(target) >= 2 ) {
        actor.moveToward(target, level, actors);
      } else if (target.combat.hp > 0) {
        const attackResults = actor.combat.attack(target);
        results = [...results, ...attackResults];
      }
    }

    return results;
  }
```

Now we need to refactor `Engine.update()` to receive and keep track of player and monster turn results from combat.
```js
  update(action = {}) { 
    let playerTurnResults = [];

    // Player takes their turn, and a list of turn results is aggregated.
    if( 'PLAYER_MOVE' in action && EngineModes.PLAYER_TURN === this.engineMode ) {
      const dx = action.PLAYER_MOVE[0];
      const dy = action.PLAYER_MOVE[1];
      const destinationX = this.player.x + dx;
      const destinationY = this.player.y + dy;

      if(! this.level.blocksMoveAt(destinationX, destinationY) ) {
        const target = getBlockingActorAtTile(this.entities, destinationX, destinationY);
        if( target ) {
          const attackResults = this.player.combat.attack(target)
          playerTurnResults = [ ...playerTurnResults, ...attackResults ];
        } else {
          this.player.move(dx, dy);
          this.fov.needsRecompute = true;
        }

        this.engineMode = EngineModes.ENEMY_TURN;
      }
    }

    // Handle player turn results
    for( const turnResult of playerTurnResults ) {
      let message = turnResult.message;
      const deadActor = turnResult.dead;

      if( message ) {
        console.log(message);
      }
      if( deadActor ) {
        if( deadActor === this.player ) {
          // ADD PLAYER `dead` RESULT HANDLER
        } else {
          // ADD MONSTER `dead` RESULT HANDLER
        }
        console.log(message);
      }
    }

    // Loop through all the enemies on the current level, allowing them to act on their turn.
    if( EngineModes.ENEMY_TURN === this.engineMode ) {
      const enemies = this.entities.filter( e => e instanceof Actor && e !== this.player );
      for( const enemy of enemies ) {
        if( enemy.ai ) {
          // Every enemy builds up their own list of turn results.
          const enemyTurnResults = enemy.ai.takeTurn(this.player, this.fov.map, this.level, this.entities);
          
          for( const turnResult of enemyTurnResults ) {
            let message = turnResult.message;
            const deadActor = turnResult.dead;

            if( message ) {
              console.log(message);
            }
            if( deadActor ) {
              if( deadActor === this.player ) {
                // ADD PLAYER `dead` RESULT HANDLER
                break;

              } else {
                // ADD MONSTER `dead` RESULT HANDLER
              } 
              console.log(message);
            }
          }
        }

      }
      this.engineMode = EngineModes.PLAYER_TURN;
    }

    if( this.fov.needsRecompute ) {
      this.fov.map = computeFov( this.player.x, this.player.y, this.fov.radius );
    }

    renderMap(this.mapDisplay, this.level, this.entities, this.fov.map);
    
    this.fov.needsRecompute = false;
  }
```

Now, `Engine.update()` will receive a list of message `objects` describing attacks made in combat, and a `dead` object with a reference to the actor that died.

## Coping with death
Now, we need to prevent the player and monsters from running around the level after they're dead. So, let's create some functions to handle the `dead` turn result object. Make a new file `/entities/actor/killActor.js` with the following code:

```js
import {colors} from '../../ui/colors';
import {EngineModes} from '../../engine/engineModes';

export const killPlayer = function(actor) {
  actor.char = '%';
  actor.color = colors.DARK_RED;
  actor.name = `The ${actor.name}'s corpse`;

  return ['You died!', EngineModes.PLAYER_DEAD];
};

export const killActor = function(actor) {
  const message = `The ${actor.name} dies!`;

  actor.char = '%';
  actor.color = colors.DARK_RED;
  actor.blocksMove = false;
  actor.combat = null;
  actor.ai = null;
  actor.name = `The ${actor.name}'s corpse`;

  return message;
};
```

Whenever the player dies, we'll need to use the `killPlayer()` function to change the game engine mode and end the current playthrough. For everybody else, we'll use the `killActor()` function. 

Add the new mode `PLAYER_DEAD` to `engineModes.js`:
```js
const EngineModes = {
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN: 'ENEMY_TURN',
  PLAYER_DEAD: 'PLAYER_DEAD',
};
```

Now import `killPlayer()` and `killActor()` at the top of `engine.js`:
```js
import {killPlayer, killActor} from '../entity/actors/killActor';
```

In `Engine.update()`, use them to handle deaths that occur during the player's turn.
```js
    // Handle player turn results
    for( const turnResult of playerTurnResults ) {
      let message = turnResult.message;
      const deadActor = turnResult.dead;

      if( message ) {
        console.log(message);
      }
      if( deadActor ) {
        if( deadActor === this.player ) {
          [message, this.engineMode] = killPlayer(deadActor);
        
        } else {
          message = killActor(deadActor);
        } 
        console.log(message);
      }
    }
```

And the enemy turn as well.
```js
    // Loop through all the enemies on the current level, allowing them to act on their turn.
    if( EngineModes.ENEMY_TURN === this.engineMode ) {
      const enemies = this.entities.filter( e => e instanceof Actor && e !== this.player );
      for( const enemy of enemies ) {
        if( enemy.ai ) {
          // Every enemy builds up their own list of turn results.
          const enemyTurnResults = enemy.ai.takeTurn(this.player, this.fov.map, this.level, this.entities);
          
          for( const turnResult of enemyTurnResults ) {
            let message = turnResult.message;
            const deadActor = turnResult.dead;

            if( message ) {
              console.log(message);
            }
            if( deadActor ) {
              if( deadActor === this.player ) {
                [message, this.engineMode] = killPlayer(deadActor);
                break;

              } else {
                message = killActor(deadActor);
              } 
              console.log(message);
            }
          }
        }
        // If the player died on this enemy's turn, don't run any more enemy turns.
        if( EngineModes.PLAYER_DEAD === this.engineMode ) {
          break;
        }        
      }
      if(! (EngineModes.PLAYER_DEAD === this.engineMode) ) {
        this.engineMode = EngineModes.PLAYER_TURN;
      }
    }
```

## Add a `RenderOrders` enumerator to keep corpses from hiding the player and monsters
If you play the game now and kill some monsters, you'll notice that after a monster dies, it's corpse will hide the player and any monsters that move onto it's tile. This is because the dead entities are getting drawn after the living entities in our `renderMap()` function, covering them up. We can fix this bug by adding a `renderOrder` property to our `Entity` definition, to ensure high priority entities are drawn last.

First, we'll establish the render order for different types of entities, with higher values indicating that type of entity gets drawn later. Create a new `src/ui/renderOrders.js` file with the following code:
```js
const RenderOrders = {
  CORPSE: 1,
  ITEM: 2,
  ACTOR: 3,
};

Object.freeze(RenderOrders);

export {RenderOrders};
```

Now update `src/entity/entity.js` to add rendering order as a class property:
```js
import {RenderOrders} from '../ui/renderOrders';

export default class Entity {
  constructor(name, x, y, char, color, blocksMove = false, renderOrder = RenderOrders.CORPSE) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.char = char;
    this.color = color;
    this.blocksMove = blocksMove;
    this.renderOrder = renderOrder;
  }
```

Update `src/entity/actor/actor.js` too:
```js
import {RenderOrders} from '../../lib/renderOrders';

export default class Actor extends Entity {
  constructor(name, x, y, char, color, components, blocksMove = true) {
    const renderOrder = RenderOrders.ACTOR;

    super(name, x, y, char, color, blocksMove, renderOrder);

    const {
      combat,
      ai,
    } = {...components};
```

We'll also need to update `killActor.js` to change the render order of an actor after it dies.

```js
import {colors} from '../../ui/colors';
import {EngineModes} from '../../engine/engineModes';
import {RenderOrders} from '../../ui/renderOrders';

export const killPlayer = function(actor) {
  actor.char = '%';
  actor.color = colors.DARK_RED;
  actor.name = `The ${actor.name}'s corpse`;
  actor.renderOrder = RenderOrders.CORPSE;

  return ['The Player is dead! Game over!', EngineModes.PLAYER_DEAD];
};

export const killActor = function(actor) {
  const actorName = actor.name.slice(0, 1).toUpperCase() + actor.name.slice(1);
  const message = `${actorName} is dead!`;

  actor.char = '%';
  actor.color = colors.DARK_RED;
  actor.blocksMove = false;
  actor.combat = null;
  actor.ai = null;
  actor.name = `The ${actor.name}'s corpse`;
  actor.renderOrder = RenderOrders.CORPSE;

  return message;
};
```

Finally, update `renderMap.js` to sort the entities by render order before drawing them.
```js
  // Draw entities
  const renderOrderedEntities = entities.sort( (a, b) => a.renderOrder - b.renderOrder );
  for( const entity of renderOrderedEntities ) {
    const isVisible = fovMap.indexOf(`${entity.x},${entity.y}`) !== -1;
    if( isVisible ) {
      mapDisplay.draw(entity.x, entity.y, entity.char, entity.color);
    }
  }
```

The bug should now be fixed - after a monster dies, its corpse will no longer obscure the player or any living monster that moves onto its tile.

That was quite a post! We now have a working combat system, and our game is becoming a lot more fun to test. The biggest problem now is that our messages describing what's happening in the game are still only appearing in the console instead of being printed in screen. We'll tackle that in the [next post](), along with a lot of other UI improvements.

The finished code for this post can be viewed or cloned on [github]().

An in-browser demo of the code for the end of this post can be viewed [here]().

If you're interested in learning more about ECS in Roguelikes, here are some youtube lectures by accomplished roguelike developers on the topic:
* "_There Be Dragons: Entity Component Systems for Roguelikes_" by Thomas Biskup of ADOM
* "_Is There More to Game Architecture than ECS?_" by Bob Nystrom, author of "Game Programming Patterns", and the open source roguelikes [Amaranth]() and [Hauberk]()



