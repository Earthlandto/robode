function iJavaRobodeModule() {


    var nameModule = "ROBODE";
    var descriptionModule = "MODULE DESCRIPTION";
    var prefix = "rb_"; //prefix for export functions


    var module = new iJavaModule(nameModule, descriptionModule);
    //TODO to use inheritance by iJavaModule()
    this.getElems2parser = module.getElems2parser;
    this.getElems2sandbox = module.getElems2sandbox;


    // --- elements DEFINITION
    var dt_rb_test = module.makeDatatype('int');

    var dt_rb_testf = module.makeDatatype('function', 'void', ['int', 'int']);


    // --- elements IMPLEMENTATION
    var rb_test = "--test--"; //test constant

    function rb_testf(arg1, arg2) {
        print('fun: rb_testf; arg1: ' + arg1 + '; arg2: ' + arg2);
        print('\n');
    }

    // --- add elements
    module.add_constant('rb_test', dt_rb_test, rb_test);
    module.add_function('rb_testf', rb_testf, dt_rb_testf);


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