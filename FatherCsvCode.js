const ObjectsToCsv = require("objects-to-csv");

async function fun() {
  var l = 1;
  for (var j = 0; j < 1; j++) {
    var a = [];
    for (var i = 0; i < 5; i++) {
      var doc = { from: i + 1, to: i + 2 };
      a.push(doc);
      l++;
    }
    var csv = new ObjectsToCsv(a);
    await csv.toDisk("./Father.csv", { append: true });
  }
}
fun();
