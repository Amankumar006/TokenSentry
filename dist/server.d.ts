import { FastifyInstance } from "fastify";
import type { TokenSentryConfig } from "./types.js";
export declare function createServer(customConfig?: Partial<TokenSentryConfig>): FastifyInstance;
