// Shared file-reading for the two bundlers (build-standalone.js and
// build-artifact.js), so both inline the same CSS/JS/logo the same way.
const fs = require("fs");
const path = require("path");

function readBundleParts() {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "public", "style.css"), "utf8");
  const teamDrawJs = fs.readFileSync(path.join(root, "src", "teamDraw.js"), "utf8");
  const appJs = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
  const logoBase64 = fs.readFileSync(path.join(root, "public", "logo.png")).toString("base64");

  const fontLinks = html.match(/<link[^>]*fonts\.g[^>]*>/g).join("\n");
  const body = html
    .match(/<main>[\s\S]*<\/main>/)[0]
    .replace('src="logo.png"', `src="data:image/png;base64,${logoBase64}"`);

  return { css, teamDrawJs, appJs, fontLinks, body };
}

module.exports = { readBundleParts };
