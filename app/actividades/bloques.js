import Ember from 'ember';

/*
 * Representa un bloque
 * para el lenguaje de la actividad
 */
var Bloque = Ember.Object.extend({
  init() {
    // espera:
    // + id
    // + categoria
  },

  block_init() {
    // abstracta
  },

  /*jshint unused: vars*/
  block_javascript(block) {
    // abstracta
  },

  registrar_en_blockly() {
    var myThis = this;
    Blockly.Blocks[this.get('id')] = {
      init() {
        myThis.block_init(this);
      }
    };

    Blockly.JavaScript[this.get('id')] = function(block) {
      return myThis.block_javascript(block);
    };
  },

  instanciar_para_workspace() {
    this.registrar_en_blockly();

    var block_dom = Blockly.Xml.textToDom(
      '<xml>' + this.build() + '</xml>'
    );

    Blockly.Xml.domToWorkspace(Blockly.getMainWorkspace(), block_dom);
  },

  // reimplementar si se desean parametros ya aplicados
  get_parametros() {
    return [];
  },

  obtener_icono(nombre) {
    return new Blockly.FieldImage('iconos/' + nombre, 16, 16, '<');
  },

  // Escupe el código que va en el toolbox para el bloque
  build() {
    var str_block = '';
    str_block += '<block type="TIPO">'.replace('TIPO', this.get('id'));

    this.get_parametros().forEach(function(item) {
       str_block += item.build();
    });

    str_block += '</block>';
    return str_block;
  }
});

/*
 * Pide implementar sólo block_javascript
 * Sirve para pisar el JS que produce blockly
 */
var CambioDeJSDeBlocky = Bloque.extend({

  registrar_en_blockly() {
    var myThis = this;
    Blockly.JavaScript[this.get('id')] = function(block) {
      return myThis.block_javascript(block);
    };
  }
});

var VariableGet = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'variables_get');
  },

  block_javascript(block) {
    // Variable getter.
    var code = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'),
        Blockly.Variables.NAME_TYPE);
    return ['receptor.atributo("' + code + '")', Blockly.JavaScript.ORDER_ATOMIC];
  }

});


var VariableSet = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'variables_set');
  },

  block_javascript(block) {
    // Variable setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
        Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return 'programa.cambio_atributo("' + varName + '", function(){ return ' + argument0 + '; } );\n';
  }

});

/* ============================================== */

var VariableLocalGet = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'local_var_get');
  },

  block_javascript(block) {
    // Variable getter.
    var code = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'),
        Blockly.Variables.NAME_TYPE);
    return ['receptor.variable("' + code + '")', Blockly.JavaScript.ORDER_ATOMIC];
  }

});

/* ============================================== */

var VariableLocalSet = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'local_var_set');
  },

  block_javascript(block) {
    // Variable setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
        Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return 'programa.cambio_variable("' + varName + '", function(){ return ' + argument0 + '; } );\n';
  }

});

/* ============================================== */

var Procedimiento = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'procedures_defnoreturn');
  },

  block_javascript(block) {
    // Define a procedure with a return value.
    var funcName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);

    var branch = Blockly.JavaScript.statementToCode(block, 'STACK');

    if (Blockly.JavaScript.STATEMENT_PREFIX) {
      branch = Blockly.JavaScript.prefixLines(
          Blockly.JavaScript.STATEMENT_PREFIX.replace(/%1/g,
          '\'' + block.id + '\''), Blockly.JavaScript.INDENT) + branch;
    }

    if (Blockly.JavaScript.INFINITE_LOOP_TRAP) {
      branch = Blockly.JavaScript.INFINITE_LOOP_TRAP.replace(/%1/g,
          '\'' + block.id + '\'') + branch;
    }

    var args = [];
    for (var x = 0; x < block.arguments_.length; x++) {
      args[x] = Blockly.JavaScript.variableDB_.getName(block.arguments_[x],
          Blockly.Variables.NAME_TYPE);
    }

//    var code = 'function ' + funcName + '(' + args.join(', ') + ') {\n' +
//        branch + returnValue + '}';

    var args_string = args.map(function(i) { return '"' + i + '"'; }).join(', ');

    var code = 'programa.empezar_secuencia();\n' +
                branch +
                'programa.def_proc("' + funcName + '", [' + args_string  + ']);\n';

    code = Blockly.JavaScript.scrub_(block, code);
    Blockly.JavaScript.definitions_[funcName] = code;
    return null;
  }

});

