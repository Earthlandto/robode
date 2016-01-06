function iJavaRobodeModule() {


    var nameModule = "ROBODE";
    var descriptionModule = "MODULE DESCRIPTION";
    var prefix = "rb_"; //prefix for export functions


    var module = new iJavaModule(nameModule, descriptionModule);
    //TODO to use inheritance by iJavaModule()
    this.getElems2parser = module.getElems2parser;
    this.getElems2sandbox = module.getElems2sandbox;


    // --- type elements DEFINITION
    var dt_rb_CONS = module.makeDatatype('string');

    var dt_rb_fun = module.makeDatatype('function', 'void', ['int']);


    // --- elements IMPLEMENTATION
    var rb_CONS = "--CONSTANT_RB--"; //test constant

    function rb_fun(arg1) {
        for (var i = 0; i < arg1; i++) {
            print("Hello World\n");
        }
    }

    // --- add elements
    module.add_constant('rb_CONS', dt_rb_CONS, rb_CONS);
    module.add_function('rb_fun', rb_fun, dt_rb_fun);


    ////////////////////////////////////
    // OTHER FUNCTIONS


    function print(msg) {
        if (msg === undefined) msg = "";
        if (msg instanceof __Object) {
            msg = msg.__toString__0();
        }
        if (outputHandler) outputHandler.print(msg);
        else console.log(msg);
    }


}