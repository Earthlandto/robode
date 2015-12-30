function createCircuit() {

    //===BORDERS===================================================================
    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.userData = createNewUserData("border");
    var fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();

    // lower border
    fixDef.shape.SetAsBox(50, 0.01);
    bodyDef.position.Set(30, 55);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // top border
    bodyDef.position.Set(30, 0);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // right border
    fixDef.shape.SetAsBox(0.01, 50);
    bodyDef.position.Set(75, 30);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // left border
    bodyDef.position.Set(0, 30);
    world.CreateBody(bodyDef).CreateFixture(fixDef);


    // CREATE RESTRINGED AREAS ===================================================================
    bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    fixDef = new b2FixtureDef();

    bodyDef.position.Set(0, 0);
    fixDef.shape = new b2PolygonShape();

    // top-left semi-circle
    var vecs = getVecsBezier(new Bezier(10, 20, 10, 10, 20, 10));
    vecs.push(vecs[0]);

    var wall = world.CreateBody(bodyDef);
    wall.SetUserData(createNewUserData("wall"));
    for (var i = 0; i < vecs.length - 1; i++) {
        fixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
        wall.CreateFixture(fixDef);
    }

    // top-right moon
    wall = world.CreateBody(bodyDef);
    wall.SetUserData(createNewUserData("wall"));

    makeBezierLine(new Bezier(33, 9,  70, 0,  70, 30), wall, fixDef);
    makeBezierLine(new Bezier(70, 30,  60, 15,  33, 9), wall, fixDef);

    // lower bezier curve
    wall = world.CreateBody(bodyDef);
    wall.SetUserData(createNewUserData("wall"));

    makeBezierLine(new Bezier(30, 50, 40, 35, 40, 50, 70, 40), wall, fixDef);


    // CREATE OBSTACLES ===================================================================

    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.userData = createNewUserData("obstacles");
    bodyDef.linearDamping = 1;
    bodyDef.angularDamping = 1;
    fixDef.shape = new b2CircleShape(1);
    fixDef.density = 100;
    fixDef.friction = 50000;
    fixDef.restitution = 0.2;
    var xCircle = 0;
    for (i = 0; i < 5; i++) {
        xCircle += 10;
        bodyDef.position.Set(xCircle, 25);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    }

    // CREATE LINES ====================================================================


    bodyDef = new b2BodyDef();
    bodyDef.position.Set(0, 0);
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.userData = createNewUserData("line");
    var mylines = world.CreateBody(bodyDef);

    fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();


    // straight line
    makeBezierLine(new Bezier(35, 38, 35, 20, 35, 20), mylines, fixDef);

    // curve line to up
    makeBezierLine(new Bezier(30, 20, 32.5, 10, 35, 20), mylines, fixDef);

    // curve line to down
    makeBezierLine(new Bezier(20, 20, 25, 30, 30, 20), mylines, fixDef);

    // great curve line to down
    makeBezierLine(new Bezier(20, 20, 10, 30, 35, 38), mylines, fixDef);



    // FUNCTIONS===================================================================

    function makeBezierLine(bezier, mybody, myFixDef) {
        var vecs = getVecsBezier(bezier);
        for (i = 0; i < vecs.length - 1; i++) {
            myFixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
            mybody.CreateFixture(myFixDef);
        }
    }


    function getVecsBezier(curve, step) {
        step = step | 100;
        var LUT = curve.getLUT();
        var vecs = [];
        LUT.forEach(function(p) {
            var vec = new b2Vec2();
            vec.Set(p.x, p.y);
            vecs.push(vec);
        });
        return vecs;
    }

    function createNewUserData(bodyType) {
        return bodyType + Math.floor(Math.random() * 1000);
    }



}