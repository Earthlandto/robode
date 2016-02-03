window.Simulator = {};

Simulator.Env = {};


// define Simulator init valors
(function() {
    Simulator.World = null;
    // Simulator.ScaleWorld = 10; //initial
    Simulator.config = {
        //robode init config
        robodeIniX: 16,
        robodeIniY: 16,
        robodeW: 0.6,
        robodeH: 1,
        //world init config
        worldWidth: 640,
        worldHeight: 640,
        scaleWorldIni: 10,
        //sensor line config
        radiusInitSensorLine: 0.02,
        //line config
        lineInitThickness: 1
    };
    // Simulator.Robode = null;
    Simulator.Circuit = null;

})();


// define Environment and add/redefine some Box2d functions
(function() {
    // Define shorter Box2d names
    Simulator.Env.b2World = Box2D.Dynamics.b2World;
    Simulator.Env.b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
    Simulator.Env.b2Vec2 = Box2D.Common.Math.b2Vec2;
    Simulator.Env.b2BodyDef = Box2D.Dynamics.b2BodyDef;
    Simulator.Env.b2Body = Box2D.Dynamics.b2Body;
    Simulator.Env.b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
    Simulator.Env.b2Fixture = Box2D.Dynamics.b2Fixture;
    // Simulator.Env.b2MassData = Box2D.Collision.Shapes.b2MassData;
    Simulator.Env.b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    Simulator.Env.b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
    Simulator.Env.b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;
    Simulator.Env.b2ContactListener = Box2D.Dynamics.b2ContactListener;
    // Simulator.Env.b2DestructionListener = Box2D.Dynamics.b2DestructionListener;



    // Class redefinitions
    Simulator.Env.b2BodyDef.prototype.setName = function(name) {
        this.userData = name;
    };

    Simulator.Env.b2Body.prototype.setName = function(name) {
        this.m_userData = name;
    };

    Simulator.Env.b2Body.prototype.getName = function() {
        return this.GetUserData();
    };

    Simulator.Env.b2Fixture.prototype.getBodyName = function() {
        return this.GetBody().getName();
    };

    Simulator.Env.b2World.prototype.lines = [];

    Simulator.Env.b2World.prototype.lineThickness = Simulator.config.lineInitThickness;

    // Simulator.Env.b2World.prototype.getLines = function() {
    //     return this.lines;
    // };
    Simulator.Env.b2World.prototype.addLine = function(line) {
        this.lines.push(line);
    };

    Simulator.Env.b2World.prototype.getDistanceCollitionLine = function() {
        return this.lineThickness + Simulator.config.radiusInitSensorLine * Simulator.World.getWorldScale();
    };

    Simulator.Env.b2World.prototype.configDraw = function(myDebugDraw, myCanvas) {

        myDebugDraw.SetSprite(document.getElementById(myCanvas).getContext("2d"));
        myDebugDraw.SetDrawScale(Simulator.config.scaleWorldIni);
        myDebugDraw.SetFillAlpha(0.3);
        myDebugDraw.SetLineThickness(Simulator.config.lineInitThickness);
        myDebugDraw.SetFlags(Simulator.Env.b2DebugDraw.e_shapeBit | Simulator.Env.b2DebugDraw.e_jointBit);
        Simulator.World.SetDebugDraw(myDebugDraw);
    };

    Simulator.Env.b2World.prototype.setWorldScale = function(newScale) {

        var myscale = newScale.clamp(5, 30);
        //define the new scale
        this.m_debugDraw.SetDrawScale(myscale);
        //change canvas size to wrap the world into it
        var mycanvas = this.m_debugDraw.m_ctx.canvas;
        mycanvas.width = (Simulator.config.worldWidth * myscale) / Simulator.config.scaleWorldIni;
        mycanvas.height = (Simulator.config.worldHeight * myscale) / Simulator.config.scaleWorldIni;
        //change line thickness
        this.lineThickness *= myscale;
    };

    Simulator.Env.b2World.prototype.getWorldScale = function() {
        return this.m_debugDraw.m_drawScale;
    };

    Simulator.Env.b2World.prototype.destroyAll = function() {
        // this.destroyContacts();
        this.destroyJoints();
        this.destroyBodies();
    };

    // Simulator.Env.b2World.prototype.destroyContacts = function() {
    //
    //     var contact = this.GetContactList();
    //     var contact_next;
    //     while (contact) {
    //         contact_next = contact.m_next;
    //         contact.Reset();
    //         contact = contact_next;
    //     }
    // };

    Simulator.Env.b2World.prototype.destroyJoints = function() {

        var joint = this.GetJointList();
        var joint_next;
        while (joint) {
            joint_next = joint.m_next;
            this.DestroyJoint(joint);
            joint = joint_next;
        }
    };

    Simulator.Env.b2World.prototype.destroyBodies = function() {

        var body_next, body = this.GetBodyList();
        while (body) {
            var fixture_next, fixture = body.GetFixtureList();
            while (fixture) {
                fixture_next = fixture.GetNext();
                body.DestroyFixture(fixture);
                fixture = fixture_next;
            }
            body_next = body.GetNext();
            this.DestroyBody(body);
            body = body_next;
        }
    };

    Simulator.Env.b2World.prototype.clearCanvas = function() {
        var ctx = this.m_debugDraw.m_ctx;
        var mycanvas = ctx.canvas;
        ctx.clearRect(0, 0, mycanvas.width, mycanvas.height);
    };

    Number.prototype.clamp = function(min, max) {
        return Math.min(Math.max(this, min), max);
    };


    window.addEventListener("keyup", function(e) {
        if (!Simulator.World) return;
        switch (e.keyCode) {
            case 38: // UP
                Simulator.World.setWorldScale(Simulator.World.getWorldScale() + 0.5);
                break;
            case 40: // UP
                Simulator.World.setWorldScale(Simulator.World.getWorldScale() - 0.5);
                break;
        }
    });


})();


