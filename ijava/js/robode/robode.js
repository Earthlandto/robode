function Robode() {

    ////////// CREATE CAR

    var car = createCar(16, 16, 0.6, 1);

    //create wheels and joints wheels
    var carX = car.GetWorldCenter().x;
    var carY = car.GetWorldCenter().y;
    var fr = createWheel(carX + 0.53, carY + 0.5); //front right wheel
    var fl = createWheel(carX - 0.53, carY + 0.5); //front left wheel

    var jfr = addWheelJoint(car, fr); // Joint between car body and front right wheel
    var jfl = addWheelJoint(car, fl); // Joint between car body and front left wheel


    ///////// CAR BEHAVIOUR


    //initial speed
    var rspeed = 300;
    var lspeed = 300;

    var stop = false;

    // increment speed
    var WHEEL_SPEED = 50;
    var ENGINE_SPEED = 300;



    var p1r = new b2Vec2();
    var p2r = new b2Vec2();
    var p3r = new b2Vec2();

    var p1l = new b2Vec2();
    var p2l = new b2Vec2();
    var p3l = new b2Vec2();



    // $(window).keyup(function(e) {
    //     var code = e.keyCode;
    //
    //     if (code == 87) { //LEFT WHEEL (front) -> key W
    //         lspeed += WHEEL_SPEED;
    //         console.log(lspeed, " : ", rspeed);
    //     }
    //     if (code == 69) { // RIGHT WHEEL (front) -> key E
    //         rspeed += WHEEL_SPEED;
    //         console.log(lspeed, " : ", rspeed);
    //     }
    //     if (code == 83) { // LEFT WHELL (back) -> key S
    //         lspeed += -WHEEL_SPEED;
    //         console.log(lspeed, " : ", rspeed);
    //     }
    //     if (code == 68) { // RIGHT WHELL (back) -> key X
    //         rspeed += -WHEEL_SPEED;
    //         console.log(lspeed, " : ", rspeed);
    //     }
    //
    //     if (code == 70) { // STOP right wheel -> key F
    //         rspeed = 0;
    //         console.log(lspeed, " : ", rspeed);
    //     }
    //     if (code == 65) { // STOP left wheel -> key A
    //         lspeed = 0;
    //         console.log(lspeed, " : ", rspeed);
    //     }
    //     if (code == 32) // STOP car -> key SPACE
    //         stop = true;
    // });



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


    ///////// CREATE SENSORS

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

    var sensorTL = createExternalSensor(pointsTL, "TL", car);
    var sensorTR = createExternalSensor(pointsTR, "TR", car);
    var sensorBL = createExternalSensor(pointsBL, "BL", car);
    var sensorBR = createExternalSensor(pointsBR, "BR", car);

    var extSensors = [sensorTL, sensorBR, sensorBL, sensorTR];


    // line sensors
    var sLineLeft = createLineSensor('left', car);
    var sLineRight = createLineSensor('right', car);


    ////////// Contact CONTROL
    var contactListener = new b2ContactListener();

    var carparts = ['wheel', 'robot'];
    /*  The bodiesSensed variable stores the bodies sensed by each sensor.
    For each body, stores the number the fixtures that the sensor has sensed
    using maps:   map {k, map{k', v}}
    example:      map {sensor0, map{ body1, 10}} */
    var bodiesSensed = {};

    world.SetContactListener(contactListener);

    contactListener.PreSolve = function(contact, oldManifold) {


        var udA = contact.GetFixtureA().GetBody().GetUserData();
        var udB = contact.GetFixtureB().GetBody().GetUserData();

        if (udA.substr(0, 4) == 'line' || udB.substr(0, 4) == 'line') {
            // console.log(contact);
            // console.log(oldManifold);
            contact.SetEnabled(false);
        }
    };

    /*  The sensoring begins when a particular sensor perceive a body through
    one of its parts (fixtures). Then, beginContact function counts the aparitions
    of this body's fixtures. A contact begins when the aparitions number increments
    for zero to one and ends when the aparitions decrements to zero.
        All of this is implements in beginContact and EndContact functions. */

    contactListener.BeginContact = function(contact) {

        var isSensorA = contact.GetFixtureA().IsSensor();
        var isSensorB = contact.GetFixtureB().IsSensor();

        if (isSensorA != isSensorB) { // a XOR b

            var bodySensed, bodySensor;

            if (isSensorA) {
                bodySensor = contact.GetFixtureA().GetBody();
                bodySensed = contact.GetFixtureB().GetBody();
            } else {
                bodySensor = contact.GetFixtureB().GetBody();
                bodySensed = contact.GetFixtureA().GetBody();
            }

            // if it's a car part, do nothing
            if (isCarPart(bodySensed.GetUserData(), carparts))
                return;

            var bodySensorUD = bodySensor.GetUserData();
            var bodySensedUD = bodySensed.GetUserData();

            // Had the body sensed the body previously?
            if (bodiesSensed.hasOwnProperty(bodySensorUD)) {
                var listSensed = bodiesSensed[bodySensorUD];
                var sensedIndex = listSensed.findIndex(function(elem) {
                    return elem.hasOwnProperty(bodySensedUD);
                });

                //if the body is already sensed
                if (sensedIndex > -1) {
                    (listSensed[sensedIndex])[bodySensedUD] += 1;
                    if ((listSensed[sensedIndex])[bodySensedUD] === 1) {
                        console.log("BEGIN contact", bodySensorUD, bodySensed.GetUserData());
                        // document.getElementById(bodySensorUD).style.backgroundColor = 'grey';
                    }

                } else {
                    // it's first time this sensor sensed this body
                    var newBodySensed = {};
                    newBodySensed[bodySensedUD] = 1;
                    listSensed.push(newBodySensed);
                    console.log("BEGIN contact", bodySensorUD, bodySensed.GetUserData());
                    // document.getElementById(bodySensorUD).style.backgroundColor = 'grey';
                }
            } else { // if it's the first time that the sensor perceive any body...
                bodiesSensed[bodySensorUD] = [];
                var newBodySensed = {};
                newBodySensed[bodySensedUD] = 1;
                bodiesSensed[bodySensorUD].push(newBodySensed);

                console.log("BEGIN contact", bodySensorUD, bodySensed.GetUserData());
            }

        }
    };

    contactListener.EndContact = function(contact) {

        var isSensorA = contact.GetFixtureA().IsSensor();
        var isSensorB = contact.GetFixtureB().IsSensor();

        if (isSensorA != isSensorB) { // a XOR b

            var bodySensed, bodySensor;

            if (isSensorA) {
                bodySensor = contact.GetFixtureA().GetBody();
                bodySensed = contact.GetFixtureB().GetBody();
            } else {
                bodySensor = contact.GetFixtureB().GetBody();
                bodySensed = contact.GetFixtureA().GetBody();
            }

            // if it's a car part, do nothing
            if (isCarPart(bodySensed.GetUserData(), carparts))
                return;

            var bodySensorUD = bodySensor.GetUserData();
            var bodySensedUD = bodySensed.GetUserData();

            // The body has already been sensed previously
            var listSensed = bodiesSensed[bodySensorUD];
            var sensedIndex = listSensed.findIndex(function(elem) {
                return elem.hasOwnProperty(bodySensedUD);
            });



            (listSensed[sensedIndex])[bodySensedUD] -= 1;
            if ((listSensed[sensedIndex])[bodySensedUD] < 1) {
                console.log("END contact", bodySensorUD, bodySensed.GetUserData());
            }
        }
    };



    /////////// FUNCTIONS

    function isCarPart(bodySensedUserData, avoid_elems) {

        for (var elem in avoid_elems) {
            if (avoid_elems[elem] == bodySensedUserData)
                return true;
        }
        return false;

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


    function createExternalSensor(points, name, car) {

        var carPos = car.GetWorldCenter();


        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(carPos.x, carPos.y);
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
        jointdef.Initialize(car, sensor, carPos);
        jointdef.collideConnected = false;
        jointdef.enableMotor = false;
        jointdef.enableLimit = false;
        jointdef.maxMotorTorque = Number.MAX_SAFE_INTEGER;
        world.CreateJoint(jointdef);

        return sensor;
    }


    function createLineSensor(name, car) {

        var carPos = car.GetWorldCenter();
        var radius = 0.2;

        var position;
        switch (name) {
            case 'left':
                position = carPos.x - radius + 0.01;
                break;
            case 'right':
                position = carPos.x + radius - 0.01;
                break;
            default:
                position = carPos;
        }

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(position, carPos.y - 0.2);

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
        jointdef.Initialize(car, sline, carPos);
        jointdef.collideConnected = false;
        jointdef.enableMotor = false;
        jointdef.enableLimit = true;

        world.CreateJoint(jointdef);

        return sline;
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



    function stopMovement() {
        console.log("STOP");

        lspeed = 0;
        rspeed = 0;

        car.SetLinearVelocity(new b2Vec2(0, 0));
        car.SetAngularVelocity(0);

        extSensors.forEach(function(elem) {
            elem.SetLinearVelocity(new b2Vec2(0, 0));
            elem.SetAngularVelocity(0);
        });

        if (!car.IsAwake()) {
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

        var carAV = car.GetAngularVelocity();
        var carLV = car.GetLinearVelocity();

        fr.SetAngularVelocity(carAV);
        fl.SetAngularVelocity(carAV);

        extSensors.forEach(function(elem) {
            elem.SetAngularVelocity(carAV);
            elem.SetAngle(car.GetAngle());
        });
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

    function createCar(posX, posY, width, height) {

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

        //CAR BODY
        var car = world.CreateBody(bodyDef);
        car.setName("robot");

        car.CreateFixture(fixDef);
        return car;
    }
}