/* ============================================== */

var Funcion = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'procedures_defreturn');
  },

  registrar_en_blockly() {
    // pisado porque provisoriamente se
    // usa el que viene con blockly
  }

});

/* ============================================== */

var CallNoReturn = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'procedures_callnoreturn');
  },

  block_javascript(block) {
    // Call a procedure with no return value.
    var funcName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
    var args = [];
    for (var x = 0; x < block.arguments_.length; x++) {
      args[x] = Blockly.JavaScript.valueToCode(block, 'ARG' + x,
          Blockly.JavaScript.ORDER_COMMA) || 'null';
      args[x] = 'function(){ return ' + args[x] + '; }';
    }
    function juntar_args() {
      if (args.length > 0) {
        return '[\n'  +  args.join(', \n')  + '\n]';
      } else {
        return '[]';
      }
    }
    // var code = funcName + '(' + args.join(', ') + ');\n';
    var code = 'programa.llamada_proc("' + funcName +
               '", ' + juntar_args() + ');\n';
    return code;
  }

});

/* ============================================== */

var CallReturn = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'procedures_callreturn');
  },

  block_javascript(block) {
    // Call a procedure with a return value.
    var funcName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
    var args = [];
    for (var x = 0; x < block.arguments_.length; x++) {
      args[x] = Blockly.JavaScript.valueToCode(block, 'ARG' + x,
          Blockly.JavaScript.ORDER_COMMA) || 'null';
      args[x] = 'function(){ return ' + args[x] + '; }';
    }
    var code = funcName + '(' + args.join(', ') + ')';
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  }

});

/* ============================================== */

var ParamGet = CambioDeJSDeBlocky.extend({

  init() {
    this._super();
    this.set('id', 'param_get');
  },

  block_javascript(block) {
    // Variable getter.
    var code = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'),
        Blockly.Variables.NAME_TYPE);

    // agrego parentesis para llamar al closure del parametro
    return ['receptor.parametro("' + code + '")', Blockly.JavaScript.ORDER_ATOMIC];
  }

});

/* ============================================== */

var AlEmpezar = Bloque.extend({

  init() {
    this._super();
    this.set('id', 'al_empezar_a_ejecutar');
  },

  block_init(block) {
    block.setColour(Blockly.Blocks.eventos.COLOUR);
    block.appendDummyInput()
        .appendField('Al empezar a ejecutar');
    block.appendStatementInput('program');
    block.setDeletable(false);
    block.setEditable(false);
    block.setMovable(false);
  },

  block_javascript(block) {
    var statements_program = Blockly.JavaScript.statementToCode(block, 'program');
    var r = 'programa.empezar_secuencia();\n';
    r += statements_program + '\n';
    r += 'programa.ejecutar(receptor);\n';
    return r;
  }

});


var Accion = Bloque.extend({

  block_init(block) {
    this._super(block);
    block.setColour(Blockly.Blocks.primitivas.COLOUR);
    block.setPreviousStatement(true);
    block.setNextStatement(true);
  },

  block_javascript(block) {
    return 'programa.hacer(' + this.nombre_comportamiento() + ', ' + this.argumentos() + ')\n';
  }

});

var Sensor = Bloque.extend({

  block_init(block) {
    this._super(block);
    block.setColour(Blockly.Blocks.sensores.COLOUR);
    block.setInputsInline(true);
    block.setOutput(true);
  },

  block_javascript(block) {
    return ['receptor.' + this.nombre_sensor() + '\n', Blockly.JavaScript.ORDER_ATOMIC];
  }
});

/*
 * Representa un valor mas complejo
 * de un campo de un bloque
 */
var ParamValor = Ember.Object.extend({
   build() {
     var str_block = '';
     str_block += '<value name="NOMBRE">'.replace('NOMBRE', this.get('nombre_param'));

     str_block += '<block type="TIPO">'.replace('TIPO', this.get('tipo_bloque'));

     str_block += '<field name="TIPO">'.replace('TIPO', this.get('nombre_valor'));
     str_block += this.get('valor');
     str_block += '</field>';

     str_block += '</block>';

     str_block += '</value>';

     return str_block;
   }
});

