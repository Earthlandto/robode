function iJavaCompiler() {

    var elems2parser = []; // list of elements for add the parser (functions, constant...)

    // Create modules
    var robode = new iJavaRobodeModule();

    // Add elems (functions definition, constant definion... to parser)
    elems2parser = elems2parser.concat(robode.getElems2parser());

    // Create parser
    var parser = new iJavaParser(elems2parser);
    var sandbox = null;

    var errorHandler = null;
    var outputHandler = null;

    this.parse = function(source) {
        var tree;
        var errors = [];
        try {
            tree = parser.parse(source);
        } catch (e) {
            errors.push(e);
            return errors;
        }
        return parser.getWarnings();
    };

    this.getKeyPoints = function(source) {
        this.parse(source);
        return parser.getKeyPoints();
    };

    this.getIcon = function(source) {
        this.parse(source);
        var io = ['print', 'println', 'readInteger', 'readDouble', 'readString', 'readChar'];
        var animation = ['loop', 'noLoop', 'redraw'];
        var math = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'log'];
        var graph = ['stroke', 'strokeWeight', 'noStroke', 'noFill', 'background', 'line', 'ellipse', 'point', 'triangle', 'rect', 'text', 'textSize', 'color', 'alpha', 'red', 'green', 'blue', 'brightness', 'saturation', 'blendColor', 'lerpColor', 'getColor', 'image'];
        var tags = {
            graph: 0,
            animation: 0,
            io: 0,
            math: 0
        };
        var functions = parser.getUsedFunctions();
        tags.animation = (functions.indexOf('loop') >= 0 || (functions.indexOf('animate') >= 0));
        for (var i = 0; i < io.length; i++) {
            if (functions.indexOf(io[i]) >= 0) {
                tags.io = 1;
                break;
            }
        }
        for (i = 0; i < math.length; i++) {
            if (functions.indexOf(math[i]) >= 0) {
                tags.math = 1;
                break;
            }
        }
        for (i = 0; i < graph.length; i++) {
            if (functions.indexOf(graph[i]) >= 0) {
                tags.graph = 1;
                break;
            }
        }
        return tags.graph + tags.animation * 2 + tags.io * 4 + tags.math * 8;
    };

    this.run = function(source, canvasid) {

        var tree;
        try {
            tree = parser.parse(source);
        } catch (e) {
            errorHandler.manage(e);
            return;
        }
        var traductor = new iJava2Javascript(tree);
        var code = traductor.doIt();
        console.log(code);
        sandbox = new iJavaSandbox(canvasid);
        sandbox.setOutputHandler(outputHandler);
        sandbox.setErrorHandler(errorHandler);
        var usedImages = parser.getUsedImages();
        for (var i = 0; i < usedImages.length; i++) {
            sandbox.preloadImage(usedImages[i]);
        }
        outputHandler.clear();
        sandbox.run(code);
        var functions = parser.getUsedFunctions();
        return (functions.indexOf('loop') >= 0 || (functions.indexOf('animate') >= 0));
    };

    this.stop = function() {
        if (sandbox) sandbox.stop();
    };

    this.setOutputHandler = function(oh) {
        outputHandler = oh;
    };

    this.setErrorHandler = function(eh) {
        errorHandler = eh;
    };
}