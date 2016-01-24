// Box2d World
var world = null;
//world scale
var scale = 10;

var robodeIni = {
    x: 16,
    y: 16,
    width: 0.6,
    height: 1
};


// Define shorter Box2d names
var b2World = Box2D.Dynamics.b2World;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
// var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;
var b2ContactListener = Box2D.Dynamics.b2ContactListener;
// var b2DestructionListener = Box2D.Dynamics.b2DestructionListener;


// Class redefinitions
b2BodyDef.prototype.setName = function(name) {
    this.userData = name;
};

b2Body.prototype.setName = function(name) {
    this.m_userData = name;
};

b2Body.prototype.getName = function() {
    return this.GetUserData();
};

b2Fixture.prototype.getBodyName = function() {
    return this.GetBody().getName();
};

b2World.prototype.configDraw = function(myDebugDraw, myWorld, myCanvas, myWorldScale) {

    myDebugDraw.SetSprite(document.getElementById(myCanvas).getContext("2d"));
    myDebugDraw.SetDrawScale(myWorldScale);
    myDebugDraw.SetFillAlpha(0.3);
    myDebugDraw.SetLineThickness(1.0);
    myDebugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    myWorld.SetDebugDraw(myDebugDraw);
};

b2World.prototype.setWorldScale = function(newScale) {
    this.m_debugDraw.SetDrawScale(newScale);
};

b2World.prototype.getWorldScale = function() {
    return this.m_debugDraw;
};

b2World.prototype.destroyAll = function() {
    // this.destroyContacts();
    this.destroyJoints();
    this.destroyBodies();
};

// b2World.prototype.destroyContacts = function() {
//
//     var contact = this.GetContactList();
//     var contact_next;
//     while (contact) {
//         contact_next = contact.m_next;
//         contact.Reset();
//         contact = contact_next;
//     }
// };

b2World.prototype.destroyJoints = function() {

    var joint = this.GetJointList();
    var joint_next;
    while (joint) {
        joint_next = joint.m_next;
        this.DestroyJoint(joint);
        joint = joint_next;
    }
};

b2World.prototype.destroyBodies = function() {

    var body_next, body = this.GetBodyList();
    while (body) {
        var fixture_next, fixture = body.GetFixtureList();
        while (fixture) {
            fixture_next = fixture.GetNext();
            body.DestroyFixture(fixture);
            fixture = fixture_next;
        }
        body_next = body.GetNext();
        this.DestroyBody(body);
        body = body_next;
    }
};

b2World.prototype.clearCanvas = function() {
    var ctx = this.m_debugDraw.m_ctx;
    var mycanvas = ctx.canvas;
    ctx.clearRect(0, 0, mycanvas.width, mycanvas.height);
};
