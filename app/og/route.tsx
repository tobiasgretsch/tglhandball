import OpengraphImage from "../opengraph-image";

/** Stable URL (/og) for the default share image, usable in per-page metadata. */
export function GET() {
  return OpengraphImage();
}
