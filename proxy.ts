import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, the Studio, Next internals and files with an extension.
  matcher: ["/((?!api|studio|og|llms\\.txt|_next|_vercel|.*\\..*).*)"],
};
