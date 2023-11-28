/*
This program and the accompanying materials are
made available under the terms of the Eclipse Public License v2.0 which accompanies
this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

SPDX-License-Identifier: EPL-2.0

Copyright Contributors to the Zowe Project.
*/

const fs = require('fs');

// Must run with args: PR_NUMBER
const PR_NUMBER = process.argv[2];
const description = fs.readFileSync('/tmp/pr_description.txt', 'utf8');
let changelogMsg, version;

if (description.includes('VERSION:') && description.includes('CHANGELOG:')) {
  let lines = description.split('\n');
  lines.forEach((line) => {
    if (line.startsWith('CHANGELOG:')) {
      changelogMsg = line.substring('CHANGELOG:'.length).trim();
    } else if (line.startsWith('VERSION:')) {
      version = line.substring('VERSION:'.length).trim();
    }
  });

  if (changelogMsg && version) {
    let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
    let changelogLines = changelog.split('\n');
    let versionIndex = -1;
    let anchorIndex = 0;
    for (let i = 0; i < changelogLines.length; i++) {
      if (changelogLines[i].includes('# Basic TN3270 Display Emulator Changelog')) {
        anchorIndex = i;
      } else if (changelogLines[i].startsWith('## ' + version)) {  // Removed "v" prefix
        versionIndex = i;
        break;
      }
    }
    if (versionIndex != -1) {
      changelogLines.splice(versionIndex + 2, 0, `- ${changelogMsg} (#${PR_NUMBER})`);
    } else {
      changelogLines.splice(anchorIndex + 1, 0, `\n## \`${version}\`\n- ${changelogMsg} (#${PR_NUMBER})`);
    }
    const newChangelog = changelogLines.join('\n');
    fs.writeFileSync('CHANGELOG.md', newChangelog);
    console.log('Success');
  } else {
    if (!changelogMsg) {
      console.log('Missing CHANGELOG');
    }
    if (!version) {
      console.log('Missing VERSION');
    }
  }
} else {
  console.log('Missing CHANGELOG or VERSION');
}