function iJavaRobodeModule() {


    var nameModule = "ROBODE";
    var descriptionModule = "MODULE DESCRIPTION";

    var module = new iJavaModule(nameModule, descriptionModule);
    this.getElems2export = module.getElems2export; //TODO to use inheritance by iJavaModule()




    var dt = module.makeDatatype('int');
    module.add_constant('test', dt, "-test-");

    var dt1 = module.makeDatatype('function', 'void',['int','int']);
    module.add_function('testf', dt1);

}