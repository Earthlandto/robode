importScripts('Box2D.min.js');

var b2World = Box2D.Dynamics.b2World;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;




self.onmessage = function(e) {
    console.log('before');
    self.postMessage('msg from worker ' + e.data);
    console.log('after');
};


var world;

(function() {
    world = new b2World(
        new b2Vec2(0, 0), //gravity
        true //allow sleep
    );
    // var myDebugDraw = new b2DebugDraw();
    // myDebugDraw.SetSprite(document.getElementById("mycanvas").getContext("2d"));
    // myDebugDraw.SetDrawScale(worldScale);
    // myDebugDraw.SetFillAlpha(0.3);
    // myDebugDraw.SetLineThickness(1.0);
    // myDebugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    // world.SetDebugDraw(myDebugDraw);



    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(15, 15);
    var fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();

    fixDef.shape.SetAsBox(1, 1);
    world.CreateBody(bodyDef).CreateFixture(fixDef);

    bodyDef.position.Set(21, 15);
    world.CreateBody(bodyDef).CreateFixture(fixDef);
    console.log("box2dtest ready");
})();


function deleteProperty(object, property) {
    for (var p in object) {
        var prop = object[p];
        if (prop === property) {
            prop = null;
        } else if (typeof prop === "object") {
            deleteProperty(prop, property);
        }
    }
}

console.log(world);
deleteProperty(world, world);
console.log(JSON.stringify(world));
