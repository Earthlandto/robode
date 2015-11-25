var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

function createCar() {

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(35, 30);
    bodyDef.linearDamping = 8;
    bodyDef.angularDamping = 8;
    bodyDef.allowSleep = true;

    var fixDef = new b2FixtureDef;
    fixDef.density = 30;
    fixDef.friction = 1;
    fixDef.restitution = 0;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(.5, .75);
    //CAR BODY
    var car = world.CreateBody(bodyDef);
    car.CreateFixture(fixDef);
    //WHEELS
    var xx = car.GetWorldCenter().x;
    var yy = car.GetWorldCenter().y;
    var fr = wheel(xx + .5, yy); //front right wheel
    var fl = wheel(xx - .5, yy); //front left wheel

    var jfr = revJoint(car, fr); // Joint between car body and front right wheel
    var jfl = revJoint(car, fl); // Joint between car body and front left wheel

    var rspeed = 0;
    var lspeed = 0;
    var WHEEL_SPEED = 50;

    var ENGINE_SPEED = 500;
    $(window).keydown(function(e) {
        var code = e.keyCode;

        if (code == 87) //LEFT WHEEL (front) -> key W
            lspeed = WHEEL_SPEED;
        if (code == 69) // RIGHT WHEEL (front) -> key E
            rspeed = WHEEL_SPEED;
        if (code == 83) // LEFT WHELL (back) -> key S
            lspeed = -WHEEL_SPEED;
        if (code == 68) // RIGHT WHELL (back) -> key X
            rspeed = -WHEEL_SPEED;
        // if (code == 70) // STOP -> key F
        //     stopMovement();
    });

    $(window).keyup(function(e) {
        var code2 = e.keyCode;
        if (code2 == 87) //LEFT WHEEL (front) -> key W
            lspeed = 0;
        if (code2 == 69) // RIGHT WHEEL (front) -> key E
            rspeed = 0;
        if (code2 == 83) // LEFT WHELL (back) -> key S
            lspeed = 0;
        if (code2 == 68) // RIGHT WHELL (back) -> key X
            rspeed = 0;
        if (code2 == 70) // STOP -> key F
            stopMovement();
    });

    var p1r = new b2Vec2();
    var p2r = new b2Vec2();
    var p3r = new b2Vec2();

    var p1l = new b2Vec2();
    var p2l = new b2Vec2();
    var p3l = new b2Vec2();

    function wheel(x, y) {

        var bodyDef = new b2BodyDef;
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(x, y);
        var fixDef = new b2FixtureDef;
        fixDef.density = 30;
        fixDef.friction = 1;
        fixDef.restitution = 0;
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(.2, .4);
        fixDef.isSensor = true;
        var wheel = world.CreateBody(bodyDef);
        wheel.CreateFixture(fixDef);
        return wheel;
    }

    // Revolute Joints
    function revJoint(body1, wheel) {
        var revoluteJointDef = new b2RevoluteJointDef();
        revoluteJointDef.Initialize(body1, wheel, wheel.GetWorldCenter());
        revoluteJointDef.motorSpeed = 0;
        revoluteJointDef.maxMotorTorque = 100;
        revoluteJointDef.enableMotor = true;
        revoluteJoint = world.CreateJoint(revoluteJointDef);
        return revoluteJoint;
    }

    this.updateMovement = function() {

        cancelVel(fr);
        cancelVel(fl);

        if (rspeed != 0) {

            p1r = fr.GetWorldCenter();
            p2r = fr.GetWorldPoint(new b2Vec2(0, 1));
            p3r.x = (p2r.x - p1r.x) * ENGINE_SPEED;
            p3r.y = (p2r.y - p1r.y) * ENGINE_SPEED;
        } else {
            p3r = new b2Vec2(0, 0);
        }

        if (lspeed != 0) {
            p1l = fl.GetWorldCenter();
            p2l = fl.GetWorldPoint(new b2Vec2(0, 1));
            p3l.x = (p2l.x - p1l.x) * ENGINE_SPEED;
            p3l.y = (p2l.y - p1l.y) * ENGINE_SPEED;
        } else {
            p3l = new b2Vec2(0, 0);
        }

        applyForces();

    }

    function stopMovement() {
        console.log("STOP");

        car.SetLinearVelocity(new b2Vec2(0, 0));
        car.SetAngularVelocity(0);
        car.SetAwake(false);


    }


    function applyForces() {

        // forward
        if (lspeed > 0) {
            fl.ApplyForce(new b2Vec2(-p3l.x, -p3l.y), fl.GetPosition());
        }

        if (rspeed > 0) {
            fr.ApplyForce(new b2Vec2(-p3r.x, -p3r.y), fr.GetPosition());
        }

        // backward
        if (lspeed < 0) {
            fl.ApplyForce(new b2Vec2(p3l.x, p3l.y), fl.GetPosition());
        }

        if (rspeed < 0) {
            fr.ApplyForce(new b2Vec2(p3r.x, p3r.y), fr.GetPosition());
        }
    }

    function cancelVel(wheel) {

        var aaaa = new b2Vec2();
        var bbbb = new b2Vec2();
        var newlocal = new b2Vec2();
        var newworld = new b2Vec2();
        aaaa = wheel.GetLinearVelocityFromLocalPoint(new b2Vec2(0, 0));
        bbbb = wheel.GetLocalVector(aaaa);
        newlocal.x = -bbbb.x;
        newlocal.y = bbbb.y;
        newworld = wheel.GetWorldVector(newlocal);
        wheel.SetLinearVelocity(newworld);
    }
};