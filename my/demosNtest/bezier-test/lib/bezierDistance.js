"use strict";

function BezierDistance() {

	//FIXME: eliminar toda referencia a point2d y Vector2d y utilizar {x : _X, y: _Y}


	//TODO: eliminar
	var color_console = "background: #222; color: #ccdc55";

	var utils = {
		MAXDEPTH: 64, // Maximum depth for recursion

		EPSILON: ldexp(1.0, -(this.MAXDEPTH - 1)), //Flatness control value
		DEGREE: 3, // Cubic Bezier curve
		W_DEGREE: 5 // Degree of eqn to find roots of
	};

	/* ConvertToBezierForm :
		 Given a point and a Bezier curve, generate a 5th-degree
		 Bezier-format equation whose solution finds the point on
		 the curve nearest the user-defined point.
		 Point2  P; 		The user-supplied point
		 Point2[] V;		Control points of cubic Bezier */
	var convertToBezierForm = function (P, V) {

		/* Puntos de control para la ecuación de 5º grado.
		Es una array de Point2  */
		// // console.log('wINICIAL:', w);
		var w = [];
		// Variable con los vectores: V[i] - P
		var c = [];
		// Variable con los vectores: V[i+1] - V[i]
		var d = [];
		// Producto vectorial de los valores en 'c' y 'd'. Es una matriz
		var cdTable = [[], [], []];
		/* Valores precalculados de 'z' para curvas de bezier cúbicas */
		var z = [
						[1.0, 0.6, 0.3, 0.1],
						[0.4, 0.6, 0.6, 0.4],
						[0.1, 0.3, 0.6, 1.0]
				];

		/* Calculamos los valores de 'c'. Son vectores creados por restar el P a cada punto de control de V */
		for (var i = 0; i <= utils.DEGREE; i++) {
			c[i] = V2Sub(V[i], P);
		}

		/* Calculamos los valores de 'd'. Son vectores creados por
		restar cada punto de control al siguiente. */
		for (var i = 0; i <= utils.DEGREE - 1; i++) {
			var aux = V2Sub(V[i + 1], V[i]);
			d[i] = V2ScaleII(aux, 3.0);
		}

		/* Rellenamos la tabla de productos vectoriales de 'c'
		y 'd'. */
		for (var row = 0; row <= utils.DEGREE - 1; row++) {
			for (var column = 0; column <= utils.DEGREE; column++) {
				cdTable[row][column] = V2Dot(d[row], c[column]);
			}
		}


		/* Ahora, aplicamos 'z' al producto vectorial de cdTable
		en la diagonal. También establecemos los valores de la
		coordenada X, creando los puntos. */
		// // console.log('Before w:', w);
		for (var i = 0; i <= utils.W_DEGREE; i++) {
			w[i] = new Point2();
			w[i].y = 0.0;
			w[i].x = i / utils.W_DEGREE;

			// // console.log('w[i]:', w[i]);
			// // console.log('Loop w:', w);
		}
		for (var key in w)
			w[key].y = 0.0;
		// // console.log('After w:', w);

		var n = utils.DEGREE,
			m = utils.DEGREE - 1;
		var lb, ub, i, j;

		for (var k = 0; k <= (n + m); k++) {
			lb = Math.max(0, k - m);
			ub = Math.min(k, n);
			for (i = lb; i <= ub; i++) {
				j = k - i;
				w[i + j].y += cdTable[j][i] * z[j][i];
			}
		}
		// // console.log('c:', c);
		// // console.log('d:', d);
		// // console.log('cdTable:', cdTable);
		// // console.log('w:', w);

		return w;

	}

	/*	Dada una equación de 5º grado con forma Bernstein-Bezier,
	se buscan todas las raice en el intervalo t[0,1]. Devuelve
	los valores de 't' candidatos. Params:
	w [] Point2 	Puntos de control
	degree 			el grado del polinomio.
	depth 			la profundidad de la recursitividad */
	var findRoots = function (w, degree, depth) {
		// //console.log('depth:', depth);
		// Valores de 't' candidatos
		var t = [];

		switch (CrossingCount(w, degree)) {

		case 0: // No hay soluciones
			// //			console.log('depth:', depth);
			// //			console.log('%c NO HAY ROOTS', color_console);
			return {
				num: 0,
				candidates: []
			}

		case 1: //Solución única
			/* Se detiene la recursividad cuando la profundidad
			es demasiado profunda. Si ese es el caso, devuelve
			una solución a la mitad de t. */

			if (depth >= utils.MAXDEPTH) {
				t.push((w[0].x + w[utils.W_DEGREE].x) / 2.0);
				// console.log('t:', t);
				return {
					num: 1,
					candidates: t
				}
			}
			if (ControlPolygonFlatEnough(w, degree)) {
				t.push(ComputeXIntercept(w, degree));
				// console.log('t:', t);
				return {
					num: 1,
					candidates: t
				}
			}
			break;
		}
		/* Sino, se resulve recursivamente despues de subdividir
		el polygono de control */
		var left = [],
			right = [],
			leftAux, rightAux,
			left_c, right_c;

		Bezier(w, degree, 0.5, left, right);
		leftAux = findRoots(left, degree, depth + 1);
		rightAux = findRoots(right, degree, depth + 1);

		left_c = leftAux.candidates;
		right_c = rightAux.candidates;

		// //		console.log('left_c:', left_c);
		// //		console.log('right_c:', right_c);
		// //		console.log('antes t:', t);

		// Juntamos las soluciones parciales:
		for (var i = 0; i < leftAux.num; i++) {
			t.push(left_c[i]);
		}

		for (var i = 0; i < rightAux.num; i++) {
			t.push(right_c[i]);
		}
		if (leftAux.num + rightAux.num > 1) {
			// console.log('%c return t', color_console, t);
		}

		// console.log('%c return t', color_console, t);

		// Devolvemos el t actual y el número de soluciones
		return {
			num: leftAux.num + rightAux.num,
			candidates: t
		}

	}



	/* Cuenta el nº de veces que el polygono de control de Bezier
	cruza el eje de coordenadas 'X'. Este número es >= que el
	nº de raices. Params:
	V [] Point2 	Puntos de control
	degree 			el grado del polinomio.*/
	var CrossingCount = function (V, degree) {
		// Nº de cruces
		var n_crossings = 0;

		// Comprobamos el signo en el eje Y
		var sign = SGN(V[0].y); // Signo de los coeficientes.
		var old_sign = sign;

		for (var i = 1; i <= degree; i++) {
			sign = SGN(V[i].y);
			if (sign != old_sign)
				n_crossings++;
			old_sign = sign;
		}

		// Comprobamos el signo en el eje X
		sign = SGN(V[0].x);
		old_sign = sign;
		for (var i = 1; i <= degree; i++) {
			sign = SGN(V[i].x);
			if (sign != old_sign)
				n_crossings++;
			old_sign = sign;
		}

		//		if (n_crossings > 1)
		//			console.log('n_crossings:', n_crossings);
		return n_crossings;
	}


	/* Comprueba si el poligono de control de una curva de Bezier
	es lo suficientemente plano para realizar una subdivision recursiva.
	Params:
	V [] Point2 	Puntos de control
	degree 			el grado del polinomio.*/
	var ControlPolygonFlatEnough = function (V, degree) {

		var value;
		var max_distance_above,
			max_distance_below;
		var error; // Precisión de la raiz;
		var intercept_1,
			intercept_2,
			left_intercept,
			right_intercept;
		/* Coefficients of implicit eqn for line from V[0]-V[deg] */
		var a, b, c;
		var det, dInv;
		var a1, b1,
			c1, a2,
			b2, c2;

		/* Derive the implicit equation for line connecting first
		and last control points */
		a = V[0].y - V[degree].y;
		b = V[degree].x - V[0].x;
		c = V[0].x * V[degree].y - V[degree].x * V[0].y;

		max_distance_above = max_distance_below = 0.0;

		for (var i = 1; i < degree; i++) {
			value = a * V[i].x + b * V[i].y + c;

			if (value > max_distance_above) {
				max_distance_above = value;
			} else if (value < max_distance_below) {
				max_distance_below = value;
			}
		}

		/*  Implicit equation for zero line */
		a1 = 0.0;
		b1 = 1.0;
		c1 = 0.0;

		/*  Implicit equation for "above" line */
		a2 = a;
		b2 = b;
		c2 = c - max_distance_above;

		det = a1 * b2 - a2 * b1;
		dInv = 1.0 / det;

		intercept_1 = (b1 * c2 - b2 * c1) * dInv;

		/*  Implicit equation for "below" line */
		a2 = a;
		b2 = b;
		c2 = c - max_distance_below;

		det = a1 * b2 - a2 * b1;
		dInv = 1.0 / det;

		intercept_2 = (b1 * c2 - b2 * c1) * dInv;

		/* Compute intercepts of bounding box    */
		left_intercept = Math.min(intercept_1, intercept_2);
		right_intercept = Math.max(intercept_1, intercept_2);

		error = right_intercept - left_intercept;

		return (error < utils.EPSILON) ? 1 : 0;
	}

	/*	Calcula la intersección ("of chord")  desde el primer punto de
	control hasta el último en el eje de coordenadas X.
	NOTA: 'T' e 'Y' no se necesitan y son inútiles (ejemplo: 0.0 - 0.0).
	Params:
	V [] Point2 	Puntos de control
	degree 			el grado del polinomio.*/
	var ComputeXIntercept = function (V, degree) {
		var XLK, YLK, XNM, YNM, XMK, YMK;
		var det, detInv;
		var S, T;
		var X, Y;

		XLK = 1.0;
		YLK = 0.0;
		XNM = V[degree].x - V[0].x;
		YNM = V[degree].y - V[0].y;
		XMK = V[0].x;
		YMK = V[0].y;

		det = XNM * YLK - YNM * XLK;
		detInv = 1.0 / det;

		S = (XNM * YMK - YNM * XMK) * detInv;
		/*  T = (XLK*YMK - YLK*XMK) * detInv; */

		X = XLK * S;
		/*  Y = 0.0 + YLK * S; */

		return X;

	}


	/* Evalua una curva de Bezier con un 't' concreto.
	Calcula los puntos de control de las sub-curvas resultantes si
	'left' y 'right' no son 'undefined' (null).
	Params:
	V [] Point2 	Puntos de control
	degree 			el grado del polinomio.
	t				valor concreto de 't'
	Point2 left y Point2 right : Puntos de control de las mitades. */
	var Bezier = function (V, degree, t, left, right) {

		var Vtemp = [];
		// Inicializamos Vtemp
		for (var i = 0; i < utils.W_DEGREE + 1; i++) {
			Vtemp[i] = [];
			for (var j = 0; j < utils.W_DEGREE + 1; j++) {
				Vtemp[i][j] = new Point2();
			}
		}


		// Copiamos los puntos de control
		for (var j = 0; j <= degree; j++) {
			Vtemp[0][j] = V[j];
		}

		/* Triangle computation */
		for (var i = 1; i <= degree; i++) {
			for (var j = 0; j <= degree - i; j++) {
				Vtemp[i][j].x =
					(1.0 - t) * Vtemp[i - 1][j].x + t * Vtemp[i - 1][j + 1].x;
				Vtemp[i][j].y =
					(1.0 - t) * Vtemp[i - 1][j].y + t * Vtemp[i - 1][j + 1].y;
			}
		}

		if (typeof left !== 'undefined')
			for (var j = 0; j <= degree; j++)
				left[j] = Vtemp[j][0];


		if (typeof right !== 'undefined')
			for (var j = 0; j <= degree; j++)
				right[j] = Vtemp[degree - j][j];

		return Vtemp[degree][0];
	}


	return {
		/*
		Point2  P;	The user-supplied point
		Point2[] V;	Control points of cubic Bezier */
		nearestPoint: function (P, V) {

			/* Puntos de control para la ecuación de 5º grado.
			Es una array de Point2  */
			var w = [];
			// Valor de t al punto más cercano. Inicialmente al inicio
			var t = 0.0;

			// Convierte el problema de 5º grado a forma de Bezier
			w = convertToBezierForm(P, V);
			// console.log('w:', w);
			var tAux = findRoots(w, utils.W_DEGREE, 0);

			/* Posibles raices (valores de 't' para
				los puntos cercanos de la curva al Punto P)*/
			var t_candidate = tAux.candidates;
			// //console.log('t_candidate:', t_candidate);

			/* Comparamos distancias desde P a todos los candidatos
				a puntos cercanos a P. Contamos con t=0 y t=1 también. */
			var dist, new_dist;
			var p = new Point2();

			/* Comprobamos la distancia desde el comienzo de la curva
				al punto P */
			dist = V2SquaredLength(V2Sub(P, V[0]));
			// //		console.log('new_dist:', dist, 't:', t);
			// t = 0.0; // Inicialmente ya vale 0.0

			// Buscamos las distancias con los puntos candidatos
			for (var i = 0; i < tAux.num; i++) {
				p = Bezier(V, utils.DEGREE, t_candidate[i]);
				new_dist = V2SquaredLength(V2Sub(P, p));
				// //			console.log('new_dist_c:', new_dist, 't:', t_candidate[i]);
				// //			console.log('p:', p);
				if (new_dist <= dist) {
					dist = new_dist;
					t = t_candidate[i];
				}
			}

			/* Por último, buscamos la distancia al punto final,
				con t=1.0 */
			new_dist = V2SquaredLength(V2Sub(P, V[utils.DEGREE]));
			// // console.log('new_dist:', new_dist, 't:', 1.0);
			if (new_dist < dist) {
				dist = new_dist;
				t = 1.0;
			}

			// // console.log('distFIN:', new_dist);
			console.log("Valor de t:", t);
			return Bezier(V, utils.DEGREE, t)



		}
	}



}