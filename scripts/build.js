import fs from "fs";
import * as sass from "sass";
import path from "path";
import { minify } from "html-minifier";
import imagemin from "imagemin";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import imageminSvgo from "imagemin-svgo";
import { promisify } from "util";
import { lettersData } from "../src/content/letters.js";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);

// Ensure dist directory exists
const ensureDir = async (dir) => {
  if (!fs.existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
};

// compile Sass
async function compileSass() {
  const result = sass.compile("./src/static/sass/main.scss");
  await ensureDir("./dist/static/css");
  fs.writeFileSync("./dist/static/css/main.css", result.css);
}

async function optimizeImages() {
  await imagemin(["src/static/img/*.{jpg,png,svg}"], {
    destination: "dist/static/img",
    plugins: [
      imageminMozjpeg({ quality: 75 }),
      imageminPngquant({ quality: [0.6, 0.8] }),
      imageminSvgo(),
    ],
  });
}

// Process a page
async function buildPage(pageName) {
  console.log(`Building ${pageName}.html...`);

  // Read template files
  const baseTemplate = await readFile("./src/templates/base.html", "utf8");
  const header = await readFile("./src/templates/header.html", "utf8");
  const footer = await readFile("./src/templates/footer.html", "utf8");

  // Read page-specific content
  const contentFile = `./src/content/${pageName}-content.html`;
  const pageContent = await readFile(contentFile, "utf8");

  // Assemble the page
  let finalHTML = baseTemplate
    .replace(
      "{{PAGE_TITLE}}",
      pageName === "index" ? "Garment Sans" : `Garment Sans - ${pageName}`
    )
    .replace('<div id="header-container"></div>', header)
    .replace('<div id="content-container"></div>', pageContent)
    .replace('<div id="footer-container"></div>', footer);

  finalHTML = minify(finalHTML, {
    removeComments: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    minifyJS: true,
    minifyCSS: true,
  });

  // Write output
  await ensureDir("./dist");
  await writeFile(`./dist/${pageName}.html`, finalHTML);
}

async function buildLetterPage(letterData) {
  const { letter, model, photographer, location, film } = letterData;
  console.log(`Building page for letter ${letter}...`);

  // Read base template and other templates
  const baseTemplate = await readFile("./src/templates/base.html", "utf8");
  const header = await readFile("./src/templates/header.html", "utf8");
  const footer = await readFile("./src/templates/footer.html", "utf8");

  // Create the letter-specific content
  const letterContent = `
    <div class="letter">
      <h1>${letter}</h1>
      <img src="/static/img/${letter}.jpg" class="gallery__img" alt="${letter}">
      <br>
      <p>
        Model: ${model} <br>
        Photo by: ${photographer} <br>
        Location: ${location} <br>
        Film: ${film}
      </p>
    </div>
  `;

  // Assemble the page HTML
  let finalHTML = baseTemplate
    .replace("{{PAGE_TITLE}}", `The Nest - ${letter}`)
    .replace('<div id="header-container"></div>', header)
    .replace('<div id="content-container"></div>', letterContent)
    .replace('<div id="footer-container"></div>', footer);

  finalHTML = minify(finalHTML, {
    removeComments: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    minifyJS: true,
    minifyCSS: true,
  });

  // Write the page to the dist directory
  await ensureDir("./dist");
  await writeFile(`./dist/${letter}.html`, finalHTML);
}

// Copy static assets
async function copyStatic() {
  console.log("Copying static files...");
  await ensureDir("./dist/static");

  // Function to copy a directory recursively
  const copyDir = async (src, dest) => {
    await ensureDir(dest);

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  };

  await copyDir("./src/static", "./dist/static");
}

// Main build function
async function build() {
  try {
    // Build each page
    await buildPage("index");

    for (const letterData of lettersData) {
      await buildLetterPage(letterData);
    }

    await compileSass();
    await optimizeImages();

    // Copy static assets
    await copyStatic();

    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

// Run the build
build();
