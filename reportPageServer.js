const fs = require("fs");
const settings = require("./local.settings.json");
const path = require("path");

function setupReportPage(app, jsonParser) {
  setupGetRoute(app);
  setupSetIgnoredRoute(app, jsonParser);
  setupClearIgnoredRoute(app);
  setupSaveRecountOverrideRoute(app, jsonParser);
}

function setupGetRoute(app) {
  app.get("/report", (_, res) => {

    var overridesPath = path.join(__dirname, settings.scriptPath, "./recount-overrides.json");
    var outputPath = path.join(__dirname, settings.scriptPath, "output.json");
    var reportPath = "./report.html";

    try {
      const outputJson = fs.readFileSync(outputPath, "utf8");
      const reportHtml = fs.readFileSync(reportPath, "utf8")
        .replace("#outputJson#", outputJson)
        .replace("#epLink#", settings.epLink)
        .replace("#linkDict#", JSON.stringify(settings.linkDict))
        .replace("#recountOverrides#", fs.existsSync(overridesPath)
          ? fs.readFileSync(overridesPath, "utf8")
          : "[]"
        );

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

function setupClearIgnoredRoute(app) {
  app.post("/clear-ignored", (req, res) => {
    try {
      const filePath = path.join(__dirname, settings.scriptPath, "ignored-shows.json");
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath);
      }
    } catch (err) {
      console.error(err);
      res.send(err);
      res.sendStatus(500);
      return;
    }

    res.sendStatus(200);
  });
}

function setupSaveRecountOverrideRoute(app, jsonParser) {
  app.post("/save-recount-override", jsonParser, (req, res) => {
    if (!req.body
      || !req.body.show
      || !req.body.action
      || !req.body.jellyfinId
      || !req.body.recountOverride) {
      console.log(req.body);
      res.sendStatus(400);
      return;
    }

    var {
      show,
      action,
      jellyfinId,
      recountOverride,
    } = req.body;

    try {
      // Update the ignored shows list in the script directory to either add or remove this item!
      updateRecountOverrideList(action, show, jellyfinId, recountOverride);
    } catch (err) {
      console.error(err);
      res.send(err);
      res.sendStatus(500);
      return;
    }

    res.sendStatus(200);
  });
}

function updateRecountOverrideList(action, show, jellyfinId, recountOverride) {
  const filePath = path.join(__dirname, settings.scriptPath, "recount-overrides.json");

  var recountList = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf8"))
    : [];

  if (action === "delete") {
    const existingIx = recountList.findIndex(x => x.id.toString() === jellyfinId.toString());

    if (existingIx > -1) {
      // Delete this entry.
      recountList.splice(existingIx, 1);
    }
  } else if (action === "save") {
    const existingIx = recountList.findIndex(x => x.id.toString() === jellyfinId.toString());

    if (existingIx > -1) {
      // Update existing entry.
      recountList[existingIx].name = show;
      recountList[existingIx].recountOverride = recountOverride;
    } else {
      // Insert new entry.
      recountList.push({
        name: show,
        id: jellyfinId,
        recountOverride,
      });
    }
  } else {
    console.log(`No recount override list action required for ${show}.`);
  }

  fs.writeFileSync(filePath, JSON.stringify(recountList, null, 2), "utf8");
  console.log("Wrote recount override list to file.");
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