(function() {


    function Sensor(points, name, bodyAttached, /*optional*/ posOffsetX, /*optional*/ posOffsetY) {
        posOffsetX = posOffsetX || 0;
        posOffsetY = posOffsetY || 0;

        this.body = null;
        this.getPosition = function() {
            return {
                x: this.body.GetWorldCenter().x,
                y: this.body.GetWorldCenter().y
            };
        };

        this.name = "sensor" + name;

        var positionIni = {
            x: bodyAttached.GetWorldCenter().x + posOffsetX,
            y: bodyAttached.GetWorldCenter().y + posOffsetY
        };

        //create our sensor (box2d body)

        var bodyDef = new Simulator.Env.b2BodyDef();
        bodyDef.type = Simulator.Env.b2Body.b2_dynamicBody;
        bodyDef.position.Set(positionIni.x, positionIni.y);
        bodyDef.setName(this.name);
        this.body = Simulator.World.CreateBody(bodyDef);


        var fixDef = new Simulator.Env.b2FixtureDef();
        fixDef.isSensor = true;
        fixDef.density = 40; //TODO:remove?
        fixDef.friction = 1;
        fixDef.restitution = 0;


        //define the shape
        if (points.length == 1) {
            // line sensor
            fixDef.shape = new Simulator.Env.b2CircleShape(Simulator.config.radiusInitSensorLine);
        } else {
            // external sensor
            fixDef.shape = new Simulator.Env.b2PolygonShape();
            var vPoints = [];
            points.forEach(function(elem, index, array) {
                vPoints[index] = new Simulator.Env.b2Vec2(elem.x, elem.y);
            });
            fixDef.shape.SetAsArray(vPoints, vPoints.length);
        }
        this.body.CreateFixture(fixDef);

        // create the joint to body attached
        var jointdef = new Simulator.Env.b2RevoluteJointDef();
        jointdef.Initialize(bodyAttached, this.body, bodyAttached.GetWorldCenter());
        jointdef.collideConnected = false;
        jointdef.enableMotor = false;
        jointdef.enableLimit = (points.length === 1);
        jointdef.maxMotorTorque = Number.MAX_SAFE_INTEGER;
        Simulator.World.CreateJoint(jointdef);
    }

    Simulator.Env.b2Fixture.prototype.nCollided = 0;

    Simulator.Env.b2Fixture.prototype.addCollition = function() {
        this.nCollided++;
    };

    Simulator.Env.b2Fixture.prototype.removeCollition = function() {
        this.nCollided--;
    };

    Sensor.prototype.setAngle = function(angle) {
        this.body.SetAngle(angle);
    };
    Sensor.prototype.setAngularVelocity = function(angVel) {
        this.body.SetAngularVelocity(angVel);
    };
    Sensor.prototype.setLinearVelocity = function(linVel) {
        this.body.SetLinearVelocity(linVel);
    };


    Simulator.Sensor = Sensor;

})();


// create the circuit object and we add to our Simulator
(function() {
    function Circuit(worldWidth, worldHeight) {
        this.width = worldWidth;
        this.height = worldHeight;
    }



    Circuit.prototype.craft = function() {

        //===create world borders===================================================================
        var scale = Simulator.config.scaleWorldIni;

        var bodyDef = new Simulator.Env.b2BodyDef();
        bodyDef.type = Simulator.Env.b2Body.b2_staticBody;
        bodyDef.setName("border");
        var fixDef = new Simulator.Env.b2FixtureDef();
        fixDef.shape = new Simulator.Env.b2PolygonShape();

        // lower border
        fixDef.shape.SetAsBox(this.width / scale, 0.01);
        bodyDef.position.Set((this.width / scale) / 2, this.height / scale);
        Simulator.World.CreateBody(bodyDef).CreateFixture(fixDef);

        // top border
        bodyDef.position.Set((this.width / scale) / 2, 0);
        Simulator.World.CreateBody(bodyDef).CreateFixture(fixDef);

        // right border
        fixDef.shape.SetAsBox(0.01, this.height / scale);
        bodyDef.position.Set(this.width / scale, (this.height / scale) / 2);
        Simulator.World.CreateBody(bodyDef).CreateFixture(fixDef);

        // left border
        bodyDef.position.Set(0, (this.height / scale) / 2);
        Simulator.World.CreateBody(bodyDef).CreateFixture(fixDef);


        //Create circuit...

        Simulator.World.addLine(new Bezier(0, 0, 100, 100, 500, 500));
        Simulator.World.addLine(new Bezier(0, 0, 0, 0, 0, 500));

        // ...end create circuit.
    };
    Simulator.Circuit = new Circuit(Simulator.config.worldWidth, Simulator.config.worldHeight);
})();



//add class Circuit
