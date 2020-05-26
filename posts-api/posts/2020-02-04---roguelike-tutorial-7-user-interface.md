---
title: "Roguelike Tutorial 7 - User Interface"
date: 20200204
draft: false
slug: "roguelike-tutorial-7-user-interface"
category: "Roguelike Tutorials"
tags:
  - "JavaScript"
  - "Roguelike Tutorials"
description: ""
---

In the [previous post]() of this tutorial series, we added the combat system. This included logging messages describing any attacks that were made, how much damage was dealt, and if any characters were killed as a result.

Unfortunately, those messages are currently only being logged to the JavaScript console, leaving a normal user to wonder what in the world is going on. We need a UI! In this post, we'll add a message log, a health bar, and other user interface improvements.

## Cleaning up `Engine.constructor()`

Let's grab the code from `Engine.constructor()` that initializes the variables describing the state of our game, like the entities and level, and put it in it's own file `src/engine/initNewGame.js`, with these contents:

```js
import {setRNGSeed} from '../lib/randomUtil';
import Combat from '../entity/actor/components/combat';
import Actor from '../entity/actor/actor';
import {colors} from '../ui/colors';
import Level from '../level/level';
import {initFovComputer, computeFov} from '../lib/fov';
import {EngineModes} from './engineModes';
import {constants} from '../lib/constants';

export const initNewGame = function() {
  // init and log rot.js random number generator seed for debugging
  setRNGSeed();  

  // init player
  const combat = new Combat(30, 2, 5);
  const player = new Actor('Player', 0, 0, '@', colors.WHITE, { combat });
  const entities = [player];    

  // init level
  const level = new Level(constants.MAP_WIDTH, constants.MAP_HEIGHT);
  level.generate(player, entities);  

  // init player's FOV
  const fov = {};
  fov.radius = 10;
  initFovComputer(level);
  fov.map = computeFov(player.x, player.y, fov.radius);
  fov.needsRecompute = true;

  const engineMode = EngineModes.PLAYER_TURN;

  return [
    player,
    entities,
    level,
    fov,
    engineMode,
  ];
};
```

Since we're going to be continue making additions to the user interface as our project progresses, let's make a special function in it's own file where all the pieces of the UI are listed and initialized. Create the file `src/ui/initUi.js`. For now, it should have the following code:

```js
import * as ROT from 'rot-js';
import {constants} from '../lib/constants';

export const initUi = function() {
  
  // init rot.js <canvas> display for level map
  const mapDisplay = new ROT.Display({
    width: constants.MAP_WIDTH,
    height: constants.MAP_HEIGHT,
    fontFamily: 'metrickal, monospace',
    fontSize: 16,
  }); 
  document.querySelector('#root').appendChild(mapDisplay.getContainer());

  return [
    mapDisplay,
  ];
};
```

Now update the import list and constructor method in `engine.js` to use these new initialization files.

```js
import {addInputListeners} from '../ui/addInputListeners';
import Actor from '../entity/actor/actor';
import {renderMap} from '../ui/renderMap';
import {computeFov} from '../lib/fov';
import {getBlockingActorAtTile} from '../level/level';
import {EngineModes} from './engineModes';
import {killPlayer, killActor} from '../entity/actor/killActor';
import {initNewGame} from './initNewGame';
import {initUi} from '../ui/initUi';

export default class Engine {
  constructor() {
    this.addInputListeners = addInputListeners.bind(this);

    [
      this.mapDisplay,
    ] = initUi();

    [
      this.player,
      this.entities,
      this.level,
      this.fov,
      this.engineMode,
    ] = initNewGame()

    this.addInputListeners();

    this.update();
  }
```

Oh glorious clean code. Our Engine constructor is now much easier to read. All the important properies pertaining to the UI and game logic are clearly listed, while the details of their configuration are tucked away into their corresponding methods. Now that we have a cleaner foundation to build upon, we can move forward with adding the next piece of user interface.

## Message Log
The most pressing addition to the UI at the moment is a message log that renders combat messages onto the web page instead of just logging them in the developer console.

### Add message log data to the game engine state

