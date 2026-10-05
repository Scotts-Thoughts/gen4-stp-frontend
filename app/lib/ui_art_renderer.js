/**
 * UI Art Renderer
 *
 * The overlay's UI art (images/ui, images/new_ui, images/enemy-area) is authored as full-canvas
 * 1920x1080 SVGs. Drawing those as SVG means Chromium rasterises every one of them again each
 * time a panel is shown, which stalls the page for 50-300 ms per panel (ui/opponent.svg alone is
 * ~280 ms, the battle panel ~100 ms) and makes the fades look like snaps. The overlay therefore
 * displays pre-rendered PNG copies of the same art, which decode off the critical path and are
 * cheap to draw.
 *
 * The SVGs stay the source of truth. In dev mode (running from source) this module renders any
 * SVG whose PNG is missing or older than the SVG, using Chromium's own SVG renderer at the SVG's
 * viewBox size, and writes the PNG next to it. Commit the PNGs with the SVGs so packaged builds
 * ship them. `window.renderUiArt(true)` re-renders everything from the DevTools console.
 */

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ART_DIRS = ['images/ui', 'images/new_ui', 'images/enemy-area'];
const DEFAULT_W = 1920;
const DEFAULT_H = 1080;

function listSvgs(dir) {
    const out = [];
    const walk = (d) => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, entry.name);
            if (entry.isDirectory()) walk(p);
            else if (entry.isFile() && /\.svg$/i.test(entry.name)) out.push(p);
        }
    };
    if (fs.existsSync(dir)) walk(dir);
    return out;
}

function pngPathFor(svgPath) {
    return svgPath.replace(/\.svg$/i, '.png');
}

function isStale(svgPath) {
    const png = pngPathFor(svgPath);
    if (!fs.existsSync(png)) return true;
    return fs.statSync(png).mtimeMs < fs.statSync(svgPath).mtimeMs;
}

/** The SVG's canvas size from its viewBox (almost always 1920x1080). */
function canvasSizeOf(svgPath) {
    const head = fs.readFileSync(svgPath, 'utf8').slice(0, 4000);
    const m = head.match(/<svg[^>]*\bviewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
    if (!m) return { w: DEFAULT_W, h: DEFAULT_H };
    return { w: Math.round(Number(m[1])), h: Math.round(Number(m[2])) };
}

/** Render one SVG file to a PNG buffer at its canvas size with the page's own renderer. */
function renderSvg(svgPath) {
    const { w, h } = canvasSizeOf(svgPath);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const base64 = canvas.toDataURL('image/png').split(',')[1];
                resolve(Buffer.from(base64, 'base64'));
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = () => reject(new Error(`could not load ${svgPath}`));
        img.src = `${pathToFileURL(svgPath).href}?v=${Date.now()}`;
    });
}

/**
 * Render every stale (or, with `force`, every) SVG under the art directories to its PNG.
 * Resolves with the number of files written. Does nothing when the art directory is not
 * writable (packaged build).
 */
async function renderUiArt(force = false) {
    const appDir = path.join(__dirname, '..');
    try {
        fs.accessSync(path.join(appDir, 'images'), fs.constants.W_OK);
    } catch (e) {
        return 0;
    }
    const svgs = ART_DIRS.flatMap((d) => listSvgs(path.join(appDir, d)));
    const todo = svgs.filter((s) => force || isStale(s));
    let written = 0;
    for (const svg of todo) {
        try {
            const png = await renderSvg(svg);
            await fs.promises.writeFile(pngPathFor(svg), png);
            written++;
        } catch (e) {
            console.error('[UiArtRenderer] Failed to render', svg, e.message);
        }
    }
    if (written > 0) {
        console.log(`[UiArtRenderer] Rendered ${written} of ${svgs.length} UI art file(s) to PNG`);
    }
    return written;
}

if (typeof window !== 'undefined') {
    window.renderUiArt = renderUiArt;
}

module.exports = { renderUiArt, ART_DIRS };
