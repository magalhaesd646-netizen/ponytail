// Same bundling as build-standalone.js, but without the outer
// <!doctype>/<html>/<head>/<body> wrapper the Artifact publishing tool
// supplies itself.
const fs = require("fs");
const path = require("path");
const { readBundleParts } = require("./bundle-lib");

const { css, teamDrawJs, appJs, fontLinks, body } = readBundleParts();

const fragment = `<title>Sorteio de Times</title>
${fontLinks}
<style>
${css}
</style>
${body}
<script>
${teamDrawJs}
</script>
<script>
${appJs}
</script>
`;

fs.writeFileSync(path.join(__dirname, "..", "public", "artifact.html"), fragment);
console.log("Gerado public/artifact.html");
