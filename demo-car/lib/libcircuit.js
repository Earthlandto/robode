
function createCircuit() {

    //===BORDERS===================================================================
    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.userData = createNewUserData("border");
    var fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();

    // lower border
    fixDef.shape.SetAsBox(50, 0.01);
    bodyDef.position.Set(30, 60);
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
    // bodyDef.userData = "wall";
    fixDef.shape = new b2PolygonShape();

    // top-left semi-circle
    var top_left = new Bezier(10, 20, 10, 10, 20, 10);
    var vecs = getVecsBezier(top_left);
    vecs.push(vecs[0]);

    var wall = world.CreateBody(bodyDef);
    wall.SetUserData(createNewUserData("wall"))
    for (var i = 0; i < vecs.length - 1; i++) {
        fixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
        wall.CreateFixture(fixDef);
    }

    // top-right moon
    var top_moon = new Bezier(33, 9, 70, 0, 70, 30);
    vecs = [];
    vecs = getVecsBezier(top_moon);
    var lower_moon = new Bezier(70, 30, 60, 15, 33, 9);
    getVecsBezier(lower_moon).forEach(function(p) {
        vecs.push(p);
    });

    wall = world.CreateBody(bodyDef);
    wall.SetUserData(createNewUserData("wall"))
    for (i = 0; i < vecs.length - 1; i++) {
        fixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
        wall.CreateFixture(fixDef);
    }

    // lower bezier curves
    var lower_bezier = new Bezier(10, 50, 40, 20, 40, 70, 70, 50);
    vecs = [];
    vecs = getVecsBezier(lower_bezier);

    wall = world.CreateBody(bodyDef);
    wall.SetUserData(createNewUserData("wall"))
    for (i = 0; i < vecs.length - 1; i++) {
        fixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
        wall.CreateFixture(fixDef);
    }

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
    for (i=0; i < 5; i++) {
        xCircle += 10;
        bodyDef.position.Set(xCircle, 25);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    }

    // CREATE LINES ====================================================================

    vecs = [];
    vecs = getVecsBezier(new Bezier(35,38,  35,20, 35,10));

    bodyDef = new b2BodyDef();
    bodyDef.position.Set(0,0);
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.userData = createNewUserData("line");
    var mylines = world.CreateBody(bodyDef);

    fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();

    var line = world.CreateBody(bodyDef);
    for (i = 0; i < vecs.length - 1; i++) {
        fixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
        mylines.CreateFixture(fixDef);
    }




    // FUNCTIONS===================================================================

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

    function createNewUserData(bodyType){
        return bodyType + Math.floor(Math.random()*1000);
    }



}