To achieve this, we need to store a list of messages in the game engine. We'll create a `MessageLog` class for this purpose, which aggregates `Message` data objects.

Create a file `src/lib/messageLog.js` with the following code:
```js
import {colors} from '../ui/colors';

export class Message {
  constructor(text, color=colors.WHITE) {
    this.text = text;
    this.color = color;
  }
}

export class MessageLog {
  constructor( messages = [] ) {
    this.messages = [];
  }

  add(message) {
    this.messages.push( new Message(message.text, message.color) );
  }
}
```

Before we can add messages to the log, we need to create it. Go back to the `initNewGame.js` file, and import the `MessageLog` class.
```js
import {MessageLog} from '../lib/messageLog';
```

Now instantiate and return a `MessageLog` instance. The end of the `initNewGame.js` file should look like this:
```js
  fov.needsRecompute = true;

  // init messageLog 
  const messageLog = new MessageLog();

  const engineMode = EngineModes.PLAYER_TURN;

  return [
    player,
    entities,
    level,
    fov,
    messageLog,
    engineMode,
  ];
};
```

Back in `engine.js`, update the constructor method to add the returned `MessageLog` instance as a property on to the `Engine`.
```js
    [
      this.player,
      this.entities,
      this.level,
      this.fov,
      this.messageLog,
      this.engineMode,
    ] = initNewGame()
```

Now that the MessageLog is attached to our engine, we'll turn our attention to the messages themselves. At the moment, our messages are just text strings that get created in `combat.js` and `killActor.js`, and returned to the `Engine.update()` method as part of some turn results, where they are then logged to the console. Let's go through `combat.js` and `killActor.js` and replace these plain text strings with instances of our new `Message` object.

In `combat.js`, import `Message` at the top of the file:
```js
import {Message} from '../../../lib/messageLog';
```


Now update the `Combat.attack()` method to look like this:
```js
  attack(target) {
    let results = [];

    const damage = this.power - target.combat.defense;
    
    if( damage > 0 ) {
      results = [...results,  ...target.combat.takeDamage(damage)];
      results.push({ message: new Message(`The ${this.owner.name} attacks the ${target.name}, dealing ${damage} damage.`) });
    } else {
      results.push({ message: new Message(`The ${this.owner.name} attacks the ${target.name}, but does no damage.`) });
    }

    return results;
  }
```

Next we'll update `killActor.js`. Import the Message class up top:
```js
import {Message} from '../../lib/messageLog';
```

Because the death of a player or monster is an important message, we'll want to color it. A dark, "blood" red seems like an appropriate color choice. Update the `killPlayer` and `killActor` functions like so:
```js
export const killPlayer = function(player) {
  player.char = '%';
  player.color = colors.DARK_RED;
  player.renderOrder = RenderOrders.CORPSE;
  const message = new Message(`The ${player.name} is dead!`, colors.DARK_RED);

  return [message, EngineModes.PLAYER_DEAD];
};

export const killActor = function(actor) {
  const message = new Message(`The ${actor.name} is dead!`, colors.DARK_RED);

  actor.char = '%';
  actor.color = colors.DARK_RED;
  actor.blocksMove = false;
  actor.combat = null;
  actor.ai = null;
  actor.name = `${actor.name} corpse`;
  actor.renderOrder = RenderOrders.CORPSE;

  return message;
};
```

Now that our turn result functions are returning proper message objects to `Engine.update()`, from there we need to add them to the message log. In `engine.js`, simply replace any lines that read:
```js
console.log(message);
```
with 
```js
this.messageLog.add(message);
```

The `playerTurnResults` loop should now look like this:
```js
    // Handle player turn results
    for( const turnResult of playerTurnResults ) {
      let message = turnResult.message;
      const deadActor = turnResult.dead;

      if( message ) {
        this.messageLog.add(message);
      }
      if( deadActor ) {
        if( deadActor === this.player ) {
          [message, this.engineMode] = killPlayer(deadActor);
          this.messageLog.add(message);
          break; // no turn results are processed after the player dies
          
        } else {
          message = killActor(deadActor);
          this.messageLog.add(message);
        } 
      }
    }
```

