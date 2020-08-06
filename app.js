const app = require("express")();
var neo4j = require("neo4j-driver");

const hostname = "localhost";
const port = 4321;

var driver = neo4j.driver(
  "bolt://13.232.114.193",
  neo4j.auth.basic("neo4j", "123456"),
  {
    maxConnectionLifetime: 60 * 60 * 1000, // 1 hour
    maxConnectionPoolSize: 100000,
    //encrypted: "ENCRYPTION_ON",
    //trust: "TRUST_CUSTOM_CA_SIGNED_CERTIFICATES",
    /// trustedCertificates: [process.env.NEO4J_TRUSTED_CERTS],
  }
);

app.get("/getFollowing", (req, res) => {
  var session = driver.session();
  console.log(typeof Number(req.query.userId));
  session
    .run("MATCH (a:Users { name: $username})-->(b) RETURN b order by b.name", {
      username: Number(req.query.userId),
    })
    .then((result) => {
      var data = [];
      result.records.forEach((element) => {
        console.log(element._fields[0].properties);
        data.push(element._fields[0].properties);
      });
      res.send(data);
      //  result.records.forEach((element) => {
      //  console.log(element._fields[0].properties);
      // });
    })
    .catch((err) => {
      console.log("error: " + err);
      //session.close();
    });
});

app.get("/getFollowers", (req, res) => {
  // who follows me
  var session = driver.session();
  session
    .run("MATCH (a:lassan { name: $username})<--(b) RETURN b order by b.name", {
      username: Number(req.query.userId),
    })
    .then((result) => {
      var data = [];
      result.records.forEach((element) => {
        console.log(element._fields[0].properties);
        data.push(element._fields[0].properties);
      });
      res.send(data);
      //  result.records.forEach((element) => {
      //  console.log(element._fields[0].properties);
      // });
    })
    .catch((err) => {
      console.log("error: " + err);
      //session.close();
    });
});
var start = new Date().getTime();

var totalnode = 10000;
var totalrelations = 200;

var dis = 10; // distance between two consecutive neighbour

var startname;

var endname;

// code to insert relationships supported 5000 entries per try
var gh = 0;
var driverArray = [];
/*
var gh1 = driver.session();
var gh2 = driver.session();
console.log(gh1 != gh2);
*/

async function asyncCall1() {
  var session = driver.session();
  try {
    console.log("in try " + iteration);
    var result = await session.run(
      "MATCH (a:Users),(b:Users) WHERE a.name = $aname AND b.name = $bname CREATE (a)-[r:Friend]->(b) RETURN r",
      {
        aname: startname,
        bname: endname,
      }
    );
    gh++;
    console.log(
      result.records[0]._fields[0].start.low +
        " " +
        result.records[0]._fields[0].end.low
    );
    if (gh == 20000) {
      var end = new Date().getTime();
      var timee = end - start;
      console.log("Execution time: " + time / 1000);
    }
  } catch (err) {
    console.log(err);
  } finally {
    await session.close();
    console.log("in final " + iteration);
  }
}

/*
for (var i = 1901; i <= 2000; i++) {
  startname = i;
  for (var j = 1; j <= totalrelations; j++) {
    endname = ((startname + j * dis - 2) % totalnode) + 1;
    //  console.log(startname + " " + endname);
    var session = driver.session();
    session
      .run(
        "MATCH (a:Users),(b:Users) WHERE a.name = $aname AND b.name = $bname CREATE (a)-[r:Friend]->(b) RETURN r",
        {
          aname: startname,
          bname: endname,
        }
      )
      .then((result) => {
        //session.close();
        console.log(
          result.records[0]._fields[0].start.low +
            " " +
            result.records[0]._fields[0].end.low
        );
        //  result.records.forEach((element) => {
        //  console.log(element._fields[0].properties);
        // });
      })
      .catch((err) => {
        console.log("error: " + err);
        //session.close();
      });
    
    asyncCall1();
  }
}
*/
// Code to insert entries in db with names as 1,2,3....totalnode

async function asyncCall2(iteration) {
  // console.log(iteration);
  var session = driver.session();

  try {
    ///console.log("in try " + iteration);
    var result = await session.run(
      "create (a:Humans{name:$name, age:$age, phone:$phone, rajya:$rajya}) RETURN a",
      {
        name: doc.name,
        age: doc.age,
        phone: doc.phone,
        rajya: doc.rajya,
      }
    );
    gh++;
    result.records.forEach((element) => {
      console.log(element._fields[0].properties);
    });
    if (gh == totalnode) {
      var end = new Date().getTime();
      var time = end - start;
      console.log("Execution time: " + time / 1000);
    }
  } catch (err) {
    console.log(err);
  } finally {
    //console.log("in final " + iteration);
    await session.close();
    //return "okay";
  }
}

var bharatbhoomi = [
  "Hastinapur",
  "Naglok",
  "Kuntibhoj",
  "Dwarka",
  "Virat",
  "SindhuDesh",
  "Ghandhar",
  "Kashi",
];
var doc = {
  name: 1,
  age: 1,
  phone: 1,
  rajya: "random",
};

var gh = 0;
async function insertElements() {
  for (var i = 0; i < totalnode; i++) {
    doc.name = i + 1;
    doc.phone = i + 1;
    doc.age = totalnode - i;
    doc.rajya = bharatbhoomi[i % bharatbhoomi.length];

    /*
    var session = driver.session();
    session
      .run(
        "create (a:Person{name:$name, age:$age, phone:$phone, rajya:$rajya}) RETURN a",
        {
          name: doc.name,
          age: doc.age,
          phone: doc.phone,
          rajya: doc.rajya,
        }
      )
      .then((result) => {
        gh++;
        result.records.forEach((element) => {
          console.log(element._fields[0].properties);
        });
        if (gh == totalnode - 1) {
          var end = new Date().getTime();
          var time = end - start;
          console.log("Execution time: " + time / 1000);
        }
      })
      .catch((err) => {
        console.log("error: " + err);
        //session.close();
      });
      */
    await asyncCall2(i);
  }
}
insertElements();

/*
async function firstAsync(i) {
  try {
    console.log(i);
    const result = await session.run(
      "CREATE (a:Person {name: $name}) RETURN a",
      { name: doc.name }
    );
    const singleRecord = result.records[0];
    const node = singleRecord.get(0);

    // console.log(node.properties.name);
  } finally {
    console.log(i + 1);
    await session.close();
  }
}
*/

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
