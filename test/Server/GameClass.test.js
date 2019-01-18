/* eslint-env mocha */
const { expect } = require('chai');
const GameClass = require('../../Server/GameClass');

describe('getEntityById', () => {
  const Game = new GameClass();
  it('Should return false on empty', () => {
    expect(Game.getEntityById(123)).to.be.equal(false);
  });
  it('Should return object if found', () => {
    Game.addEntityType('mons');
    const entity = { id: 123 };
    Game.addEntity(entity, 'mons');
    expect(Game.getEntityById(123)).to.be.equal(entity);
  });
});

describe('getEntities', () => {
  const Game = new GameClass();
  it('Should return empty [] if not found', () => {
    expect(Game.getEntities('mons')).to.deep.equal([]);
  });
  it('Should return [] if found', () => {
    Game.addEntityType('mons');
    const entity = { id: 123 };
    Game.addEntity(entity, 'mons');
    expect(Game.getEntities('mons')).to.eql([entity]);
  });
});