The `enemyTurnResults` loop should now look like this:
```js
          for( const turnResult of enemyTurnResults ) {
            let message = turnResult.message;
            const deadActor = turnResult.dead;

            if( message ) {
              this.messageLog.add(message);
            }
            if( deadActor ) {
              if( deadActor === this.player ) {
                [message, this.engineMode] = killPlayer(deadActor);
                this.messageLog.add(message);
                break; // no turn results are processed after the player dies

              } else {
                message = killActor(deadActor);
                this.messageLog.add(message);
              } 
            }
```

### Rendering the message log with React

At this point, messages are being aggregated in a list attached to the engine, and we can start printing them to the screen. While we could create another rot.js `Display` object and use its `draw` method, displaying text on a web page is handled a lot better by HTML, so we're going to use React instead.

`React.render()` requires a target DOM node as a mount point to build HTML on to. Let's update our static html `public/index.html` file to add separate mount points for both the map and message log, and import a stylesheet.

Update the `<body>` of the document like so:
```js
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root" class="root">
      <div class="layout">
        <div id="map_mount"></div>
        <div id="message_log_mount"></div>
      </div>
    </div>
  </body>
```

Add some styles for the layout wrapper to `src/ui/app.css`:
```css
.layout {
  display: flex;
  flex-direction: column;
  width: 800px;
  background: #000;
}
```

Also, now that we have more elements on the web page than just the map, let's get rid of the default browser styles for margins, padding, etcetera by adding the file `src/lib/reset.css` with the following contents:
```css
/*
http://meyerweb.com/eric/tools/css/reset/
v2.0 | 20110126
License: none (public domain)
*/
html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed,
figure, figcaption, footer, header, hgroup,
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
}


/* HTML5 display-role reset for older browsers */
article, aside, details, figcaption, figure,
footer, header, hgroup, menu, nav, section {
  display: block;
}
body {
  line-height: 1;
}
ol, ul {
  list-style: none;
}
blockquote, q {
  quotes: none;
}
blockquote:before, blockquote:after,
q:before, q:after {
  content: '';
  content: none;
}
table {
  border-collapse: collapse;
  border-spacing: 0;
}


/* 
Paul Irish's `box-sizing: border-box` ftw
*/
html {
  box-sizing: border-box;
}
*, *:before, *:after {
  box-sizing: inherit;
}
```

Then add the import statement for the reset CSS to `src/index.js`. Make sure `app.css` is imported _after_ `reset.css`, or the Metrickal font won't be used for any HTML on the page.
```js
import './lib/reset.css';
import './ui/app.css';
```

Update `initUi.js` to select these new mount points, and return them to the engine. It should now look like this:
```js
export const initUi = function() {

  // init map's rot.js <canvas> display
  const mapDisplay = new ROT.Display({
    width: constants.MAP_WIDTH,
    height: constants.MAP_HEIGHT,
    fontFamily: 'metrickal, monospace',
    fontSize: 16,
  });
  document.querySelector('#map_mount').appendChild(mapDisplay.getContainer());

  const messageLogMount = document.querySelector('#message_log_mount');

  return [
    mapDisplay,
    messageLogMount,
  ];
};
```

Update the `Engine.constructor()` method to receive the `messageLogMount` as well:
```js
    [
      this.mapDisplay,
      this.messageLogMount,
    ] = initUi();
```

Now that we have a mount point for the message log, we need to write its render method.
Create a new file `src/ui/renderMessageLog.js` with the following contents:
```js
import React from 'react';
import ReactDOM from 'react-dom';
import {constants} from '../lib/constants';
import {colors} from './colors';

const renderMessageLog = function(messageLogMount, messages) {
  ReactDOM.render(
    <MessageLog
      messages={messages}
    />,
    messageLogMount
  );
}

const LOG_ROWS = 6;
const LOG_HEIGHT = LOG_ROWS * constants.CELL_HEIGHT;
const LOG_WIDTH = constants.MAP_WIDTH * constants.CELL_WIDTH;

class MessageLog extends React.Component {
  constructor(props) {
    super(props);
    this.ulRef = React.createRef();
  }
  componentDidUpdate() {
    this.ulRef.current.scrollTop = 99999999999; // Auto scroll down to show the latest message
  }
  render() {
    return (
      <div className='messageLog' style={styles.messageLog}>
        <ul ref={this.ulRef} style={styles.ul}>
          {this.props.messages.map( (message, i) =>
            <Message
              key={i}
              {...message}
            />   
          )}
        </ul>
      </div>
    );
  }
}

const Message = ({ text, color }) => (
  <li style={{ color: color }}>
    {text}
  </li>
);

const styles = {
  messageLog: {
    background: colors.BLACK,
    width: LOG_WIDTH,
    height: LOG_HEIGHT,
    marginTop: '-2px',
    display: 'flex',
    flexDirection: 'column',
  },
  ul: {
    listStyle: 'none',
    overflow: 'auto',
    paddingLeft: '4px',
  },
};

export {renderMessageLog};
```

Note that `renderMessageLog()` requires 2 parameters - the list of messages from `Engine.messageLog` and the DOM mount point that React build html for these message onto.

Add `CELL_WIDTH` and `CELL_HEIGHT` values to `src/lib/constants.js`:
```js
  CELL_WIDTH: 10,
  CELL_HEIGHT: 16,
```

Now, in `engine.js`, import the `renderMessageLog()` function up top.
```js
import {renderMessageLog} from '../ui/renderMessageLog';
```


Finally, call it toward the bottom of the `Engine.update()` method:
```js
    renderMap(this.mapDisplay, this.level, this.entities, this.fov.map);
    renderMessageLog(this.messageLogMount, this.messageLog.messages);
```

The message log code is now working! Test it out by moving the player into some monsters and confirm that combat messages are showing up below the map.

You can get rid of the ugly scroll bar on the right side of the message log by adding this code to `app.css`:
```css
.messageLog ul::-webkit-scrollbar {
  display: none;
}
```

## Add a health bar

Now that the player can see how much damage they are dealing and receiving in combat, the next thing they need is a way to keep track of how much health they have left.

Let's add a health bar. It will both display a colored in portion representing graphically what percentage of their health is left, and also explicitly print out the current `hp` and `max_hp` values. We're also going to code it as a reuseable `StatBar`, so that we can easily add another bar later for other stats like mana or stamina.

To implement the health bar, we can a lot the same structures we set up when adding the message log. 

We'll be using React to display the health bar, so the first step is to add a mount point for it in `public/index.html`:

```html
    <div id="root" class="root">
      <div class="layout">
        <div id="stat_bars_mount"></div>
        <div id="message_log_mount"></div>
      </div>
    </div>
```

Now in `initUi.js`, we'll grab this mount point and return it to the engine.

```js
  document.querySelector('#map_mount').appendChild(mapDisplay.getContainer());

  const statBarsMount = document.querySelector('#stat_bars_mount');
  const messageLogMount = document.querySelector('#message_log_mount');

  return [
    mapDisplay,
    messageLogMount,
    statBarsMount,
  ]
```

Accordingly, in the `constructor()` method in `engine.js`, we'll add a line to recieve the mount point:
```js
    [
      this.mapDisplay,
      this.messageLogMount,
      this.statBarsMount,
    ] = initUi();
```

Now we need to write the React code to display the health bar. We're going to encapsulate it in a function called `renderStatBars`, and it needs to be passed the mount point, and the `player` data object so that it can access any stat values we choose to use as the function grows. Create a new file `src/ui/renderStatBars.js` with the following code:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import {colors} from '../lib/colors';

const renderStatBars = function(statBarsMount, player) {
  ReactDOM.render(
    <div className='statBars' style={styles.statBars}>
      <StatBar 
        label='HP'
        currentVal={player.combat.hp}
        maxVal={player.combat.maxHp}
        fullColor={colors.RED}
        emptyColor={colors.DARKER_RED}      
      />
    </div>,
    statBarsMount
  );
};

