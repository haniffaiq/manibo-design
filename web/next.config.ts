import type { NextConfig } from "next";

import { assertSafeDevAuthFlags } from "./src/lib/dev-auth-flags";

assertSafeDevAuthFlags(process.env);

const nextConfig: NextConfig = {};

export default nextConfig;
