// importScripts('Datatype.js');
importScripts('OOSupport.js');

var sandbox = new iJavaSandbox();

self.onmessage = function(e) {
    console.log('worker: msg from compiler ', e.data);
    var obj = JSON.parse(e.data);
    switch (obj.order) {
        case "run":
            sandbox.run(obj.msg);
            break;
        case "stop":
            sandbox.stop(obj.msg);
            break;
        default:

    }
};


function iJavaSandbox() {

    var runtime = null;

    var outputHandler = null;
    var errorHandler = null;

    var eventHandlers = [];

    // var key = NullObject; //TODO: maybe convert to js object // Objeto de tipo String (o null) que contendrá la tecla pulsada
    var keys = {};
    var keyPressed = false;
    var keysPressed = 0;
    var keyStack = []; // Pila de teclas pulsadas para actualizar key al ir soltando teclas

    // Para que los defina el usuario
    var onKeyPressed = null;
    var onKeyReleased = null;

    var mousePressed = false;
    var mouseButton = 0; // 1 LEFT 2 CENTER 3 RIGHT
    var mouseX = 0;
    var mouseY = 0;

    var running = false;

    var startTime = new Date();
    var intervalStarted = false;
    var looping = null;
    var timeSinceLastFPS = null;
    var framesSinceLastFPS = 0;
    var frameRate = 0;

    // Variables para el precargador de imágenes //TODO: remove all variables
    var imagesCached = {};
    var startPrecarga = null;
    var pendingImages = 0;
    var totalImages = 0;
    var pendingCode = null;

    // Variable autoreferencia
    var self = this;

    // Variable para simular entrada de texto desde BBDD //TODO: remove?
    self.standardInput = null;
    self.sipointer = 0;
    // internalPrompt = window.prompt; //FIXME: internalPrompt is not working. Is it needed?

    // Keyboard
    // var isCoded = function(e) {
    //     return (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey);
    // };

    // var updateSpecialKeys = function(e) {
    //     if (e.shiftKey) {
    //         if (!keys['shift']) keysPressed++;
    //     } else {
    //         if (keys['shift']) keysPressed--;
    //     }
    //     if (e.ctrlKey) {
    //         if (!keys['control']) keysPressed++;
    //     } else {
    //         if (keys['control']) keysPressed--;
    //     }
    //     if (e.altKey) {
    //         if (!keys['alt']) keysPressed++;
    //     } else {
    //         if (keys['alt']) keysPressed--;
    //     }
    //     if (e.metaKey) {
    //         if (!keys['meta']) keysPressed++;
    //     } else {
    //         if (keys['meta']) keysPressed--;
    //     }
    //     keys['shift'] = e.shiftKey;
    //     keys['ctrl'] = e.ctrlKey;
    //     keys['alt'] = e.altKey;
    //     keys['meta'] = e.metaKey;
    //     if (isCoded(e)) keyPressed = true;
    // };

    // var getKeyCode = function(e) {
    //     var code = e.key || e.keyCode || e.wich;
    //     if (typeof code == 'string') return code;
    //     switch (code) {
    //         case 16:
    //             return "shift";
    //         case 17:
    //             return "control";
    //         case 18:
    //             return "alt";
    //         case 8:
    //             return "backspace";
    //         case 9:
    //             return "tab";
    //         case 10:
    //             return "enter";
    //         case 13:
    //             return "return";
    //         case 27:
    //             return "esc";
    //         case 127:
    //             return "delete";
    //         case 20:
    //             return "capslk";
    //         case 33:
    //             return "pgup";
    //         case 34:
    //             return "pgdn";
    //         case 35:
    //             return "end";
    //         case 36:
    //             return "home";
    //         case 37:
    //             return "left";
    //         case 38:
    //             return "up";
    //         case 39:
    //             return "right";
    //         case 40:
    //             return "down";
    //         case 91:
    //             return "left-meta";
    //         case 93:
    //             return "right-meta";
    //     }
    //     if (code >= 32 && code < 127) return String.fromCharCode(code).toLowerCase();
    // };

    // function suppressKeyEvent(e) {
    //     if (typeof e.preventDefault === "function") e.preventDefault();
    //     else if (typeof e.stopPropagation === "function") e.stopPropagation();
    //     return false;
    // }

    // // var handleKeydown = function(e) {
    //     var k = getKeyCode(e);
    //     if (k) {
    //         keyPressed = true;
    //         if (!keys[k]) {
    //             keysPressed++;
    //             keys[k] = true;
    //             key = new __String(k);
    //             keyStack[keysPressed - 1] = k;
    //             /* Los eventos los genera el canvas por lo que al generarse una excepción no la captura el try
    //             del eval que se hace en la función execute. Por eso hay que ponerlo aquí */
    //             try {
    //                 if (onKeyPressed !== null) onKeyPressed(key);
    //             } catch (e) {
    //                 error(e);
    //             }
    //         }
    //     }
    //     return suppressKeyEvent(e);
    // };

    // var handleKeypress = function(e) {
    //     return suppressKeyEvent(e);
    // };

    // var handleKeyup = function(e) {
    //     var k = getKeyCode(e);
    //     if (k) {
    //         if (keys[k]) {
    //             keysPressed--;
    //             keys[k] = false;
    //             if (keysPressed === 0) {
    //                 keyPressed = false;
    //                 key = NullObject;
    //             } else {
    //                 // Elimino de la pila la tecla soltada que puede no ser la última y
    //                 // actualizo key a la última que haya pulsada de la pila.
    //                 for (var i = 0; i < keysPressed; i++) {
    //                     if (keyStack[i] == k) {
    //                         for (var j = i; j < keysPressed; j++) {
    //                             keyStack[j] = keyStack[j + 1];
    //                         }
    //                         break;
    //                     }
    //                 }
    //                 key = new __String(keyStack[keysPressed - 1]);
    //             }
    //             /* Los eventos los genera el canvas por lo que al generarse una excepción no la captura el try
    //             del eval que se hace en la función execute. Por eso hay que ponerlo aquí */
    //             try {
    //                 if (onKeyReleased !== null) onKeyReleased(new __String(k)); // Pasamos la tecla que se ha soltado
    //             } catch (e) {
    //                 error(e);
    //             }
    //         }
    //     }
    //     return suppressKeyEvent(e);
    // };

    // Mouse

    /* // Note to Alber: comment by jlaguna
    var updateMousePosition = function(curElement, event) {
        console.log(event);
      if (event.layerX || event.layerX == 0) { // Firefox
        mouseX = event.layerX;
        mouseY = event.layerY;
      } else if (event.offsetX || event.offsetX == 0) { // Opera
        mouseX = event.offsetX;
        mouseY = event.offsetY;
      }
      console.log(mouseX, mouseY);
    }
    */

    // function calculateOffset(curElement, event) {
    //     var element = curElement,
    //         offsetX = 0,
    //         offsetY = 0;
    //     if (element.offsetParent) {
    //         do {
    //             offsetX += element.offsetLeft;
    //             offsetY += element.offsetTop;
    //         } while (!!(element = element.offsetParent));
    //     }
    //     element = curElement;
    //     do {
    //         offsetX -= element.scrollLeft || 0;
    //         offsetY -= element.scrollTop || 0;
    //     } while (!!(element = element.parentNode));
    //     offsetX += stylePaddingLeft;
    //     offsetY += stylePaddingTop;
    //     offsetX += styleBorderLeft;
    //     offsetY += styleBorderTop;
    //     offsetX += window.pageXOffset;
    //     offsetY += window.pageYOffset;
    //     return {
    //         "X": offsetX,
    //         "Y": offsetY
    //     };
    // }

    // function updateMousePosition(curElement, event) {
    //     var offset = calculateOffset(curElement, event);
    //     mouseX = event.pageX - offset.X;
    //     mouseY = event.pageY - offset.Y;
    // }

    /*
    // http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
    function updateMousePosition(element, event) {
        var rect = element.getBoundingClientRect();
        mouseX = event.clientX - rect.left,
        mouseY = event.clientY - rect.top
    }
    */
    // var handleMouseMove = function(e) {
    //     updateMousePosition(canvas, e);
    // };

    // var handleMouseOut = function(e) {};

    // var handleMouseOver = function(e) {
    //     updateMousePosition(canvas, e);
    // };

    // var handleMouseDown = function(e) {
    //     mousePressed = true;
    //     switch (e.which) {
    //         case 1:
    //             mouseButton = LEFTBUTTON;
    //             break;
    //         case 2:
    //             mouseButton = MIDDLEBUTTON;
    //             break;
    //         case 3:
    //             mouseButton = RIGHTBUTTON;
    //             break;
    //     }
    // };

    // var handleMouseup = function(e) {
    //     mousePressed = false;
    // };

    // Event handlers helpers

    var attachEventHandler = function(elem, type, fn) {
        if (elem.addEventListener) elem.addEventListener(type, fn, false);
        else elem.attachEvent("on" + type, fn);
        eventHandlers.push({
            elem: elem,
            type: type,
            fn: fn
        });
    };

    var detachEventHandler = function(eventHandler) {
        var elem = eventHandler.elem;
        var type = eventHandler.type;
        var fn = eventHandler.fn;
        if (elem.removeEventListener) elem.removeEventListener(type, fn, false);
        else if (elem.detachEvent) elem.detachEvent("on" + type, fn);
    };


    var PI = Math.PI;
    var E = Math.E;
    // var LEFTBUTTON = 1;
    // var MIDDLEBUTTON = 2;
    // var RIGHTBUTTON = 3;

    // RunTime library

    function Runtime() {
        this.deep = -1;
        this.timeLimit = [];
        this.lastUpdate = [];
        this.nIterations = [];
        this.calls = {};
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
    // Arrays y Strings //TODO: check. I think i should keep this...

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

    // Time //TODO: check. Keep it?

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

    // Math

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

    // Input/Output

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
        removeHandlers();
        running = false;
    }

    function print(msg) {
        console.log(msg,'1----');
        if (msg === undefined) msg = "";
        if (msg instanceof __Object) {
            msg = msg.__toString__0();
        }
        console.log(msg,'----');
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

    function isInt(n) {
        return Number.isInteger(n);
    }

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

    function key(id) { //TODO: check
        return keys[id.toUpperCase()];
    }


    ///////////////////

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
        removeHandlers();
        running = false;
    }

    function loop(draw, t) {
        if (intervalStarted === true) noLoop();
        timeSinceLastFPS = Date.now();
        framesSinceLastFPS = 0;
        looping = window.setInterval(function() {
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
            window.clearInterval(looping);
            intervalStarted = false;
            looping = null;
        }
    }

    function installHandlers() {
        if (intervalStarted) noLoop();
        // var element = canvas ? canvas : window;
        // attachEventHandler(element, "keydown", handleKeydown);
        // attachEventHandler(element, "keypress", handleKeypress);
        // attachEventHandler(element, "keyup", handleKeyup);
        //
        // attachEventHandler(element, "mousemove", handleMouseMove);
        // attachEventHandler(element, "mouseout", handleMouseOut);
        // attachEventHandler(element, "mouseover", handleMouseOver);
        //
        // element.onmousedown = function() {
        //     element.focus();
        //     return false;
        // };
        //
        // attachEventHandler(element, "mousedown", handleMouseDown);
        // attachEventHandler(element, "mouseup", handleMouseup);
        //
        // attachEventHandler(element, "contextmenu", function(e) {
        //     e.preventDefault();
        //     e.stopPropagation();
        // });

        runtime = new Runtime();
    }

    function removeHandlers() {
        for (var i = 0; i < eventHandlers.length; i++) {
            detachEventHandler(eventHandlers[i]);
        }
        runtime = null;
    }

    var execute = function(code) {
        installHandlers();
        //      console.log("--------------\n");
        var thecode = "running = true;\nvar __main = null;\nvar __draw = null;\nvar __onKeyPressed = null;\nvar __onKeyReleased = null;\n" + code + "\nonKeyPressed = __onKeyPressed;\nonKeyReleased = __onKeyReleased;\n try {\n  if (__main) __main();\n  else stop();\n} catch (e) {\n  error(e);\n}\n\n";
        eval(thecode);
    };

    // iJava Public Interface

    this.stop = function() {
        noLoop();
        removeHandlers();
        running = false;
    };

    // Replaced by sending output/errors to compiler
    outputHandler = function(msg) {
        console.log('outputHandler', msg);
        postMessage(JSON.stringify({
            id: "output",
            msg: msg.__data
        }));
    };

    errorHandler = function(msg) {
        postMessage(JSON.stringify({
            id: "error",
            msg: msg.message
        }));
    };

    this.run = function(code) {
        if (running) return;
        //FIXME: delete pendingCode and startPrecarga (origin: pre-time to load images...)
        pendingCode = code;
        startPrecarga = new Date();
        execute(pendingCode);
    };

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
}
