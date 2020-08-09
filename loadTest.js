const app = require("express")();
var neo4j = require("neo4j-driver");

const hostname = "localhost";
const port = 1234;

const QUERIES_PER_SECOND = 500;

//const driver = neo4j.driver(..., loggingConfig);

const SDC = require("statsd-client");
const sdc = new SDC({ host: "localhost", port: 8125, prefix: "neo4jClient" });

function pushMetric(metricName, timer) {
  sdc.timing(metricName + ".timer", timer);
}

var driver = neo4j.driver(
  "bolt://172.31.35.233",
  neo4j.auth.basic("neo4j", "1234567372412389"),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 20000,
    connectionAcquisitionTimeout: 20 * 1000, // 20 seconds
    //encrypted: "ENCRYPTION_ON",
    //trust: "TRUST_CUSTOM_CA_SIGNED_CERTIFICATES",
    /// trustedCertificates: [process.env.NEO4J_TRUSTED_CERTS],
  }
);


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function invokeQuery() {
  for(let j  = 0; j < QUERIES_PER_SECOND; j++) {
    let userId = getRandomInt(1998) + 1;

    const timer = new Date();
    sdc.timing("query.getFollowing.ops" +  ".timer", 1);
    
    var session = driver.session();
  
    session
      .run("MATCH (a:Users { name: $username})-->(b) RETURN b",{
        username: userId,
      })
      .then((result) => {
        pushMetric("query.getFollowing", timer);
        pushMetric("queryStatus.getFollowing.success", timer);  
      })
      .catch((err) => {
        pushMetric("queryStatus.getFollowing.error", timer);
        console.log("error: " + err);
      }).finally(()=>{
          session.close();
      })

  }

}

setInterval(() => {
  invokeQuery();
}, 2000);

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

