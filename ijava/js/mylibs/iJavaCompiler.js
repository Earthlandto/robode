function iJavaCompiler() {

    var parser = new iJavaParser();
    var sandbox = new Worker('js/mylibs/iJavaSandbox.js');

    // Simulator.Robode = new Robode(sandbox);
    // var robode = Simulator.Robode;
    var robode = new Simulator.Robode(sandbox);

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
        // var graph = ['stroke', 'strokeWeight', 'noStroke', 'noFill', 'background', 'line', 'ellipse', 'point', 'triangle', 'rect', 'text', 'textSize', 'color', 'alpha', 'red', 'green', 'blue', 'brightness', 'saturation', 'blendColor', 'lerpColor', 'getColor', 'image'];
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
        // for (i = 0; i < graph.length; i++) {
        //     if (functions.indexOf(graph[i]) >= 0) {
        //         tags.graph = 1;
        //         break;
        //     }
        // }
        return tags.graph + tags.animation * 2 + tags.io * 4 + tags.math * 8;
    };

    this.run = function(source, canvasid) {
        // send message to sandbox to set canvas
        sendMessage("canvas", canvasid);

        var tree;
        try {
            tree = parser.parse(source);
        } catch (e) {
            errorHandler.manage(e);
            return;
        }
        var traductor = new iJava2Javascript(tree);
        var code = traductor.doIt();
        // console.log(code);
        outputHandler.clear();
        // send message to sandbox to run code
        sendMessage("run", code);
        var functions = parser.getUsedFunctions();
        return (functions.indexOf('loop') >= 0 || (functions.indexOf('animate') >= 0));
    };

    this.stop = function() {
        // send message to sandbox to stop execution
        sendMessage("stop", "");
    };

    this.setOutputHandler = function(oh) {
        outputHandler = oh;
    };

    this.setErrorHandler = function(eh) {
        errorHandler = eh;
    };

    sandbox.onmessage = function(e) {
        var data = JSON.parse(e.data);
        switch (data.type) {
            case "output":
                outputHandler.print(data.msg);
                break;
            case "error":
                errorHandler.manage(data);
                break;
            case "robode":
                manageRobodeMessages(data.msg);
                break;
            default:
                console.log("compiler: msg from sandbox (worker): ", e.data);

        }
    };

    function sendMessage(type, data) {
        if (!sandbox) {
            console.log("Worker not exits.");
            return;
        }
        var message = {
            type: type,
            msg: data
        };
        sandbox.postMessage(JSON.stringify(message));
    }


    function manageRobodeMessages(message) {
        switch (message.fn) {
            case "init":
                var mycanvas = message.params[0];
                robode.init(mycanvas);
                break;
            case "end":
                robode.end();
                break;
            case "move":
                var lspeed = message.params[0];
                var rspeed = message.params[1];
                robode.move(lspeed, rspeed);
                break;
            case "stop":
                robode.stop();
        }
    }
}
