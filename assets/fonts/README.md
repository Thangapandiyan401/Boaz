Self-hosted webfont files go here.

The CSS font stack in css/variables.css already names Inter first and falls
back to the platform UI font, so no webfont is loaded by default. To use
Inter, drop the woff2 files in this folder and add an @font-face block.
