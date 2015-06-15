'use strict';

/*******************
DATA TYPES
*******************/
function Point2(x, y) {
	this.x = x | 0.0;
	this.y = y | 0.0;
}

function Vector2(x, y) {
	this.x = x | 0.0;
	this.y = y | 0.0;
}



/*******************
BASIC FUNCTIONS
*******************/

/* a is a number */
function sqr(a) {
	return a * a;
}

/* take binary sign of 'a' (a number), either -1, or 1 if >= 0 */
function SGN(a) {
	return (a) < 0 ? -1 : 1;
}


/*******************
FUNCTIONS
*******************/

/* return x * (2 ^exp)    */
function ldexp(x, exp) {
	return x * (Math.pow(2, exp));
}


/* returns squared length of input vector
	variable 'a' es de tipo Vector2  */
function V2SquaredLength(a) {

	return sqr(a.x) + sqr(a.y);
}

/* return vector difference c = a-b
	'a' y 'b' son Vector2 */
function V2Sub(a, b) {
	var result = new Vector2();

	result.x = a.x - b.x;
	result.y = a.y - b.y;

	return result;
}


/* return  el producto vectorial de dos vectores (Vector2)
	'a' y 'b'. */
function V2Dot(a, b) {

	return ((a.x * b.x) + (a.y + b.y));
}

/*	'v' is a Vector2
		's' is a number (double)*/
function V2ScaleII(v, s) {
	var result = new Vector2();

	result.x = v.x * s;
	result.y = v.y * s;

	return result;
}