const ObjectsToCsv = require("objects-to-csv");

async function fun() {
  var l = 1;
  for (var j = 0; j < 1; j++) {
    var a = [];
    for (var i = 0; i < 5; i++) {
      var doc = { name: l, age: l, phone: l };
      a.push(doc);
      l++;
    }

    var csv = new ObjectsToCsv(a);
    await csv.toDisk("./People.csv");
  }
}
fun();
