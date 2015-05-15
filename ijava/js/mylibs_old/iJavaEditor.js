function iJavaEditor(textAreaEditorId, runButtonId, canvasId, outputTextareaId, errorDivId) {
  var editor = null;
  var compiler = null;
  var output = null;
  var compileroutput = null;
  var running = false;
  var modified = false;

	output = document.getElementById(outputTextareaId);
	compileroutput = document.getElementById(errorDivId);

	var iJavaLinter = function(s,cm) {
		var annotations = [];
		var errors = [];
		// Por si se llama a iJavalinter antes de estar cargado el editor (raro pero paso)
		if (!editor || !compiler) return annotations;
		errors = compiler.parse(editor.getValue());
		outputHandler.clear();
		errorHandler.clear();
		for ( var i = 0 ; i < errors.length  ; i++ ) {
			var e = errors[i];
			annotations.push({
				from: CodeMirror.Pos(e.line-1, 0),
				to: CodeMirror.Pos(e.line-1, 0),
				severity: e.severity,
				message: e.message
			});
			errorHandler.manage(errors[i]);
		}
		if (annotations.length > 0) {
			output.style.display = "none";
		}
		if (annotations.length === 0 && running) {
			compiler.stop();
			compiler.run(editor.getValue(), canvasId);
		}
		return annotations;
	};

	var colorPickerActive = false;
	var taeditor = document.getElementById(textAreaEditorId);
	var cphthml = "<div id='dialogo'><input type='text' id='colorPicker'></div>";
	$(cphthml).insertBefore(taeditor);

	editor = CodeMirror.fromTextArea(taeditor, {
	  lineNumbers: true,
	  matchBrackets: true,
	  autoCloseBrackets: true,
	  styleActiveLine:true,
	  tabSize:2,
	  indentUnit:2,
	  mode: "text/x-ijava",
	  gutters: ["CodeMirror-lint-markers"],
	  lint: {
	        getAnnotations: iJavaLinter,
	        delay: 1200
	  },
	  theme: "neat"
	});

	editor.setSize("100%","100%");
	editor.setOption("theme", "neat");

	editor.getDoc().on("change", function(doc, change) {
		modified = true;
		// Guardar doc en localstorage
	});

	function parseColors(line) {
		// Saltar espacios
		var i = 0;
		var L = line.length;
		var colors = ["", "", "", ""];
		var base = ["0", "0", "0", "1"];
		var nColors = 0;
		while (i < L && line[i] === " ") i++;
		if (line[i] === "(") {
			i++;
			var opens = 1;
			while (i < L) {
				if (line[i] == "(") opens++;
				if (line[i] == ")") opens--;
				if (opens === 0 || line[i] == ",") break;
				colors[nColors] += line[i];
				i++;
			}
			if (i < L && line[i] == ",") {
				nColors++;
				i++;
				while (i < L) {
					if (line[i] == "(") opens++;
					if (line[i] == ")") opens--;
					if (opens === 0 || line[i] == ",") break;
					colors[nColors] += line[i];
					i++;
				}
				if (i < L && line[i] == ",") {
					nColors++;
					i++;
					while (i < L) {
						if (line[i] == "(") opens++;
						if (line[i] == ")") opens--;
						if (opens === 0 || line[i] == ",") break;
						colors[nColors] += line[i];
						i++;
					}
					if (i < L && line[i] == ",") {
						nColors++;
						i++;
						while (i < L) {
							if (line[i] == "(") opens++;
							if (line[i] == ")") opens--;
							if (opens === 0 || line[i] == ",") break;
							colors[nColors] += line[i];
							i++;
						}
						if (i < L && line[i] !== ")") console.log("error raro");
					}
				}
			}
		}
		for ( var j = 0 ; j < 4 ; j++ ) {
			colors[j] = colors[j].trim();
			if (colors[j] === "") colors[j] = base[j];
		}
		return {
			call: line.substring(0,i+1),
			colors: colors
		};
	}

	editor.on("mousedown", function (cm, event) {
	    if (colorPickerActive) {
		    $('#dialogo').css({
		        display: "none"
		    });
	    	colorPickerActive = false;
	        return false;
	    }
		var coords = cm.coordsChar({left:event.pageX, top:event.pageY});
		var token = cm.getTokenAt(coords);
	    var line = editor.getLine(coords.line);
	    if (token.string === "fill" || token.string === "background" || token.string === "stroke") {
	        var currentColor = "0,0,0";
	        var current = parseColors(line.substring(token.end));
	        if (current) {
	            var r = isNaN(current.colors[0]) ? "0" : current.colors[0];
	            var g = isNaN(current.colors[1]) ? "0" : current.colors[1];
	            var b = isNaN(current.colors[2]) ? "0" : current.colors[2];
	            var a = 1;
	            if (current.colors[3] !== "") a = isNaN(current.colors[3]) ? "0" : current.colors[3];
	            currentColor = "" + r + "," + g + "," + b + "," + a;
	        }
		    $('#dialogo').css({
		        top: event.pageY,
		        left: event.pageX,
		        display: "block"
		    });
		    colorPickerActive = true;
	        var from = {
	            line: coords.line,
	            ch: token.start + token.string.length
	        };
	        var to = {
	            line: coords.line,
	            ch: token.start + token.string.length + current.call.length
	        };
	        $("#colorPicker").spectrum.from = from;
	        $("#colorPicker").spectrum.to = to;
	        // TODO: sacar rgba sólo cuando interese, para básicos sacar rgb
	        $("#colorPicker").spectrum('set', 'rgba(' + currentColor + ')');
	    }
	    return false;
	});

	$('#colorPicker').spectrum({
		flat: true,
	    showInput: false,
	    showInitial: true,
	    chooseText: "Elegir",
	    cancelText: "Cancelar",
	    showAlpha: true,

	    change: function (c) {
	        var color = c.toRgb(),
	            from = $("#colorPicker").spectrum.from,
	            to = $("#colorPicker").spectrum.to;
	        var str = "(" + color.r + "," + color.g + "," + color.b;
	        if (color.a < 1.0) str += "," + color.a;
	        str += ")";
	        if (from) {
	            editor.getDoc().replaceRange(str, from, to);
	        }
		    $('#dialogo').css({
		        display: "none"
		    });
	    	colorPickerActive = false;

	    }
	});

	function addErrorEvent(element, line) {
		if(element.addEventListener){
			element.addEventListener("click", function() {
				editor.scrollIntoView({line:line-1,ch:0});
			});
		} else {
			element.attachEvent("click", function() {
				editor.scrollIntoView({line:line-1,ch:0});
			});
		}
	}

	function addErrorLine(error) {
		var par = document.createElement("p");
		var msg = document.createTextNode(error.message);
		var line = document.createElement("a");
		line.innerHTML = "Línea " + error.line + ": ";
		addErrorEvent(line, error.line);
		par.appendChild(line);
		par.appendChild(msg);
		compileroutput.appendChild(par);
	}

	var errorHandler = {
		manage:
		function(e) {
		  addErrorLine(e);
		},
		clear:
		function() {
			if (compileroutput)	compileroutput.innerHTML = "";
		}
	};

	var outputHandler = {
		print:
		function(msg) {
			if (output) {
				output.innerHTML += msg;
				output.scrollTop = output.scrollHeight - output.clientHeight;
			}
		},
		clear:
		function() {
			if (output) output.innerHTML = "";
		}
	};

	compiler = new iJavaCompiler();
	compiler.setOutputHandler(outputHandler);
	compiler.setErrorHandler(errorHandler);

	this.run = function() {
		if (running) {
			this.stop();
		} else {
			output.style.display = "block";
			outputHandler.clear();
			errorHandler.clear();
			running = compiler.run(editor.getValue(), canvasId);
			if (running) {
				var b = document.getElementById(runButtonId);
				b.value = "Parar";
				running = true;
			}
		}
	};

	this.stop = function() {
		compiler.stop();
		var b = document.getElementById(runButtonId);
		b.value = "Probar";
		running = false;
	};

	this.setValue = function(source) {
	  editor.setValue(source);
	  modified = false;
	};

	this.getValue = function() {
	  return editor.getValue();
	};

	this.hasChanged = function() {
	  return modified;
	};

	this.getIcon = function() {
	  return compiler.getIcon(editor.getValue());
	};

	this.getKeyPoints = function() {
	  return compiler.getKeyPoints(editor.getValue());
	};
}

