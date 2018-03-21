const UUID = require('node-uuid');
const Shapes = require('./Shapes.js');
const config = require('./config.js');

const Abilities = require('./Abilities.js');

var Entity = function(name = 'noname') {
    this.id = UUID();
    this.name = name;
    this.socket_id = false;
    this.type = '';

    this.grounded = false;

    this.actions = [];
    // Array.pop will remove this action once its applied
    this.addAction = function(action, params = {}) {
        this.actions.push({ name: action, params: params });
    };

    this.abilities = {};
    // this.abilities[Abilities.Orientation.name] = new Abilities.Orientation();
    this.has = (ability) => {
        return this.abilities.hasOwnProperty(ability) ? this.abilities[ability] : false;
    }

    this.attach = function(ability) {
        if (ability.constructor.name === 'Ability') {
            this.abilities[ability.name] = ability;
        }

        if (ability.name == 'body') {
            this.attach(new Abilities.Aabb(ability));
        }
    }

    this.distance = function(entity) {
        let thisPos = this.abilities.position.pos;
        let enPos = entity.abilities.position.pos;

        console.log(thisPos.x, enPos.x, thisPos.y, enPos.y, 'ÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖ');
        let deltaX = thisPos.x - enPos.x;
        let deltaY = thisPos.y - enPos.y;



        console.log((deltaX * deltaY), (deltaX * deltaY), '---------------------------------------------------------::::::');
        return {
            x: deltaX,
            y: deltaY,
            z: 0,
            mag: Math.sqrt((deltaX * deltaX) + (deltaY * deltaY))
        };
    }

    this.update = () => {

        // if (this.debounce(1000)) {
        //     let vel = this.abilities.velocity.velocity;
        //     this.abilities.velocity.velocity = Object.assign({}, vel, {
        //         x: this.applyEase(vel.x, config.player.ease),
        //         y: this.applyEase(vel.y, config.player.ease),
        //         z: this.applyEase(vel.z, config.player.ease),
        //     });
        // }
    };

    // this.applyEase = function(val, ease) {
    //     if (val !== 0) {
    //         if (val > 0) {
    //             val = val - ease;
    //         } else {
    //             val = Math.abs(val) - ease;
    //             if (val < 0) {
    //                 val = 0;
    //             } else {
    //                 val = val * -1;
    //             }
    //         }
    //     }

    //     return Number(val.toFixed(2));
    // }
    // this.limit = function(value) {
    //     return (Math.abs(value) > 0) ? value : 0;
    // }

    // this.last = 0;
    // this.now = 0;
    // this.debounce = (wait) => {
    //     this.now = Date.now();
    //     let canCall = ((this.now - this.last) > wait) ? true : false;
    //     // console.log('-------------------------------------->', canCall, this.last, this.now);
    //     this.last = (canCall) ? Date.now() : this.last;

    //     return canCall;
    // }

    // this.createPlayer = function(name, shape, color = 'blue') {

    //     console.log(arguments);
    //     var player = new Entity(name);
    //     player.attach(new Abilities.Body(shape, color));

    //     return player;
    // }

    // this.createEnemy = function() {
    //     var enemy = new Entity();
    //     enemy.attach(new Abilities.Body());

    //     return enemy;
    // }
}


module.exports = exports = Entity;