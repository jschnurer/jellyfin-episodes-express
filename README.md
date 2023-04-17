# Jellyfin Episodes Express
An express web app that runs the [jellyfin-new-episode-report](https://github.com/jschnurer/jellyfin-new-episode-report) node script via a web interface.

# local.settings.json file
This file must exist for the app to run. All settings are required except `basicAuthUsers`. If `basicAuthUsers` is present in the file, the express app will required basic authentication and provide a challenge to visitors.

```json
{
  "port": <your server port>,
  "scriptPath": <string: relative folder path>,
  "scriptFile": <string: name of node script>,
  "basicAuthUsers": {
    "<username>": <string: password>
  },
  "randomMovieScriptPath": "relative folder path to random movie script",
  "randomMovieScriptFile": "filename of random movie script"
}
```