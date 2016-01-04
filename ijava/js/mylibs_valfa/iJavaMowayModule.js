function iJavaMowayModule() {

    function square(width, height) {
        /* Sería conveniente comprobar que el canvas es cuadrado
        y realizar una medida del canvas dinámica a casi cualquier tamaño.
        Iría aquí. */

        var NUM_SQUARE = 8;
        var width = canvas.getAttribute("width"); //ancho
        var height = canvas.getAttribute("height"); //alto

        return { // info relativa a las casillas
            total: NUM_SQUARE,
            width: width / NUM_SQUARE,
            height: height / NUM_SQUARE
        }
    }

    function getRelPos() {
        coordX = coordX || 0;
        coordY = coordY || 0;

        return {
            X: coordX * square().width,
            Y: coordY * square().height
        }
    }

    function drawStage() {
        var totalSquare = square().total;
        var widthSquare = square().width;
        var heightSquare = square().height;

        background(248, 248, 248); //beige

        for (var i = 0; i < totalSquare; i++) {
            line(i * widthSquare, 0, i * widthSquare, heightSquare * totalSquare);
            line(0, i * heightSquare, widthSquare * totalSquare, i * heightSquare);
        }
        // draw botton and right borders
        line(widthSquare * totalSquare - 1, 0, widthSquare * totalSquare - 1, heightSquare * totalSquare - 1);
        line(0, heightSquare * totalSquare - 1, widthSquare * totalSquare - 1, heightSquare * totalSquare - 1);
    }


    function drawRobot() {
        var srcImg = 'images/roboicon.png';

        var img = new Image();
        img.src = srcImg;
        img.id = srcImg;
        // img.ready = false;

        // img.onload = function() {
        // 	// Cada vez que se carga una imagen reseteo el contador de tiempo máximo para la siguiente
        // 	startPrecarga = new Date();
        // 	this.ready = true;
        // 	pendingImages--;
        // };
        // imagesCached[img.id] = img;
        // pendingImages++;
        // totalImages++;

        posX = getRelPos().X;
        posY = getRelPos().Y;

        // Primero limpiamos el escenario y luego pintamos el robot
        drawStage();
        context.drawImage(img, posX, posY, square().width, square().height);

        //self.preloadImage(srcImg);
        //image(srcImg,320/2-20,320/2-20,40,40);

    }

    function moveS() {
        coordY += 1;
        drawRobot(); //Redibujamos el robot
    }

    function moveN() {
        coordY -= 1;
        drawRobot(); //Redibujamos el robot
    }

    function moveW() {
        coordX -= 1;
        drawRobot(); //Redibujamos el robot
    }

    function moveE() {
        coordX += 1;
        drawRobot(); //Redibujamos el robot
    }

    var coordX, coordY;


    function initSimuRobo() {
        drawRobot();
    }


    this.getFunctionsLibrary = function() {

        return [{
            nameFunction: "initSimuRobo",
            returnType: VoidDatatype,
            paramTypes: null
        }, {
            nameFunction: "moveN",
            returnType: VoidDatatype,
            paramTypes: null
        }, {
            nameFunction: "moveS",
            returnType: VoidDatatype,
            paramTypes: null
        }, {
            nameFunction: "moveE",
            returnType: VoidDatatype,
            paramTypes: null
        }, {
            nameFunction: "moveW",
            returnType: VoidDatatype,
            paramTypes: null
        }];
    }

    //	this.getFunctions = function (){
    //
    //		var fun = {};
    //		for (var key in this) {
    //			console.log(key);
    //		}
    //		return fun;
    //	}


    //TODO esto creo que no hace falta pero de momento
    this.getSystemVariablesLibrary = function() {

        return [{
            nameVariable: "coordX",
            variableType: IntegerDatatype,
            initValue: 0
        }, {
            nameVariable: "coordY",
            variableType: IntegerDatatype,
            initValue: 0
        }];

    }


}