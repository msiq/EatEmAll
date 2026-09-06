let nextTankId = 1;

function createTank(game, options = {}) {
    const tank = new game.Entity(options.name || "Tank");
    tank.id = options.id || ("tank_" + (nextTankId++) + "_" + Math.random().toString(36).substr(2, 4));
    tank.name = options.name || "Tank";
    tank.type = "players";
    tank.socketId = options.socketId || null;
    tank.isBot = !!options.isBot;

    const x = options.x !== undefined ? options.x : (200 + Math.random() * 1200);
    const y = options.y !== undefined ? options.y : (200 + Math.random() * 800);
    const radius = 24;

    tank.attach(new game.abilities.Position(new game.shapes.Vect(x, y)));
    tank.attach(new game.abilities.Velocity(new game.shapes.Vect(0, 0)));
    tank.attach(new game.abilities.Body(new game.shapes.Circ(radius), options.color || (tank.isBot ? "#d97706" : "#22c55e")));
    tank.attach(new game.abilities.Orientation(new game.shapes.Vect(1, 0), 0));
    tank.attach(new game.abilities.Health(100));
    tank.attach(new game.abilities.Score());

    tank.ammo = 10;
    tank.maxAmmo = 10;
    tank.reloadTimer = 0;
    tank.shootCooldown = 0;
    tank.kills = 0;
    tank.turretAngle = options.angle || 0;
    tank.chassisAngle = options.angle || 0;
    tank.speed = 170;

    tank.custom = {
        ammo: tank.ammo,
        kills: tank.kills,
        turretAngle: tank.turretAngle,
        chassisAngle: tank.chassisAngle,
        isBot: tank.isBot
    };

    tank.updateCustom = function() {
        this.custom.ammo = this.ammo;
        this.custom.kills = this.kills;
        this.custom.turretAngle = this.turretAngle;
        this.custom.chassisAngle = this.chassisAngle;
        this.custom.isBot = this.isBot;
    };

    tank.fire = function() {
        if (this.shootCooldown > 0) return null;
        if (this.ammo <= 0) return null;

        const muzzleDist = radius + 12;
        const muzzleX = this.abilities.position.pos.x + Math.cos(this.turretAngle) * muzzleDist;
        const muzzleY = this.abilities.position.pos.y + Math.sin(this.turretAngle) * muzzleDist;

        this.ammo--;
        this.shootCooldown = 0.22;
        if (this.ammo <= 0) {
            this.reloadTimer = 1.4;
        }
        this.updateCustom();

        // Recoil push
        const recoil = 22;
        this.abilities.velocity.velocity.x -= Math.cos(this.turretAngle) * recoil;
        this.abilities.velocity.velocity.y -= Math.sin(this.turretAngle) * recoil;

        return {
            x: muzzleX,
            y: muzzleY,
            angle: this.turretAngle,
            speed: 680,
            damage: 25,
            ownerId: this.id,
            ownerName: this.name
        };
    };

    game.addEntity(tank, "players");
    return tank;
}

module.exports = { createTank };
