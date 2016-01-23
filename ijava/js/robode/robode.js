function Robode(worker) {

    /****************************************************************************
     *                                                                           *
     *       CRAFT ROBODE                                                        *
     *                                                                           *
     *  It forms by: main body, two wheels, joints to the wheels and sensors.    *
     *  Sensors: two circular following lines sensors and four collision         *
     *   detections sensors.                                                     *
     *                                                                           *
     ****************************************************************************/
    var robot = null;

    //create wheels and joints wheels
    var fr = null; //front right wheel
    var fl = null; //front left wheel

    var jfr = null; // Joint between robot body and front right wheel
    var jfl = null; // Joint between robot body and front left wheel


    // CREATE SENSORS

    // external sensors
    var pointsBR = [{
        x: 0.1,
        y: 0.1
    }, {
        x: 0.5,
        y: 1.6
    }, {
        x: 1.5,
        y: 0.8
    }];


    var pointsBL = [{
        x: -0.1,
        y: 0.1
    }, {
        x: -0.5,
        y: 1.6
    }, {
        x: -1.5,
        y: 0.8
    }];


    var pointsTR = [{
        x: 0.1,
        y: -0.1
    }, {
        x: 0.5,
        y: -1.6
    }, {
        x: 1.5,
        y: -0.8
    }];


    var pointsTL = [{
        x: -0.1,
        y: -0.1
    }, {
        x: -0.5,
        y: -1.6
    }, {
        x: -1.5,
        y: -0.8
    }];

    // external sensors list
    var extSensors = [];

    // line sensors
    var sline_left = null; // line sensor left
    var sline_right = null; // line sensor right


    /****************************************************************************
     *                                                                           *
     *       Contact CONTROL                                                     *
     *                                                                           *
     *  Create a contact listener and we define preSolve, beginContact and       *
     *   endContact functions.                                                   *
     *  We have a robot part list to avoid this bodies in our begin/endContac    *
     *   function. Also, preSolve function cancels collisions with line objects. *
     *                                                                           *
     ****************************************************************************/

    var contactListener = new b2ContactListener();

    var robotparts = ['wheel', 'robot'];
    /*  The bodiesSensed variable stores the bodies sensed by each sensor.
    For each body, stores the number the fixtures that the sensor has sensed.
    Format:
        map {k, map{k', v}}
    Example:
        var bodiesSensed = {
            "sline-left": {
                line3: 10
            },
            "sensorTL": {
                border2: 3
            }
        };
    */
    var bodiesSensed = {};

    // If a sensor detects a line, the contac's enabled.
    contactListener.PreSolve = function(contact, oldManifold) {

        var udA = contact.GetFixtureA().getBodyName();
        var udB = contact.GetFixtureB().getBodyName();

        if (udA.substr(0, 4) == 'line' || udB.substr(0, 4) == 'line') {
            contact.SetEnabled(false);
        }
    };

    /*  The sensoring begins when a particular sensor perceive a body through
    one of its parts (fixtures). Then, beginContact function counts the aparitions
    of this body's fixtures. A contact begins when the aparitions number increments
    for zero to one and ends when the aparitions decrements to zero (in endContact
    function). */
    contactListener.BeginContact = function(contact) {

        var isSensorA = contact.GetFixtureA().IsSensor();
        var isSensorB = contact.GetFixtureB().IsSensor();

        if (isSensorA != isSensorB) { // a XOR b: is any fixture a sensor?

            var bodySensed, bodySensor;

            if (isSensorA) {
                bodySensor = contact.GetFixtureA().getBodyName();
                bodySensed = contact.GetFixtureB().getBodyName();
            } else {
                bodySensor = contact.GetFixtureB().getBodyName();
                bodySensed = contact.GetFixtureA().getBodyName();
            }

            // if it's a robot part, do nothing
            if (isRobotPart(bodySensed, robotparts))
                return;

            // Had the body sensed the body previously?
            if (bodiesSensed.hasOwnProperty(bodySensor)) {
                var listSensed = bodiesSensed[bodySensor];
                var sensedIndex = listSensed.findIndex(function(elem) {
                    return elem.hasOwnProperty(bodySensed);
                });

                //if the body is already sensed
                if (sensedIndex > -1) {
                    (listSensed[sensedIndex])[bodySensed] += 1;
                    if ((listSensed[sensedIndex])[bodySensed] === 1) {

                        console.log("BEGIN contact", bodySensor, bodySensed);
                    }

                } else {
                    // it's first time this sensor sensed this body
                    var bodysensedAux = {};
                    bodysensedAux[bodySensed] = 1;
                    listSensed.push(bodysensedAux);

                    console.log("BEGIN contact", bodySensor, bodySensed);
                }
            } else { // if it's the first time that the sensor perceive any body...
                bodiesSensed[bodySensor] = [];
                var newBodySensed = {};
                newBodySensed[bodySensed] = 1;
                bodiesSensed[bodySensor].push(newBodySensed);

                console.log("BEGIN contact", bodySensor, bodySensed);
            }

        }
    };

    contactListener.EndContact = function(contact) {

        var isSensorA = contact.GetFixtureA().IsSensor();
        var isSensorB = contact.GetFixtureB().IsSensor();

        if (isSensorA != isSensorB) { // a XOR b

            var bodySensed, bodySensor;

            if (isSensorA) {
                bodySensor = contact.GetFixtureA().getBodyName();
                bodySensed = contact.GetFixtureB().getBodyName();
            } else {
                bodySensor = contact.GetFixtureB().getBodyName();
                bodySensed = contact.GetFixtureA().getBodyName();
            }

            // if it's a robot part, do nothing
            if (isRobotPart(bodySensed, robotparts))
                return;

            // The body has already been sensed previously
            var listSensed = bodiesSensed[bodySensor];
            var sensedIndex = listSensed.findIndex(function(elem) {
                return elem.hasOwnProperty(bodySensed);
            });

            (listSensed[sensedIndex])[bodySensed] -= 1;
            if ((listSensed[sensedIndex])[bodySensed] < 1) {
                console.log("END contact", bodySensor, bodySensed);
            }
        }
    };


    /****************************************************************************
     *                                                                          *
     *       ROBOT BEHAVIOR                                                     *
     *                                                                          *
     *  Define and control the robot movement. It controls lateral velocity,    *
     *    also stop and update movement.                                        *
     *                                                                          *
     ****************************************************************************/

    //initial speed
    var stop = false;

    var rspeed = 0;
    var lspeed = 0;
    var WHEEL_SPEED = 50; // increment speed
    var ENGINE_SPEED = 300;

    var p1r = new b2Vec2();
    var p2r = new b2Vec2();
    var p3r = new b2Vec2();

    var p1l = new b2Vec2();
    var p2l = new b2Vec2();
    var p3l = new b2Vec2();



    /****************************************************************************
     *                                                                          *
     *       ROBODE API                                                         *
     *                                                                          *
     ****************************************************************************/

    var sandbox = worker ||  null;
    var running = false;

    // Init the world, robot, sensors and everuthing
    this.init = function() {

        running = true;

        world = new b2World(
            new b2Vec2(0, 0), //gravity
            true //allow sleep
        );

        //setup debug draw
        world.configDraw(new b2DebugDraw(), world, "mycanvas", scale);

        // robot main body
        robot = createRobot(16, 16, 0.6, 1);
        // wheels
        fr = createWheel(robot.GetWorldCenter().x + 0.53, robot.GetWorldCenter().y + 0.5);
        fl = createWheel(robot.GetWorldCenter().x - 0.53, robot.GetWorldCenter().y + 0.5);
        // joints wheels
        jfr = addWheelJoint(robot, fr);
        jfl = addWheelJoint(robot, fl);
        // external sensors
        extSensors.push(createExternalSensor(pointsTL, "TL", robot));
        extSensors.push(createExternalSensor(pointsTR, "TR", robot));
        extSensors.push(createExternalSensor(pointsBL, "BL", robot));
        extSensors.push(createExternalSensor(pointsBR, "BR", robot));
        //Line sensors
        sLine_left = createLineSensor('left', robot);
        sLine_right = createLineSensor('right', robot);
        // add collision listener
        world.SetContactListener(contactListener);

        // Create circuit
        craftCircuit();

        window.setInterval(function() {
            world.Step(
                1 / 60, //frame-rate
                10, //velocity iterations
                10 //position iterations
            );

            world.DrawDebugData();
            world.ClearForces();

            updateMovement();

        }, 1000 / 60);

    };

    this.end = function() {
        running = false;
    };

    /****************************************************************************
     *       AUXILIAR ROBODE API FUNCTIONS                                      *
     ****************************************************************************/

    function sendMessage(type, obj) {
        if (!sandbox) {
            console.log("Worker not exits.");
            return;
        }
        var message = {
            type: type,
            msg: obj
        };
        sandbox.postMessage(JSON.stringify(message));
    }


    /****************************************************************************
     *       ROBOT BEHAVIOR CONTROL FUNCTIONS                                   *
     ****************************************************************************/

    function updateMovement() {

        cancelVel(fr);
        cancelVel(fl);

        if (stop) {
            stopMovement();
        } else {

            p1r = fr.GetWorldCenter();
            p2r = fr.GetWorldPoint(new b2Vec2(0, 1));
            p3r.x = (p2r.x - p1r.x) * rspeed;
            p3r.y = (p2r.y - p1r.y) * rspeed;

            p1l = fl.GetWorldCenter();
            p2l = fl.GetWorldPoint(new b2Vec2(0, 1));
            p3l.x = (p2l.x - p1l.x) * lspeed;
            p3l.y = (p2l.y - p1l.y) * lspeed;

            applyForces();
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


    function stopMovement() {
        console.log("STOP");

        lspeed = 0;
        rspeed = 0;

        robot.SetLinearVelocity(new b2Vec2(0, 0));
        robot.SetAngularVelocity(0);

        extSensors.forEach(function(elem) {
            elem.SetLinearVelocity(new b2Vec2(0, 0));
            elem.SetAngularVelocity(0);
        });

        if (!robot.IsAwake()) {
            stop = false;
        }
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
            fl.ApplyForce(new b2Vec2(-p3l.x, -p3l.y), fl.GetPosition());
        }

        if (rspeed < 0) {
            fr.ApplyForce(new b2Vec2(-p3r.x, -p3r.y), fr.GetPosition());
        }

        var robotAV = robot.GetAngularVelocity();
        var robotLV = robot.GetLinearVelocity();

        fr.SetAngularVelocity(robotAV);
        fl.SetAngularVelocity(robotAV);

        extSensors.forEach(function(elem) {
            elem.SetAngularVelocity(robotAV);
            elem.SetAngle(robot.GetAngle());
        });
    }



    /****************************************************************************
     *       ROBOT COLLISION CONTROL FUNCTIONS                                  *
     ****************************************************************************/


    function isRobotPart(bodySensedName, elems2avoid) {

        for (var elem in elems2avoid) {
            if (elems2avoid[elem] == bodySensedName)
                return true;
        }
        return false;

    }


    /****************************************************************************
     *       ROBOT CREATION FUNCTIONS                                           *
     ****************************************************************************/

    function createRobot(posX, posY, width, height) {

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(posX, posY);
        bodyDef.linearDamping = 8;
        bodyDef.angularDamping = 8;

        var fixDef = new b2FixtureDef();
        fixDef.density = 40;
        fixDef.friction = 1;
        fixDef.restitution = 0;
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsBox(width, height);

        //robot BODY
        var robot = world.CreateBody(bodyDef);
        robot.setName("robot");

        robot.CreateFixture(fixDef);
        return robot;
    }

    function createWheel(x, y) {

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(x, y);
        var fixDef = new b2FixtureDef();
        fixDef.density = 40;
        fixDef.friction = 1;
        fixDef.restitution = 0;
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsBox(0.2, 0.4);
        fixDef.isSensor = false;
        var wheelBody = world.CreateBody(bodyDef);
        wheelBody.CreateFixture(fixDef);
        wheelBody.setName("wheel");
        return wheelBody;
    }


    // Revolute Joints
    function addWheelJoint(mybody, mywheel) {

        var revoluteJointDef = new b2RevoluteJointDef();
        revoluteJointDef.Initialize(mybody, mywheel, mywheel.GetWorldCenter());
        revoluteJointDef.motorSpeed = 0;
        revoluteJointDef.enableLimit = true;
        revoluteJointDef.maxMotorTorque = Number.MAX_SAFE_INTEGER;
        revoluteJointDef.enableMotor = true;
        return world.CreateJoint(revoluteJointDef);

    }

    function createExternalSensor(points, name, robot) {

        var robotPos = robot.GetWorldCenter();


        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(robotPos.x, robotPos.y);
        var fixDef = new b2FixtureDef();
        fixDef.density = 40;
        fixDef.friction = 1;
        fixDef.restitution = 0;
        fixDef.shape = new b2PolygonShape();

        var vPoints = [];
        points.forEach(function(elem, index, array) {
            vPoints[index] = new b2Vec2(elem.x, elem.y);
        });


        fixDef.shape.SetAsArray(vPoints, vPoints.length);
        fixDef.isSensor = true;

        var sensor = world.CreateBody(bodyDef);

        sensor.CreateFixture(fixDef);
        sensor.setName('sensor' + name);

        // make the joint
        var jointdef = new b2RevoluteJointDef();
        jointdef.Initialize(robot, sensor, robotPos);
        jointdef.collideConnected = false;
        jointdef.enableMotor = false;
        jointdef.enableLimit = false;
        jointdef.maxMotorTorque = Number.MAX_SAFE_INTEGER;
        world.CreateJoint(jointdef);

        return sensor;
    }


    function createLineSensor(name, robot) {

        var robotPos = robot.GetWorldCenter();
        var radius = 0.2;

        var position;
        switch (name) {
            case 'left':
                position = robotPos.x - radius + 0.01;
                break;
            case 'right':
                position = robotPos.x + radius - 0.01;
                break;
            default:
                position = robotPos;
        }

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(position, robotPos.y - 0.2);

        var fixDef = new b2FixtureDef();
        fixDef.density = 40;
        fixDef.friction = 1;
        fixDef.restitution = 0;
        fixDef.shape = new b2CircleShape(radius);
        fixDef.isSensor = true;

        var sline = world.CreateBody(bodyDef);
        sline.setName("sline-" + name);

        sline.CreateFixture(fixDef);

        // make the joint
        var jointdef = new b2RevoluteJointDef();
        jointdef.Initialize(robot, sline, robotPos);
        jointdef.collideConnected = false;
        jointdef.enableMotor = false;
        jointdef.enableLimit = true;

        world.CreateJoint(jointdef);

        return sline;
    }

}
