function Robode(worker) {

    var b2Vec2 = Simulator.Env.b2Vec2;
    var b2BodyDef = Simulator.Env.b2BodyDef;
    var b2Body = Simulator.Env.b2Body;
    var b2FixtureDef = Simulator.Env.b2FixtureDef;
    var b2Fixture = Simulator.Env.b2Fixture;
    var b2World = Simulator.Env.b2World;
    // var b2MassData = Simulator.Env.b2MassData;
    var b2PolygonShape = Simulator.Env.b2PolygonShape;
    var b2CircleShape = Simulator.Env.b2CircleShape;
    var b2DebugDraw = Simulator.Env.b2DebugDraw;
    var b2RevoluteJointDef = Simulator.Env.b2RevoluteJointDef;
    var b2ContactListener = Simulator.Env.b2ContactListener;

    // var world = Simulator.World;
    var initConfig = Simulator.config;
    var circuit = Simulator.Circuit;


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
    var sensorLL = null; // line sensor left
    var sensorLR = null; // line sensor right


    /****************************************************************************
     *                                                                           *
     *       Contact CONTROL                                                     *
     *                                                                           *
     *  Create a contact listener and we define preSolve, beginContact and       *
     *   endContact functions.                                                   *
     *  We have a robot part list to avoid this bodies in our begin/endContac    *
     *   function.                                                               *
     *                                                                           *
     ****************************************************************************/

    var contactListener = new b2ContactListener();

    var robotparts = ['wheel', 'robot'];

    /*  The sensoring begins when a particular sensor perceive a body through
    one of its parts (fixtures). Then, beginContact function counts the aparitions
    of this body's fixtures. A contact begins when the aparitions number increments
    for zero to one and ends when the aparitions decrements to zero (in endContact
    function). */
    contactListener.BeginContact = function(contact) {

        if (!running) return;

        var isSensorA = contact.GetFixtureA().IsSensor();
        var isSensorB = contact.GetFixtureB().IsSensor();

        if (isSensorA != isSensorB) { // a XOR b: is any fixture a sensor?
            //find who is the sensor and who the body
            var bodySensed, bodySensor;

            if (isSensorA) {
                bodySensor = contact.GetFixtureA();
                bodySensed = contact.GetFixtureB();
            } else {
                bodySensor = contact.GetFixtureB();
                bodySensed = contact.GetFixtureA();
            }

            // if it's a robot part, do nothing
            if (isRobotPart(bodySensed.getBodyName(), robotparts))
                return;

            /*  Here, we got a collition sensor-body.
                if is the first collition detect by this sensor
                    then send message to sandbox */
            if (bodySensor.nCollided === 0) {
                var message = {
                    id: bodySensor.getBodyName(),
                    state: "begin"
                };
                sendMessage("sensor", message);
            }
            //increment the collition count
            bodySensor.addCollition();
        }
    };

    contactListener.EndContact = function(contact) {
        if (!running) return;

        var isSensorA = contact.GetFixtureA().IsSensor();
        var isSensorB = contact.GetFixtureB().IsSensor();

        if (isSensorA != isSensorB) { // a XOR b: is any fixture a sensor?
            //find who is the sensor and who the body
            var bodySensed, bodySensor;

            if (isSensorA) {
                bodySensor = contact.GetFixtureA();
                bodySensed = contact.GetFixtureB();
            } else {
                bodySensor = contact.GetFixtureB();
                bodySensed = contact.GetFixtureA();
            }

            // if it's a robot part, do nothing
            if (isRobotPart(bodySensed.getBodyName(), robotparts))
                return;

            /*  Here, we got a collition sensor-body.
                if is the first collition detect by this sensor
                    then send message to sandbox */
            if (bodySensor.nCollided === 1) {
                var message = {
                    id: bodySensor.getBodyName(),
                    state: "end"
                };
                sendMessage("sensor", message);
            }
            //decrement the collition counter
            bodySensor.removeCollition();


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

    // auxiliar vars to movement control
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

    var canvasID = null;
    var sandbox = worker ||  null;
    var running = false;
    var idInterval = null;


    // Init the world, robot, sensors and everything
    this.init = function(canvasID) {

        canvasID = canvasID ||  null;

        if (!canvasID) return;

        Simulator.World = new b2World(
            new b2Vec2(0, 0), //gravity
            true //allow sleep
        );

        //setup debug draw
        Simulator.World.configDraw(new b2DebugDraw(), canvasID);

        // robot main body
        robot = createRobot(initConfig.robodeIniX, initConfig.robodeIniY, initConfig.robodeW, initConfig.robodeH);
        // wheels
        fr = createWheel(robot.GetWorldCenter().x + 0.53, robot.GetWorldCenter().y + 0.5);
        fl = createWheel(robot.GetWorldCenter().x - 0.53, robot.GetWorldCenter().y + 0.5);
        // joints wheels
        jfr = addWheelJoint(robot, fr);
        jfl = addWheelJoint(robot, fl);
        // external sensors
        extSensors.push(new Simulator.Sensor(pointsTL, "NW", robot));
        extSensors.push(new Simulator.Sensor(pointsTR, "NE", robot));
        extSensors.push(new Simulator.Sensor(pointsBL, "SW", robot));
        extSensors.push(new Simulator.Sensor(pointsBR, "SE", robot));
        //Line sensors
        var posIniAux = [{
            x: Simulator.config.robodeIniX,
            y: Simulator.config.robodeIniY
        }];
        sensorLL = new Simulator.Sensor(posIniAux, "LL", robot, -0.21, -0.2);
        sensorLR = new Simulator.Sensor(posIniAux, "LR", robot, 0.21, -0.2);


        // Create circuit
        circuit.craft();
        Simulator.World.setWorldScale(Simulator.config.scaleWorldIni);

        running = true;

        // add collision listener
        Simulator.World.SetContactListener(contactListener);

        idInterval = window.setInterval(function() {
            Simulator.World.Step(
                1 / 60, //frame-rate
                10, //velocity iterations
                10 //position iterations
            );

            // Simulator.World.drawLines();
            Simulator.World.DrawDebugData();
            Simulator.World.ClearForces();

            updateMovement();

        }, 1000 / 60);

    };

    this.end = function() {
        if (!running) return;

        running = false;
        window.clearInterval(idInterval);

        // Clear canvas
        Simulator.World.clearCanvas();

        //destroy world
        Simulator.World.destroyAll();
        Simulator.World = null;

        //reset speeds
        rspeed = 0;
        lspeed = 0;

    };


    this.move = function(myleftspeed, myrightspeed) {
        if (!running) return;

        myleftspeed = myleftspeed * 100 ||  0;
        myrightspeed = myrightspeed * 100 ||  0;

        lspeed = myleftspeed.clamp(Simulator.config.minPower, Simulator.config.maxPower);
        rspeed = myrightspeed.clamp(Simulator.config.minPower, Simulator.config.maxPower);
    };

    this.stop = function() {

        if (!running) return;

        lspeed = 0;
        rspeed = 0;

        robot.SetLinearVelocity(new b2Vec2(0, 0));
        robot.SetAngularVelocity(0);

        extSensors.forEach(function(elem) {
            elem.setLinearVelocity(new b2Vec2(0, 0));
            elem.setAngularVelocity(0);
        });

        if (!robot.IsAwake()) {
            stop = false;
        }
    };

    this.left = function() {
        //empty TODO HACER!
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

    var updateMovement = function() {
        // console.log(sensorLL.getPosition());
        detectLineCollition(sensorLL);
        detectLineCollition(sensorLR);

        cancelVel(fr);
        cancelVel(fl);

        if (stop) {
            this.stop();
        } else {
            applyForces();
        }
    };


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

    function applyForces() {

        // pre-calculations movement
        p1r = fr.GetWorldCenter();
        p2r = fr.GetWorldPoint(new b2Vec2(0, 1));
        p3r.x = (p2r.x - p1r.x) * rspeed;
        p3r.y = (p2r.y - p1r.y) * rspeed;

        p1l = fl.GetWorldCenter();
        p2l = fl.GetWorldPoint(new b2Vec2(0, 1));
        p3l.x = (p2l.x - p1l.x) * lspeed;
        p3l.y = (p2l.y - p1l.y) * lspeed;


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
            elem.setAngularVelocity(robotAV);
            elem.setAngle(robot.GetAngle());
        });
    }



    /****************************************************************************
     *       ROBOT COLLISION CONTROL FUNCTIONS                                  *
     ****************************************************************************/


    function detectLineCollition(sensor) {

        var lines = Simulator.World.lines;
        if (lines.length === 0) return;

        var anysensed = false;

        var minDistance = Simulator.World.getDistanceCollitionLine();
        var scale = Simulator.World.getWorldScale();
        var position = {
            x: sensor.getPosition().x * scale,
            y: sensor.getPosition().y * scale
        };
        lines.forEach(function(c) {
            var p = pointInBezier(c, position); //FIXME paralelizar!
            // if any sensor collided, notify sandbox
            var dist = distance(p, position);
            if (dist <= minDistance) {
                ///////// TODO: DELETE
                // console.log(sensor.getPosition());
                var ctx = Simulator.World.m_debugDraw.m_ctx;
                ctx.save();
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(position.x, position.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();

                ctx.lineWidth = 10;
                ctx.strokeStyle = "orange";
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(position.x, position.y, 2, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.restore();
                ///////
                var message = {
                    id: sensor.name,
                    state: "begin"
                };
                sendMessage("sensor", message);
                anysensed = true;
                return;
            }

        });
        //if it detects no collitions, send endContact
        //FIXME optimizar!
        if (!anysensed) {
            var message = {
                id: sensor.name,
                state: "end"
            };
            sendMessage("sensor", message);
        }
    }


    function pointInBezier(curve, point) {
        var luts = curve.getLUT();
        var i,
            end = luts.length,
            dist,
            minDist = distance(luts[0], point),
            sec = 0;
        for (i = 1; i < end; i++) {
            dist = distance(luts[i], point);
            if (dist < minDist) {
                sec = i;
                minDist = dist;
            }
        }
        var t = sec / (end - 1);
        return curve.get(t);
    }

    function distance(p, q) {
        return Math.abs(Math.sqrt(Math.pow((p.x - q.x), 2) + Math.pow((p.y - q.y), 2)));
    }


    function isRobotPart(bodySensedName, elems2avoid) {

        for (var elem in elems2avoid) {
            if (bodySensedName === elems2avoid[elem])
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
        var robot = Simulator.World.CreateBody(bodyDef);
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
        var wheelBody = Simulator.World.CreateBody(bodyDef);
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
        return Simulator.World.CreateJoint(revoluteJointDef);

    }

}
