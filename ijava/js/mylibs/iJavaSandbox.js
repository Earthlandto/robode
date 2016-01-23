/****************************************************************************
 *                                                                          *
 *      Worker functions                                                    *
 *                                                                          *
 ****************************************************************************/

importScripts('OOSupport.js');

var sandbox = new iJavaSandbox();

self.onmessage = function(e) {
    var data = JSON.parse(e.data);
    switch (data.type) {
        case "run":
            sandbox.run(data.msg);
            break;
        case "stop":
            sandbox.stop(data.msg);
            break;
        case "canvas":
            sandbox.setCanvas(data.msg);
            break;
        default:
            console.log("Message received: ", data);
    }
};

function sendMessage(type, data) {
    var message = {
        type: type,
        msg: data
    };
    postMessage(JSON.stringify(message));
}



/****************************************************************************
 *                                                                          *
 *       SANDBOX                                                            *
 *                                                                          *
 ****************************************************************************/

function iJavaSandbox() {

    var canvasID = null;
    var runtime = null;

    var outputHandler = null;
    var errorHandler = null;

    var running = false;

    var startTime = new Date();
    var intervalStarted = false;
    var looping = null;
    var timeSinceLastFPS = null;
    var framesSinceLastFPS = 0;
    var frameRate = 0;

    // Variable autoreferencia
    var self = this;

    // Variable para simular entrada de texto desde BBDD //TODO: remove?
    self.standardInput = null;
    self.sipointer = 0;
    // internalPrompt = window.prompt; //FIXME: internalPrompt is not working. Is it needed?


    /****************************************************************************
     *       Runtime library                                                    *
     ****************************************************************************/
    function Runtime() {
        this.deep = -1;
        this.timeLimit = [];
        this.lastUpdate = [];
        this.nIterations = [];
        this.calls = {};
    }


    var execute = function(code) {
        initRuntime();
        var thecode = "running = true;\nvar __main = null;\nvar __draw = null;\nvar __onKeyPressed = null;\nvar __onKeyReleased = null;\n" + code + "\nonKeyPressed = __onKeyPressed;\nonKeyReleased = __onKeyReleased;\n try {\n  if (__main) __main();\n  else stop();\n} catch (e) {\n  error(e);\n}\n\n";
        console.log(thecode);
        eval(thecode);
    };

    function initRuntime() {
        if (intervalStarted)
            noLoop();
        runtime = new Runtime();
    }

    function endRuntime() {
        runtime = null;
    }


    Runtime.prototype.startLoop = function() {
        this.deep++;
        this.lastUpdate[this.deep] = new Date();
        this.timeLimit[this.deep] = 8000;
    };

    Runtime.prototype.updateLoop = function(line) {
        if (this.deep < 0) return;
        this.nIterations[this.deep]++;
        var now = new Date();
        var elapsed = now - this.lastUpdate[this.deep];
        if (elapsed > this.timeLimit[this.deep]) {
            //FIXME: delete window.confirm
            var res = window.confirm("Parece que el programa tarda demasiado. Pulsa 'ok' si crees que es normal. Pulsa 'cancel' para detener el programa si crees que puede ser debido a un bucle infinito generado por un error en el programa.");
            if (res) {
                this.lastUpdate[this.deep] = new Date();
                this.timeLimit[this.deep] *= 2;
            } else {
                throw {
                    message: "Programa cancelado debido a un posible bucle infinito en la línea " + line + ".",
                    line: line
                };
            }
        }
    };

    Runtime.prototype.stopLoop = function() {
        this.lastUpdate[this.deep] = null;
        this.nIterations[this.deep] = 0;
        this.timeLimit[this.deep] = 0;
        this.deep--;
    };

    Runtime.prototype.docall = function(fname, line) {
        if (!this.calls[fname + "__" + line]) {
            this.calls[fname + "__" + line] = 0;
        }
        this.calls[fname + "__" + line]++;
    };

    Runtime.prototype.doreturn = function(fname, line) {
        this.calls[fname + "__" + line]--;
    };

    Runtime.prototype.findMostCalledFunction = function() {
        var name = null;
        var line = 0;
        var max = 0;
        for (var key in this.calls) {
            if (this.calls[key] > max) {
                max = this.calls[key];
                name = key;
            }
        }
        if (name !== null) {
            var n = name.indexOf("__");
            var str = name.substring(n + 2);
            line = parseInt(str);
            name = name.substring(0, n);
            return {
                name: name,
                line: line,
                times: max
            };
        } else {
            return null;
        }
    };



    /****************************************************************************
     *                                                                          *
     *       iJava Public Interface                                             *
     *                                                                          *
     ****************************************************************************/

    this.stop = function() {
        noLoop();
        endRuntime();
        running = false;
        terminateRobot();
    };

    this.run = function(code) {
        if (running) return;
        execute(code);
    };

    this.setCanvas = function(newCanvas) {
        canvasID = newCanvas;
    };



    /****************************************************************************
     *                                                                          *
     *       ROBODE API                                                         *
     *                                                                          *
     ****************************************************************************/

    function esperar(millis) {

        //Add delay time to runtime.timeLimit
        if (runtime) {
            if (runtime.deep > -1) {
                runtime.timeLimit[runtime.deep] += millis;
            }
        }

        var timestamp = (new Date()).getTime() + millis;
        while ((new Date()).getTime() < timestamp) {
            //do nothing
        }
    }

    function iniciarRobot() {
        var message = {
            fn: "init",
            params: [canvasID]
        };
        sendMessage("robode", message);
    }

    // terminate robot execution
    function terminateRobot() {
        var message = {
            fn: 'end',
            params: []
        };
        sendMessage("robode", message);
    }

    function avanzarRobot(lspeed, rspeed) {
        var message = {
            fn: "move",
            params: [lspeed, rspeed]
        };
        sendMessage("robode", message);
    }

    function detenerRobot() {
        var message = {
            fn: "stop",
            params: []
        };
        sendMessage("robode", message);
    }


    /****************************************************************************
     *       Input/Output library                                               *
     ****************************************************************************/

    function error(e) {
        // En principio nos quedamos con el error
        var err = e;
        // Buscar dentro de runtime si hay alguna función muy llamada
        var mcf = runtime.findMostCalledFunction();
        if (mcf && mcf.times > 100) {
            err = {
                message: "Se ha producido un error durante la ejecución del programa. Probablemente se deba a que la función '" + mcf.name + "' es recursiva y no tiene bien definido su caso base por lo que se está llamando a sí misma desde la línea " + mcf.line + " sin parar.",
                line: mcf.line
            };
        }
        if (errorHandler) errorHandler(err);
        else console.log(err);
        noLoop();
        endRuntime();
        running = false;
    }

    function print(msg) {
        if (msg === undefined) msg = "";
        if (msg instanceof __Object) {
            msg = msg.__toString__0();
        }
        if (outputHandler) outputHandler(msg);
        else console.log(msg);
    }

    function println(msg) {
        if (msg === undefined) msg = "";
        if (msg instanceof __Object) {
            msg = msg.__toString__0();
        }
        print(msg + "\n");
    }


    /****************************************************************************
     *       Output and Error Handlers                                          *
     *          Replaced by sending output/errors to compiler                   *
     ****************************************************************************/
    outputHandler = function(msg) {
        var data = (typeof msg === "string" ? msg : msg.__data);
        sendMessage("output", data);
    };

    errorHandler = function(msg) {
        sendMessage("error", msg.message);
    };


    /****************************************************************************
     *       Misscellaneous library                                             *
     ****************************************************************************/

    function isInt(n) {
        return Number.isInteger(n);
    }


    /****************************************************************************
     *       ANIMATION library                                                  *
     ****************************************************************************/

    /**
     * El parámetro t determina los milisegundos a esperar entre frames con un límite inferior de 10ms
     */
    function animate(f, t) {
        t = t || 40;
        if (t < 10) t = 10;
        loop(f, t);
    }

    function exit() {
        noLoop();
        endRuntime();
        running = false;
    }

    function loop(draw, t) {
        if (intervalStarted === true) noLoop();
        timeSinceLastFPS = Date.now();
        framesSinceLastFPS = 0;
        looping = setInterval(function() {
                try {
                    var sec = (Date.now() - timeSinceLastFPS) / 1E3;
                    framesSinceLastFPS++;
                    var fps = framesSinceLastFPS / sec;
                    if (sec > 0.5) {
                        timeSinceLastFPS = Date.now();
                        framesSinceLastFPS = 0;
                        frameRate = fps;
                    }
                    draw();
                } catch (e) {
                    error(e);
                }
            },
            t);
        intervalStarted = true;
    }

    function noLoop() {
        if (intervalStarted) {
            clearInterval(looping);
            intervalStarted = false;
            looping = null;
        }
    }

    /****************************************************************************
     *       Arrays and Strings Library                                         *
     ****************************************************************************/

    function sizeOf(array, dimension) {
        if (array instanceof __Object && array.isNull()) {
            throw {
                message: "Error al intentar usar la función sizeOf sobre 'null'.",
                line: 1
            };
        }
        if (array instanceof MyArray) {
            return array.sizeOf(dimension || 1);
        } else
        if (array instanceof __String) {
            return array.__length__0();
        }
    }

    function charArrayToString(array) {
        return (new __String()).__Constructor__1(array);
    }

    function stringToCharArray(string) {
        if (string instanceof __Object && string.isNull()) return string;
        return string.__toCharArray__0();
    }

    function charAt(string, index) {
        if (string instanceof __Object && string.isNull()) {
            throw {
                message: "Error al intentar usar la función charAt sobre 'null'.",
                line: 1
            };
        }
        return string.__charAt__0(index);
    }

    function concat(string1, string2) {
        if (string1 instanceof __Object && string1.isNull() && string2 instanceof __Object && string2.isNull()) {
            throw {
                message: "Error al intentar usar la función concat con dos valores parámetros a 'null'.",
                line: 1
            };
        }
        if (string1 instanceof __Object && string1.isNull()) {
            return (new __String()).__Constructor__2(string2);
        }
        return string1.__concat__0(string2);
    }

    function compare(string1, string2) {
        if (string1 instanceof __Object && string1.isNull() || string2 instanceof __Object && string2.isNull()) {
            throw {
                message: "Error al intentar usar la función compare cuando alguno de los dos parámetros es igual a 'null'.",
                line: 1
            };
        }
        return string1.__compareTo__0(string2);
    }

    function indexOf(string, character) {
        if (string instanceof __Object && string.isNull()) {
            throw {
                message: "Error al intentar usar la función indexo sobre 'null'.",
                line: 1
            };
        }
        return string.__indexOf__0(character);
    }


    /****************************************************************************
     *       Time library                                                    *
     ****************************************************************************/

    function year() {
        return new Date().getFullYear();
    }

    function month() {
        return new Date().getMonth() + 1;
    }

    function day() {
        return new Date().getDate();
    }

    function hour() {
        return new Date().getHours();
    }

    function minute() {
        return new Date().getMinutes();
    }

    function second() {
        return new Date().getSeconds();
    }

    function millis() {
        return (new Date().getTime()) - startTime.getTime();
    }


    /****************************************************************************
     *       Math library                                                       *
     ****************************************************************************/

    var PI = Math.PI;
    var E = Math.E;


    function random() {
        if (arguments.length === 0) return Math.random();
        if (arguments.length === 1) return Math.random() * arguments[0];
        if (arguments.length === 2) {
            a = arguments[0];
            b = arguments[1];
            return Math.random() * (b - a) + a;
        }
    }

    function floor(x) {
        return Math.floor(x);
    }

    function ceil(x) {
        return Math.ceil(x);
    }

    function round(x) {
        return Math.round(x);
    }

    function sin(x) {
        return Math.sin(x);
    }

    function cos(x) {
        return Math.cos(x);
    }

    function tan(x) {
        return Math.tan(x);
    }

    function asin(x) {
        return Math.asin(x);
    }

    function acos(x) {
        return Math.acos(x);
    }

    function atan(x) {
        return Math.atan(x);
    }

    function sqrt(x) {
        return Math.sqrt(x);
    }

    function abs(x) {
        return Math.abs(x);
    }

    function log(x) {
        return Math.log(x);
    }

    function pow(b, e) {
        return Math.pow(b, e);
    }

    /****************************************************************************
     *       Input Library                                                      *
     ****************************************************************************/

    /**
    Define una nueva función para leer datos a través de las funciones
    read*() para evitar que se pregunten al usuario.
    */
    // this.setInputStream = function(iostream) { //TODO: fix: internalPrompt
    //     self.standardInput = iostream;
    //     if (iostream === null) {
    //         internalPrompt = window.prompt;
    //     } else {
    //         internalPrompt = function(msg, initial) {
    //             var strs = self.standardInput.split("\n");
    //             if (self.sipointer >= strs.length) {
    //                 throw {
    //                     message: "Se ha llegado al final de los datos de entrada sin encontrar el tipo de dato buscado."
    //                 };
    //             }
    //             var str = strs[self.sipointer];
    //             self.sipointer++;
    //             return str;
    //         };
    //     }
    // };

    /* //TODO: fix internalPrompt
    function readInteger(msg) {
        if (!msg) msg = "Introduce un número entero";
        while (true) {
            var n = internalPrompt(msg, 0);
            if (n === null) throw {
                message: "Programa cancelado a petición del usuario"
            };
            if ((n !== "") && isFinite(n) && isInt(n)) return parseInt(n);
        }
    }

    function readDouble(msg) {
        if (!msg) msg = "Introduce un número real";
        while (true) {
            var n = internalPrompt(msg, 0.0);
            if (n === null) throw {
                message: "Programa cancelado a petición del usuario"
            };
            if ((n !== "") && isFinite(n)) return parseFloat(n);
        }
    }

    function readString(msg) {
        if (!msg) msg = "Introduce una cadena de texto";
        var str = internalPrompt(msg, "");
        if (str === null) throw {
            message: "Programa cancelado a petición del usuario"
        };
        return new __String(str);
    }

    function readChar(msg) {
        if (!msg) msg = "Introduce un carácter";
        var c = null;
        do {
            c = internalPrompt(msg); //readString(msg);
            if (c === null) throw {
                message: "Programa cancelado a petición del usuario"
            };
        } while (c.length != 1);
        return c[0];
    }
    */
}
