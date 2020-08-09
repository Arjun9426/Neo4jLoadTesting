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
  "bolt://172.31.35.233",
  neo4j.auth.basic("neo4j", "1234567372412389"),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
    maxConnectionPoolSize: 10000,
    connectionAcquisitionTimeout: 300 * 1000,
  }
);
var TOTAL_NODE = 0;

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

var relation = [];

function RelationsMappingArray() {
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
}

function insertEdges(startNode, endNode) {
  for (var i = startNode; i <= endNode; i++) {
    var startname = i;
    var totalRelations = relation[(i - 1) % 100];
    for (var j = 1; j <= totalRelations; j++) {
      var dis = TOTAL_NODE / totalRelations;
      var endname = ((startname + j * dis - 2) % TOTAL_NODE) + 1;
      var session = driver.session();
      const timer = new Date();
      sdc.timing("writeEdge.getFollowing.ops" + ".timer", 1);
      session
        .run(
          "MATCH (a:User),(b:User) WHERE a.name = $aname AND b.name = $bname CREATE (a)-[r:Follow]->(b) RETURN r",
          {
            aname: startname,
            bname: endname,
          }
        )
        .then((result) => {
          pushMetric("writeEdge.getFollowing", timer);
          pushMetric("writeEdgeStatus.getFollowing.success", timer);
        })
        .catch((err) => {
          pushMetric("writeEdgeStatus.getFollowing.error", timer);
        })
        .finally(() => {
          session.close();
        });
    }
  }
}

function insertElements(startNode, endNode) {
  for (var i = startNode; i <= endNode; i++) {
    var doc = {};
    doc.name = i;
    doc.phone = i;
    doc.age = i;
    doc.rajya = bharatbhoomi[(i - 1) % bharatbhoomi.length];

    var session = driver.session();
    const timer = new Date();
    sdc.timing("writeNode.getFollowing.ops" + ".timer", 1);
    session
      .run(
        "create (a:Users{name:$name, age:$age, phone:$phone, rajya:$rajya}) RETURN a",
        {
          name: doc.name,
          age: doc.age,
          phone: doc.phone,
          rajya: doc.rajya,
        }
      )
      .then((result) => {
        pushMetric("writeNode.getFollowing", timer);
        pushMetric("writeNodeStatus.getFollowing.success", timer);
      })
      .catch((err) => {
        console.log("error: " + err);
        pushMetric("writeNodeStatus.getFollowing.error", timer);
      })
      .finally(() => {
        session.close();
      });
  }
}

RelationsMappingArray();

// 1<= a <= b <= INF

//insertElements(a,b);
insertEdges(1, 10);

/*
var loopCount = 0;

var inerval = setInterval(() => {
  // you can call function with parameter updates

  function_name(loopCount * 100, (loopCount + 1) * 100);

  if (loopCount == 1) {
    clearInterval(inerval);
  }
  loopCount++;
}, 30000);

*/
