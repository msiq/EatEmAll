const Game = require('./src/server/GameClass.js');
const GameServer = require('./src/server/GameServer.js');
const Abilities = require('./src/ecs/Abilities.js');
const Entity = require('./src/ecs/Entity.js');
const Shapes = require('./src/shared/Shapes.js');
const { BaseGameState, GameStateMachine } = require('./src/fsm/GameState.js');
const { BasePlayerState, PlayerStateMachine } = require('./src/fsm/PlayerState.js');
const { Rectangle, Quadtree } = require('./src/physics/Quadtree.js');

module.exports = {
    Game,
    GameServer,
    Abilities,
    Entity,
    Shapes,
    BaseGameState,
    GameStateMachine,
    BasePlayerState,
    PlayerStateMachine,
    Rectangle,
    Quadtree
};
