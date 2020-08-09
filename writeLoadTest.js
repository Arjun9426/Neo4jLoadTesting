const app = require("express")();
var neo4j = require("neo4j-driver");

const hostname = "localhost";
const port = 4321;

const SDC = require("statsd-client");
const sdc = new SDC({ host: "localhost", port: 8125, prefix: "neo4jClient" });

function pushMetric(metricName, timer) {
  sdc.timing(metricName + ".timer", timer);
}

var driver = neo4j.driver(
  "bolt://52.66.200.252",
  neo4j.auth.basic("neo4j", "1234567372412389"),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 10000,
    connectionAcquisitionTimeout: 300 * 1000, // 20 seconds
  }
);

var Queue = require("queue-fifo");
var queue = new Queue();

var startname;
var endname;

var NODE_INSERTION_PER_SECOND = 50;

var NODES_COUNT_WHOSE_RELATION_ESTABLISHED_PER_SECOND = 10;

var currentNodeToInsert = 1;

var relation = [];
for (var i = 0; i < 100; i++) {
  relation.push(0);
}

// relations:   200,100,50,25,10,0
// frequencies: 5,10,20,30,25,10
for (var i = 0; i < 100; i += 20) {
  relation[i] = 200;
}
for (var i = 4; i < 100; i += 10) {
  relation[i] = 100;
}

var l = 0;
var count = 0;

for (var i = 0; i < 100 && count < 20; i++) {
  if (relation[i] != 0) {
    continue;
  }
  if (l == 2) {
    relation[i] = 50;
    l = 0;
    count++;
  } else {
    l++;
  }
}
l = 0;
count = 0;
for (var i = 0; i < 100 && count < 30; i++) {
  if (relation[i] != 0) {
    continue;
  }
  if (l == 1) {
    relation[i] = 25;
    count++;
    l = 0;
  } else {
    l++;
  }
}

count = 0;
for (var i = 99; i >= 0 && count < 25; i--) {
  if (relation[i] != 0) {
    continue;
  }
  count++;
  relation[i] = 10;
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
  name: currentNodeToInsert,
  age: currentNodeToInsert,
  phone: currentNodeToInsert,
  rajya: "bharatvarsha",
};

async function insertNodes() {
  for (let i = 0; i < NODE_INSERTION_PER_SECOND; i++) {
    doc.name = currentNodeToInsert;
    doc.phone = currentNodeToInsert;
    doc.age = currentNodeToInsert;
    doc.rajya = bharatbhoomi[currentNodeToInsert % bharatbhoomi.length];
    var session = driver.session();
    const timer = new Date();
    sdc.timing("writeNode.getFollowing.ops" + ".timer", 1);
    await session
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
        queue.enqueue(currentNodeToInsert);
        result.records.forEach((element) => {
          console.log(element._fields[0].properties);
        });
        pushMetric("writeNode.getFollowing", timer);
        pushMetric("writeNodeStatus.getFollowing.success", timer);
      })
      .catch((err) => {
        console.log("error: " + err);
        pushMetric("writeNodeStatus.getFollowing.error", timer);
      })
      .finally(() => {
        currentNodeToInsert++;
        session.close();
      });
  }
}

async function insertEdges() {
  var totalNodes = currentNodeToInsert - 1;
  for (var i = 0; i < NODES_COUNT_WHOSE_RELATION_ESTABLISHED_PER_SECOND; i++) {
    if (queue.isEmpty() || currentNodeToInsert < 500) {
      return;
    }
    var node = queue.peek();
    queue.dequeue();
    var numer_of_relations = relation[(node - 1) % 100];
    if (numer_of_relations == 0) {
      continue;
    }
    var startname = node;
    var distribution_distance = Math.trunc(totalNodes / numer_of_relations);

    for (var j = 1; j <= numer_of_relations; j++) {
      var endname =
        ((startname + j * distribution_distance - 2 + totalNodes) %
          totalNodes) +
        1;
      var session = driver.session();
      const timer = new Date();
      sdc.timing("writeEdge.getFollowing.ops" + ".timer", 1);

      await session
        .run(
          "MATCH (a:Person),(b:Person) WHERE a.name = $aname AND b.name = $bname CREATE (a)-[r:Follow]->(b) RETURN {first:a.name,second:b.name}",
          {
            aname: startname,
            bname: endname,
          }
        )
        .then((result) => {
          console.log(result);
          pushMetric("writeEdge.getFollowing", timer);
          pushMetric("writeEdgeStatus.getFollowing.success", timer);
          //  result.records.forEach((element) => {
          //  console.log(element._fields[0].properties);
          // });
        })
        .catch((err) => {
          console.log("error: " + err);
          pushMetric("writeEdgeStatus.getFollowing.error", timer);
        })
        .finally(() => {
          session.close();
        });
    }
  }
}

var turn = 0;

var intervalId = setInterval(() => {
  if (turn == 0) {
    insertNodes();
  } else {
    insertEdges();
  }
  turn ^= 1;
}, 5000);
