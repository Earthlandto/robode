window.Simulator = {};

Simulator.Env = {};


// define Simulator init valors
(function() {
    Simulator.World = null;
    Simulator.ScaleWorld = 10; //initial
    Simulator.robodeInit = {
        x: 16,
        y: 16,
        width: 0.6,
        height: 1
    };
    Simulator.Robode = null;
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

    Simulator.Env.b2World.prototype.configDraw = function(myDebugDraw, myCanvas) {

        myDebugDraw.SetSprite(document.getElementById(myCanvas).getContext("2d"));
        myDebugDraw.SetDrawScale(Simulator.ScaleWorld);
        myDebugDraw.SetFillAlpha(0.3);
        myDebugDraw.SetLineThickness(1.0);
        myDebugDraw.SetFlags(Simulator.Env.b2DebugDraw.e_shapeBit | Simulator.Env.b2DebugDraw.e_jointBit);
        Simulator.World.SetDebugDraw(myDebugDraw);
    };

    Simulator.Env.b2World.prototype.setWorldScale = function(newScale) {
        this.m_debugDraw.SetDrawScale(newScale);
    };

    Simulator.Env.b2World.prototype.getWorldScale = function() {
        return this.m_debugDraw;
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


})();


// create the circuit object and we add to our Simulator
(function() {
    function Circuit(worldWidth, worldHeight) {
        this.width = worldWidth;
        this.height = worldHeight;
    }



    Circuit.prototype.craft = function() {

        //===create world borders===================================================================
        var scale = Simulator.ScaleWorld;

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


        // ...end create circuit.
    };
    Simulator.Circuit = Circuit;
})();



//add class Circuit
