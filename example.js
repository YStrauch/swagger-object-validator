var swaggerValidator = require('swagger-object-validator');
var validator = new swaggerValidator.Handler('https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml');

var pet = {
  id: 'This is not a number',
  foo: 'bar',
  tag: [
    'This is an optional argument, but it',
    'Should be a String, not an Array of Strings'
  ]
}

validator.validateModel(pet, 'Pet', function (err, result) {
  // Human readable string
  console.log(result.humanReadable());

  // JSON result for computational interpretation
  console.log(JSON.stringify(result.errorsWithStringTypes(), undefined, 2))
});
