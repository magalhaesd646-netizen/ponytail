// Bundles public/index.html + style.css + teamDraw.js + app.js + logo.png
// into one dependency-free file, so it still works after being downloaded
// or shared as a single attachment (e.g. opened from a phone's Downloads
// folder, where relative paths to sibling files are unreliable).
const fs = require("fs");
const path = require("path");
const { readBundleParts } = require("./bundle-lib");

const { css, teamDrawJs, appJs, fontLinks, body } = readBundleParts();

const standalone = `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sorteio de Times</title>
${fontLinks}
  <style>
${css}
  </style>
</head>
<body>
${body}
<script>
${teamDrawJs}
</script>
<script>
${appJs}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, "..", "public", "standalone.html"), standalone);
console.log("Gerado public/standalone.html");
