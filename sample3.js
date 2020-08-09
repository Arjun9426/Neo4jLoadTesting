var promises = [];
const p1 = Promise.resolve("a");
const p2 = Promise.resolve("b");
const p3 = Promise.resolve("c");
const p4 = Promise.resolve("d");
promises.push(p1);
promises.push(p2);
promises.push(p3);
promises.push(p4);

Promise.all(promises)
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });
