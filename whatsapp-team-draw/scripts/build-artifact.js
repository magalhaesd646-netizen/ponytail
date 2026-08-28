// Same bundling as build-standalone.js, but without the outer
// <!doctype>/<html>/<head>/<body> wrapper the Artifact publishing tool
// supplies itself.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "public", "style.css"), "utf8");
const teamDrawJs = fs.readFileSync(path.join(root, "src", "teamDraw.js"), "utf8");
const appJs = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
const fontLinks = html.match(/<link[^>]*fonts\.g[^>]*>/g).join("\n");

const body = html.match(/<main>[\s\S]*<\/main>/)[0];

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

fs.writeFileSync(path.join(root, "public", "artifact.html"), fragment);
console.log("Gerado public/artifact.html");
