const galleryData = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "!",
  "qmark",
  "dot",
  "comma",
];

function initializeGallery() {
  const gallery = document.getElementById("gallery");

  if (!gallery) {
    console.error("Gallery element not found");
    return;
  }

  galleryData.forEach((letter) => {
    const altText =
      letter === "qmark"
        ? "?"
        : letter === "dot"
        ? "."
        : letter === "comma"
        ? ","
        : letter;

    const link = document.createElement("a");
    link.href = `font/${letter}.html`;

    const img = document.createElement("img");
    img.src = `static/img/${letter}.jpg`;
    img.alt = altText;
    img.className = "gallery__img";
    img.loading = "lazy";

    link.appendChild(img);
    gallery.appendChild(link);
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeGallery);
