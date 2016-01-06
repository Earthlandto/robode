function iJavaRobodeModule() {


    var nameModule = "ROBODE";
    var descriptionModule = "MODULE DESCRIPTION";

    var module = new iJavaModule(nameModule, descriptionModule);
    //TODO to use inheritance by iJavaModule()
    this.getElems2parser = module.getElems2parser;
    this.getElems2sandbox = module.getElems2sandbox;




    var dt = module.makeDatatype('int');
    module.add_constant('rb_test', dt, "");

    var dt1 = module.makeDatatype('function', 'void',['int','int']);
    module.add_function('rb_testf', dt1);

}