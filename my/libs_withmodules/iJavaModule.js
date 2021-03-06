function iJavaModule(name, description) {

    this.name = name;
    this.description = description;

    // parser elems list
    var elems2parser = [];
    // sandbox elems list
    var elems2sandbox = [];



    this.getElems2sandbox = function() {
        return elems2sandbox;
    };


    this.getElems2parser = function() {
        return elems2parser;
    };


    this.makeDatatype = function(typestr, returnTypeStr, typeStrParams) {
        if (typestr === "function") {
            return make_function(returnTypeStr, typeStrParams);
        } else {
            return make_variable_type(typestr);
        }
    };

    this.add_function = function(id, fun, datatype) {
        var tok = make_token(id, "function", [{
            datatype: datatype
        }]);
        elems2parser.push(tok);
        elems2sandbox.push({
            id: id,
            value: fun
        });
    };

    this.add_class = function(id, obj) {
        elems2parser.push(make_token(id, "class"));
        elems2sandbox.push({
            id: id,
            value: obj
        });
    };

    this.add_keyword = function(id, stm) {
        elems2parser.push(make_token(id, "keyword", [{
            stm: stm
        }]));
        elems2sandbox.push({
            id: id,
            value: stm
        });

    };


    this.add_systemvariable = function(id, datatype, value) {
        var tok = make_token(id, "systemvariable", [{
            datatype: datatype
        }, {
            value: value
        }]);
        elems2parser.push(tok);
        elems2sandbox.push({
            id: id,
            value: value
        });

    };

    this.add_constant = function(id, datatype, value) {
        var tok = make_token(id, "constant", [{
            datatype: datatype
        }, {
            value: value
        }]);
        elems2parser.push(tok);
        elems2sandbox.push({
            id: id,
            value: value
        });

    };


    // Make a language element (function, constant...) by its identifier and type
    function make_token(id, type, args) {
        var token = {
            id: id,
            type: type
        };
        args = args ||  [];
        args.forEach(function(elem) {
            for (var i in elem) {
                token[i] = elem[i];
            }
        });
        return token;
    }

    function make_variable_type(typestr) {

        typestr = typestr ||  "void";

        switch (typestr) {
            case 'int':
                return IntegerDatatype;
            case 'byte':
                return ByteDatatype;
            case 'short':
                return ShortDatatype;
            case 'long':
                return LongDatatype;
            case 'float':
                return FloatDatatype;
            case 'double':
                return DoubleDatatype;
            case 'char':
                return CharDatatype;
            case 'boolean':
                return BooleanDatatype;
            case 'string':
                return StringDatatype;
            case 'void':
                return VoidDatatype;
            case 'null':
                return new NullDatatype();
            case 'object':
                return ObjectDatatype;
            case 'array':
                return new ArrayDatatype();
            default:
                console.log('ERROR: the type: ', typestr, ' does not exist');
                break;
        }

    }

    function make_function(returnTypeStr, typeStrParams) {

        var rtype = returnTypeStr || 'void';
        var params = [];

        if (typeof returnTypeStr !== "undefined") {
            rtype = make_variable_type(returnTypeStr);
        }

        if ((typeof typeStrParams) !== "undefined") {

            typeStrParams.forEach(function(elem) {
                params.push({
                    datatype: make_variable_type(elem)
                });
            });

        }
        return new FunctionDatatype(rtype, params);


    }


}