/* ============================================== */

var EstructuraDeControl = Bloque.extend({

  block_init(block) {
    this._super(block);
    block.setColour(Blockly.Blocks.loops.COLOUR);
    block.setInputsInline(true);
    block.setPreviousStatement(true);
    block.setNextStatement(true);
  }

});

/* ============================================== */

var Repetir = EstructuraDeControl.extend({

  init() {
    this._super();
    this.set('id', 'repetir');
  },

  block_init(block) {
    this._super(block);
    block.appendValueInput('count')
        .setCheck('Number')
        .appendField('repetir');
    block.appendStatementInput('block');
  },

  block_javascript(block) {
    var value_count = Blockly.JavaScript.valueToCode(block, 'count', Blockly.JavaScript.ORDER_ATOMIC) || '0' ;
    var statements_block = Blockly.JavaScript.statementToCode(block, 'block');
    var r = 'programa.empezar_secuencia();\n';
    r += statements_block;
    r += 'programa.repetirN(function(){\nreturn {{n}};\n});\n'.replace('{{n}}', value_count);
    return r;
  },

  get_parametros() {
    return [
      ParamValor.create({
        nombre_param: 'count',
        tipo_bloque: 'math_number',
        nombre_valor: 'NUM',
        valor: '10'
      })
    ];
  }


});

var Si = EstructuraDeControl.extend({

  init() {
    this._super();
    this.set('id', 'si');
  },

  block_init(block) {
    this._super(block);
    block.appendValueInput('condition')
        .setCheck('Boolean')
        .appendField('si');
    block.appendStatementInput('block');
  },

  block_javascript(block) {
    var value_condition = Blockly.JavaScript.valueToCode(block, 'condition', Blockly.JavaScript.ORDER_ATOMIC) || 'false';
    var statements_block = Blockly.JavaScript.statementToCode(block, 'block');
    var r = 'programa.empezar_secuencia();\n';
    r += statements_block;
    r += 'programa.alternativa_si(function(){\nreturn {{condition}};\n});\n'.replace('{{condition}}', value_condition);
    return r;
  }

});

/* ============================================== */

var Sino = EstructuraDeControl.extend({

  init() {
    this._super();
    this.set('id', 'sino');
  },

  block_init(block) {
    this._super(block);
    block.appendValueInput('condition')
        .setCheck('Boolean')
        .appendField('si');
    block.appendStatementInput('block1');
    block.appendDummyInput()
        .appendField('sino');
    block.appendStatementInput('block2');
  },

  block_javascript(block) {
    var value_condition = Blockly.JavaScript.valueToCode(block, 'condition', Blockly.JavaScript.ORDER_ATOMIC) || 'false';
    var statements_block1 = Blockly.JavaScript.statementToCode(block, 'block1');
    var statements_block2 = Blockly.JavaScript.statementToCode(block, 'block2');
    var r = 'programa.empezar_secuencia();\n';
    r += statements_block1;
    r += 'programa.empezar_secuencia();\n';
    r += statements_block2;
    r += 'programa.alternativa_sino(function(){\nreturn {{condition}};\n});\n'.replace('{{condition}}', value_condition);
    return r;
  }

});

var Hasta = EstructuraDeControl.extend({

  init() {
    this._super();
    this.set('id', 'hasta');
  },

  block_init(block) {
    this._super(block);
    block.appendValueInput('condition')
        .setCheck('Boolean')
        .appendField('repetir hasta que');
    block.appendStatementInput('block');
  },

  block_javascript(block) {
    var value_condition = Blockly.JavaScript.valueToCode(block, 'condition', Blockly.JavaScript.ORDER_ATOMIC) || 'true';
    var statements_block = Blockly.JavaScript.statementToCode(block, 'block');
    var r = 'programa.empezar_secuencia();\n';
    r += statements_block;
    r += 'programa.repetir_hasta(function(){\nreturn {{condition}};\n});\n'.replace('{{condition}}', value_condition);
    return r;
  }

});


var bloques = {Bloque, CambioDeJSDeBlocky, VariableGet,
               VariableSet, VariableLocalGet, VariableLocalSet, Procedimiento,
               Funcion, CallNoReturn, CallReturn, ParamGet, AlEmpezar, Accion,
               Sensor, Repetir,Si,Sino,Hasta};

export default bloques;
