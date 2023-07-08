const fs = require("fs");
const settings = require("./local.settings.json");
const path = require("path");

function setupReportPage(app, jsonParser) {
  setupGetRoute(app);
  setupSetIgnoredRoute(app, jsonParser);
}

function setupGetRoute(app) {
  app.get("/report", (_, res) => {

    try {
      const outputJson = fs.readFileSync(path.join(__dirname, settings.scriptPath, "output.json"), "utf8");
      const reportHtml = fs.readFileSync("./report.html", "utf8").replace("#outputJson#", outputJson).replace("#epLink", settings.epLink);

      res.send(reportHtml);
    } catch (err) {
      res.send("ERROR: " + err);
    }
  });
}

function setupSetIgnoredRoute(app, jsonParser) {
  app.post("/set-ignored", jsonParser, (req, res) => {
    if (!req.body
      || !req.body.action
      || !req.body.show
      || !req.body.jellyfinId) {
      console.log(req.body);
      res.sendStatus(400);
      return;
    }

    var {
      action,
      show,
      jellyfinId,
    } = req.body;

    try {
      // Update the ignored shows list in the script directory to either add or remove this item!
      updateIgnoreList(action, show, jellyfinId);
    } catch (err) {
      console.error(err);
      res.send(err);
      res.sendStatus(500);
      return;
    }

    res.sendStatus(200);
  });
}

function updateIgnoreList(action, show, jellyfinId) {
  const filePath = path.join(__dirname, settings.scriptPath, "ignored-shows.json");

  var ignoredList = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf8"))
    : [];

  if (action === "ignore"
    && !ignoredList.some(x => x.id === jellyfinId)) {
    console.log(`Added ${show} to ignored list.`);
    ignoredList.push({
      name: show,
      id: jellyfinId,
    });
  } else if (action === "unignore"
    && ignoredList.some(x => x.id === jellyfinId)) {
    console.log(`Removed ${show} from ignored list.`);
    ignoredList = ignoredList.filter(x => x.id !== jellyfinId);
  } else {
    console.log(`No ignore list action required for ${show}.`);
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(ignoredList, null, 2), "utf8");
  console.log("Wrote ignored list to file.");
}

module.exports = {
  setupReportPage,
}