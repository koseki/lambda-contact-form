const app = require('./app');

app.lambdaHandler().then(result => {
  console.log(result);
});
