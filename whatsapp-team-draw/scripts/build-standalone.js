// Bundles public/index.html + style.css + teamDraw.js + app.js into one
// dependency-free file, so it still works after being downloaded/shared
// as a single attachment (e.g. opened from a phone's Downloads folder,
// where relative paths to sibling files are unreliable).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "public", "style.css"), "utf8");
const teamDrawJs = fs.readFileSync(path.join(root, "src", "teamDraw.js"), "utf8");
const appJs = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");

const body = html.match(/<main>[\s\S]*<\/main>/)[0];

const standalone = `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sorteio de Times</title>
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

fs.writeFileSync(path.join(root, "public", "standalone.html"), standalone);
console.log("Gerado public/standalone.html");
