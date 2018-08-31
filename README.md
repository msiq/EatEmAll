# EAT EM ALL

Simple 2D multiplayer game engine based on nodejs and canvas...

## Architecture

### ECS: (no! no aws) Entity/Component system.

- Entity is called Entity()
- Components are called Abilities()

An Entity can have many Abilities.
All available Abilities are:

- Body
- Position
- Velocity
- Input
- Gravity\*\*
- Collidable
- Cor\*\*
- Mass
- String\*\*
- Orientation
- Acceleration
- AngularVelocity\*\*
- Torque\*\*
- Aabb
- Score
- Experience
- Rank
- Power
- Health
- Camera
- Viewport\*\*

\*\* work in progress

Subsystems

- input
- collision
- physics
- motion
- renderer
- score
- display

## Bugs and Issues

Most of things works ok

Except:

Collisions needs some realistic calculations

Use player states
Use Game states

Add some tests please...

## Creator

@msiq

## Copyright and License

Copyright 2016-2018 Code released under MyOwnLicense.