class StatBar extends React.Component {
  render() {
    const {
      label,
      currentVal,
      maxVal,
      fullColor,
      emptyColor,
    } = {...this.props};

    const barWidth = 20;
    const fillWidth = parseInt(currentVal / maxVal * barWidth);
    
    const cellColors = [];
    for(let i = 0; i < barWidth; i++) {
      const color = (i >= fillWidth) ? emptyColor : fullColor; 
      cellColors.push(color);
    }

    return (
      <div className={'statBar ' + label} style={styles.statBar}>
        <div className='bar' style={styles.bar}>
          {cellColors.map( (color, i) => {
            return (
              <span className='cell' 
                key={i} style={{...styles.cell, backgroundColor: color}}></span>
            );
          })}
        </div>
        <div className='label' style={styles.label}>
          {label}: {currentVal} / {maxVal}
        </div>
      </div>
    );
  }  
}

const styles = {
  statBars: {
    marginTop: '4px',
    marginBottom: '4px',
  },
  statBar: {
    position: 'relative',
  },
  bar: {
    position: 'relative', 
    zIndex: 0,
  },
  label: {
    position: 'absolute',
    color: colors.WHITE,
    zIndex: 1,
    top: '2px',
    paddingLeft: '4px',
  },
  cell: {
    display: 'inline-block',
    height: '20px',
    width: '10px',
  },
};

export {renderStatBars};
```

Back in `engine.js`, import `renderStatBars()` up top:
```js
import {renderStatBars} from '../ui/renderStatBars';
```

And call it toward the end of `Engine.update()`:
```js

    if( this.fov.needsRecompute ) {
      this.fov.map = computeFov( this.player.x, this.player.y, this.fov.radius );
    }

    renderMap(this.mapDisplay, this.level, this.actors, this.fov, this.misc);
    renderMessageLog(this.messageLogMount, this.messageLog.messages);
    renderStatBars(this.statBarsMount, this.player);

    this.fov.needsRecompute = false;
  }
};
```

The health bar should now be displayed on the page, and we can reuse the `StatBar` class for other stats we choose to add later.

## Print a list of a entity names under the mouse cursor

One aspect of roguelikes that can be confusing for players is figuring out what all symbols represent. We'll add a "look list," which will be a new line below the map that prints the names of all the entities under the player's mouse cursor.

### Get data for list of entities under the mouse cursor

So, somehow, when the player's mouse is over the map, we need to detect what map tile the cursor is over, and come up with a list of entities whose current coordinates match that map tile. Convienently, rot.js's `Display` module has a built in method for this: [`eventToPosition()`(//ondras.github.io/rot.js/doc/classes/_display_display_.display.html#eventtoposition), which takes a mouse or touch event as its argument, and returns either an object containing the cell's coordinates, or `-1` if the mouse isn't over the map.

So, all we need to do is add a mouse event listener function, pass the mouse event it generates to `Display.eventToPosition()`, and store the returned position value in a new property on our engine.

Update the nominal function in `addInputListeners.js` like so:
```js
export const addInputListeners = function() {
  window.addEventListener('keydown', event => {
    const action = handleKeyDown(event.code);
    if( action ) {
      this.update(action);
    }
  });

  window.addEventListener('mousemove', event => {
    const [x, y] = this.mapDisplay.eventToPosition(event);
    const action = { 'MOUSE_MOVE': [x, y] };
    this.update(action);
  });
}
```

Now, whenever the player moves the mouse, we call `ENGINE.update()`, passing it a new `MOUSE_MOVE` action object whose payload is the coordinates we need.

So, in `engine.js`, in the `update()` method, add these lines to catch the new action and store the coordinates. 
```js
    if( 'MOUSE_MOVE' in action ) {
      this.misc.cellUnderMouse = action.MOUSE_MOVE;
    }
