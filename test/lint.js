var fs = require('fs');
var path = require('path');
var Ajv = require('ajv');
var ajv = new Ajv({ $data: true, allErrors: true });
var dictPaths = ['css', 'l10n'];
var hasErrors = false;

ajv.addKeyword('property-reference', {
  $data: true,
  metaSchema: { type: 'object' },
  validate: function(schema, data, parentSchema) {
    var valid = schema.hasOwnProperty(data);
    if (!valid) {
      // TODO: make a verbose message when invalid
      // throw new Error('wrong reference')
    }
    return valid;
  }
});

ajv.addSchema(require('../css/definitions.json'), 'definitions.json');

function jsonDiff(actual, expected) {
  var actualLines = actual.split(/\n/);
  var expectedLines = expected.split(/\n/);

  for (var i = 0; i < actualLines.length; i++) {
    if (actualLines[i] !== expectedLines[i]) {
      return [
        '#' + i,
        '    Actual:   ' + actualLines[i],
        '    Expected: ' + expectedLines[i]
      ].join('\n');
    }
  }
}

function checkStyle(filename) {
  var actual = fs.readFileSync(filename, 'utf-8').trim();
  var expected = JSON.stringify(JSON.parse(actual), null, 2);
  
  if (actual === expected) {
    console.log('  Style – OK');
  } else {
    hasErrors = true;
    console.log('  Style – Error on line ' + jsonDiff(actual, expected));
  }
}

function checkSchema(dataFilename) {
  var schemaFilename = dataFilename.replace(/\.json/i, '.schema.json');

  if (fs.existsSync(schemaFilename)) {
    var valid = ajv.validate(
      require(schemaFilename),
      require(dataFilename)
    );

    if (valid) {
      console.log('  JSON Schema – OK');
    } else {
      hasErrors = true;
      console.log('  JSON Schema – ' + ajv.errors.length + ' error(s)\n    ' +
        ajv.errorsText(ajv.errors, {
          separator: '\n    ',
          dataVar: 'item'
        })
      );
    }
  }
}

dictPaths.forEach(function(dir) {
  var absDir = path.resolve(path.join(__dirname, '..', dir));

  fs.readdirSync(absDir).forEach(function(filename) {
    if (path.extname(filename) === '.json') {
      var absFilename = path.join(absDir, filename);

      console.log(dir + '/' + filename);

      checkStyle(absFilename)
      checkSchema(absFilename);

      console.log();
    }
  });
});

if (hasErrors) {
  process.exit(1);
}
