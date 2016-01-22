function createCircuit() {

    var canvasWidth = $('canvas').get(0).width;
    var canvasHeight = $('canvas').get(0).height;

    //===BORDERS===================================================================
    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.setName("border");
    var fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();

    // lower border
    fixDef.shape.SetAsBox(canvasWidth/scale, 0.01);
    bodyDef.position.Set((canvasWidth/scale)/2, canvasHeight/scale);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // top border
    bodyDef.position.Set((canvasWidth/scale)/2, 0);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // right border
    fixDef.shape.SetAsBox(0.01, canvasHeight/scale);
    bodyDef.position.Set(canvasWidth/scale, (canvasHeight/scale)/2);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    // left border
    bodyDef.position.Set(0, (canvasHeight/scale)/2);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

}
