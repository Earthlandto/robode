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
    bodyDef.position.Set(12.5,10);
    var fixDef = new b2FixtureDef;
    fixDef.density = 30;
    fixDef.friction = .8;
    fixDef.restitution = 0.1;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(.5, 1.5);
    //CAR BODY
    var car = world.CreateBody(bodyDef);
    car.CreateFixture(fixDef);
    //WHEELS
    var xx = car.GetWorldCenter().x;
    var yy = car.GetWorldCenter().y;
    var fr = wheel(xx + .5, yy - 1); //front right wheel
    var fl = wheel(xx - .5, yy - 1); //front left wheel
    var rr = wheel(xx + .5, yy + 1); //rear right wheel
    var rl = wheel(xx - .5, yy + 1); //rear left wheel

    var jfr = revJoint(car, fr); // Joint between car body and front right wheel
    var jfl = revJoint(car, fl); // Joint between car body and front left wheel
    var jrr = revJoint(car, rr); // Joint between car body and rear right wheel
    var jrl = revJoint(car, rl); // Joint between car body and rear left wheel

    var maxSteeringAngle = 1;
    var steeringAngle = 0;
    var STEER_SPEED = 3;
    var mspeed;
    var sf, sb = false;
    var ENGINE_SPEED = 300;
    $(window).keydown(function(e) {
        var code = e.keyCode;
        if (code == 65) //LEFT
            steeringAngle = -maxSteeringAngle;
        if (code == 68) //RIGHT
            steeringAngle = maxSteeringAngle;
        if (code == 83) //FORWARD
            sf = true;
        if (code == 87) //BACKWARD
            sb = true;
    });
    $(window).keyup(function(e) {
        var code2 = e.keyCode;
        if (code2 == 68)
            steeringAngle = 0;
        if (code2 == 65)
            steeringAngle = 0;
        if (code2 == 87)
            sb = false;
        if (code2 == 83)
            sf = false;
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
        fixDef.friction = 10;
        fixDef.restitution = 0.1;
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
        revoluteJointDef.maxMotorTorque = 1000;
        revoluteJointDef.enableMotor = true;
        revoluteJoint = world.CreateJoint(revoluteJointDef);
        return revoluteJoint;
    }

    this.updateMovement = function() {
        mspeed = steeringAngle - jfl.GetJointAngle();
        jfl.SetMotorSpeed(mspeed * STEER_SPEED);
        mspeed = steeringAngle - jfr.GetJointAngle();
        jfr.SetMotorSpeed(mspeed * STEER_SPEED);

        cancelVel(fr);
        cancelVel(fl);
        cancelVel(rr);
        cancelVel(rl);
        p1r = fr.GetWorldCenter();
        p2r = fr.GetWorldPoint(new b2Vec2(0, 1));
        p3r.x = (p2r.x - p1r.x) * ENGINE_SPEED;
        p3r.y = (p2r.y - p1r.y) * ENGINE_SPEED;
        p1l = fl.GetWorldCenter();
        p2l = fl.GetWorldPoint(new b2Vec2(0, 1));
        p3l.x = (p2l.x - p1l.x) * ENGINE_SPEED;
        p3l.y = (p2l.y - p1l.y) * ENGINE_SPEED;
        if (sf == true)
            steerforward();
        if (sb == true)
            steerbackward();
    }

    function steerforward() {
        fr.ApplyForce(new b2Vec2(p3r.x, p3r.y), fr.GetWorldPoint(new b2Vec2(0, 0)));
        fl.ApplyForce(new b2Vec2(p3l.x, p3l.y), fl.GetWorldPoint(new b2Vec2(0, 0)));
    }

    function steerbackward() {
        fr.ApplyForce(new b2Vec2(-p3r.x, -p3r.y), fr.GetWorldPoint(new b2Vec2(0, 0)));
        fl.ApplyForce(new b2Vec2(-p3l.x, -p3l.y), fl.GetWorldPoint(new b2Vec2(0, 0)));
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