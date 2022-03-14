var childProcess = require('child_process');

/**
 * Runs a node script.
 * @param {string} scriptPath Path to script.
 * @param {string} cwd Current Working Directory (i.e. where to run the script)
 * @param {function} errorEndCallback Function to call when ends or errors.
 * @param {function} msgCallback Function to call when a message is outputted by the script.
 */
function runScript(scriptPath, cwd, errorEndCallback, msgCallback) {
    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath, { cwd });

    process.on('message', msgCallback);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        errorEndCallback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        errorEndCallback(err);
    });

}

module.exports = runScript;