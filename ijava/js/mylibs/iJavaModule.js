function iJavaModule(name, description) {

    this.name = name;
    this.description = description;

    var elems2export = [];



    this.getElems2export = function() {
        return elems2export;
    };


    this.makeDatatype = function(typestr, returnTypeStr, typeStrParams) {
        if (typestr === "function") {
            return make_function(returnTypeStr, typeStrParams);
        } else {
            return make_variable_type(typestr);
        }
    };

    this.add_function = function(id, datatype) {
        elems2export.push(make_token(id, "function", [{
            datatype: datatype
        }]));
    };

    this.add_class = function(id) {
        elems2export.push(make_token(id, "class"));
    };

    this.add_keyword = function(id, stm) {
        elems2export.push(make_token(id, "keyword", [{
            stm: stm
        }]));
    };


    this.add_systemvariable = function(id, datatype, value) {
        elems2export.push(make_token(id, "systemvariable", [{
            datatype: datatype
        }, {
            value: value
        }]));
    };

    this.add_constant = function(id, datatype, value) {

        elems2export.push(make_token(id, "constant", [{
            datatype: datatype
        }, {
            value: value
        }]));

    };


    // Make a language element (function, constant...) by its identifier and type
    function make_token(id, type, args) {
        var token = {
            id: id,
            type: type,
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

        console.log(typeStrParams);

        var rtype = returnTypeStr || 'void';
        var params = [];

        if (typeof returnTypeStr !== "undefined") {
            rtype = make_variable_type(returnTypeStr);
        }

        if ((typeof typeStrParams) !== "undefined") {

            typeStrParams.forEach(function(elem) {
                console.log('elem', elem);

                params.push({
                    datatype: make_variable_type(elem)
                });
            });

        }
        console.log(params);
        //if rtype or params is undefined then the function has no return type and/or params
        return new FunctionDatatype(rtype, params);


    }


}