```
Place them after the `playerTurnResults` loop runs, and before the enemy turn is handled.

Also, back in `initNewGame.js`, we need to add `misc.cellUnderMouse` to the list of engine properties getting initialized.

```js
  const engineMode = EngineModes.PLAYER_TURN;
  // init misc variables
  const misc = {};
  misc.cellUnderMouse = [-1, -1];

  return [
    entities,
    player,
    level,
    fov,
    messageLog,
    engineMode,
    misc,
  ];
};
```

### Render the look list with React

The coordinates of the cell under the mouse is actually all we need to add to the engine state to render the look list - we can pass the coordinates and entities to the `renderLookList()` function we're about to write, and derive the list of names to print out just before rendering it. Also, we need to pass in the player's current field of vision to prevent the mouse from displaying a look list on map cells outside the player's line of sight.

Create the file `src/ui/renderLookList.js` with following contents:
```js
import React from 'react';
import ReactDOM from 'react-dom';
import { colors } from './colors';

const renderLookList = function(lookListMount, misc, fov, entities) {
  ReactDOM.render(
    <LookList
      entities={entities}
      fovMap={fov.map}
      cellUnderMouse={misc.cellUnderMouse}
    />,
    lookListMount
  );
};

class LookList extends React.Component {

  getListText(entities, fovMap, cellUnderMouse) {
    const [x, y] = [...cellUnderMouse];

    let listText = '\u00A0'; // code equivalent of &nbsp;

    // If mouse isn't over the map
    if( fovMap.indexOf(`${x},${y}`) === -1 ) { 
      return listText;
    }

    const entitiesHere = entities.filter( e => e.x === x && e.y === y );

    // If there are no entities in cellUnderMouse
    if (entitiesHere.length === 0) {
      return listText;
    }

    listText = '';
    entitiesHere.map( (e) => {
      listText+= e.name + ', ';
    });
    listText = listText.slice(0,-2); // delete last ', '

    return listText;
  }

  render() {
    const {
      entities,
      fovMap,
      cellUnderMouse,
    } = {...this.props};

    const listText = this.getListText(entities, fovMap, cellUnderMouse);

    return (
      <div className='LookList' style={styles.root}>{listText}</div>
    );
  }
}

const styles = {
  root: {
    color: colors.LIGHT_GRAY,
    paddingLeft: '4px',
  }
};

export {renderLookList};
```

We also need to update `public/index.html` with a mount point for the look list.
```html
    <div id="root" class="root">
      <div class="layout">
        <div id="map_mount"></div>
        <div id="look_list_mount"></div>
        <div id="stat_bars_mount"></div>
        <div id="message_log_mount"></div>
      </div>
    </div>
```

Then update `initUi.js` to return the mount point to the game engine.
```js
  const lookListMount = document.querySelector('#look_list_mount');
  const statBarsMount = document.querySelector('#stat_bars_mount');
  const messageLogMount = document.querySelector('#message_log_mount');

  return [
    mapDisplay,
    messageLogMount,
    statBarsMount,
    lookListMount,
  ]
};
```

Back in `engine.js`, update the call to `initUi()` in `Engine.constructor()` to include the look list mount point:
```js
    [
      this.mapDisplay,
      this.messageLogMount,
      this.statBarsMount,
      this.lookListMount,
    ] =
```

Also in the engine file, import the `renderLookList()` function.
```js
import {renderLookList} from '../ui/renderLookList';
```

Finally, add the call for it at the end of `Engine.update()`:
```js
    renderMap(this.mapDisplay, this.level, this.entities, this.fov, this.misc);
    renderMessageLog(this.messageLogMount, this.messageLog.messages);
    renderStatBars(this.statBarsMount, this.player);
    renderLookList(this.lookListMount, this.misc, this.fov, this.entities);

    this.fov.needsRecompute = false;
  }
};
```

The look list should now show up below the map when the player mouses over an entity within their field of view.

That wraps up the UI improvements we're tackling in this post, and makes for a pretty good stopping point. With the message log and health bar displaying, our combat system now makes sense, and we have a playable game. Also, with the look list, we've got an example of using the mouse to interact with the game, instead of just the keyboard. 

You can peruse the finished code for the end of this post on [github](), and check out a working demo of the game up to this point [here]().

In the [next post]() in this series, we'll be adding items and an inventory system.
