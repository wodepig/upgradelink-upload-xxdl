import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from 'fs'

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput("who-to-greet");
  core.info(`Hello ${nameToGreet}!`);

  // Get the current time and set it as an output variable
  const time = new Date().toTimeString();
  core.setOutput("time", time);
    core.info('测试文件获取',fs.readdirSync('./', 'utf8'))
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
//   core.info(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
