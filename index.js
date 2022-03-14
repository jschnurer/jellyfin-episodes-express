const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const runScript = require("./runScript");
const path = require("path");
const basicAuth = require('express-basic-auth');

// Set up the socket io server.
const io = new Server(server);

const settings = require("./local.settings.json");
const port = settings.port;

// Set up basic auth.
if (settings.basicAuthUsers) {
  app.use(basicAuth({
    users: settings.basicAuthUsers,
    challenge: true,
  }));
}

// Setup main page.
app.get('/', (req, res) => {
  res.sendFile("./index.html", { root: __dirname });
});

// Setup route for getting the outputted report.
app.get('/output', (req, res) => {
  var opts = { root: path.join(__dirname, settings.scriptPath) };
  res.sendFile("output.html", opts);
});

isReportRunning = false;

io.on('connection', async function (socket) {
  console.log('A user connected');

  // Handler for starting the report.
  socket.on('runReport', async function () {
    if (isReportRunning) {
      var msg = "ERROR: The report generation is already running.";
      console.log(msg);
      io.emit("error", msg);
      return;
    }

    var msg = "Report generation started...";
    console.log(msg);
    io.emit("message", msg);
    isReportRunning = true;

    // Run the other script.
    runScript(settings.scriptFile, settings.scriptPath, function (err) {
      isReportRunning = false;

      if (err) {
        var msg = "ERROR: " + err.toString();
        io.emit("error", msg);
        return;
      }

      var msg = "Report generation finished!";
      console.log(msg);
      io.emit("message", msg);
      console.log("done");
      io.emit("done");
    }, (msg) => {
      io.emit("message", msg);
    });
  });

  socket.on('disconnect', function () {
    console.log('A user disconnected');
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});