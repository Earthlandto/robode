
function createCircuit() {

    //===BORDERS===================================================================
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_staticBody;
    var fixDef = new b2FixtureDef;
    fixDef.shape = new b2PolygonShape;

    // lower border
    bodyDef.position.Set(30, 60);
    fixDef.shape.SetAsBox(50, .01);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // top border
    bodyDef.position.Set(30, 0);
    fixDef.shape.SetAsBox(50, .01);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // right border
    bodyDef.position.Set(75, 30);
    fixDef.shape.SetAsBox(.01, 50);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // left border
    bodyDef.position.Set(0, 30);
    fixDef.shape.SetAsBox(.01, 50);
    world.CreateBody(bodyDef).CreateFixture(fixDef);


    // CREATE RESTRINGED AREAS ===================================================================
    bodyDef.position.Set(0, 0);

    // top-left semi-circle
    var top_left = new Bezier(10, 20, 10, 10, 20, 10);
    var vecs = getVecsBezier(top_left);
    vecs.push(vecs[0]);

    for (var i = 0; i < vecs.length - 1; i++) {
        fixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    }

    // top-right moon
    var top_moon = new Bezier(33, 9, 70, 0, 70, 30);
    vecs = [];
    vecs = getVecsBezier(top_moon);
    var lower_moon = new Bezier(70, 30, 60, 15, 33, 9);
    getVecsBezier(lower_moon).forEach(function(p) {
        vecs.push(p);
    });

    for (var i = 0; i < vecs.length - 1; i++) {
        fixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    }

    // lower bezier curves
    var lower_bezier = new Bezier(10, 50, 40, 20, 40, 70, 70, 50);
    vecs = [];
    vecs = getVecsBezier(lower_bezier);

    for (var i = 0; i < vecs.length - 1; i++) {
        fixDef.shape.SetAsEdge(vecs[i], vecs[i + 1]);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    }

    // CREATE OBSTACLES ===================================================================

    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.linearDamping = 1;
    bodyDef.angularDamping = 1;
    fixDef.shape = new b2CircleShape(1);
    fixDef.density = 100;
    fixDef.friction = 50000;
    fixDef.restitution = 0.2;
    var xCircle = 0;
    for (var i = 0; i < 5; i++) {
        xCircle += 10;
        bodyDef.position.Set(xCircle, 25);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    }



    // FUNCTIONS===================================================================

    function getVecsBezier(curve, step) {
        var step = step | 100;
        var LUT = curve.getLUT();
        var vecs = [];
        LUT.forEach(function(p) {
            var vec = new b2Vec2();
            vec.Set(p.x, p.y);
            vecs.push(vec);
        })
        return vecs;
    }



};