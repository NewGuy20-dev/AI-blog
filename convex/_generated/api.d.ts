/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as audit from "../audit.js";
import type * as blockedIps from "../blockedIps.js";
import type * as bookmarks from "../bookmarks.js";
import type * as fingerprints from "../fingerprints.js";
import type * as lib_effectiveUser from "../lib/effectiveUser.js";
import type * as posts from "../posts.js";
import type * as security from "../security.js";
import type * as subscribers from "../subscribers.js";
import type * as supportAccess from "../supportAccess.js";
import type * as userProfiles from "../userProfiles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  audit: typeof audit;
  blockedIps: typeof blockedIps;
  bookmarks: typeof bookmarks;
  fingerprints: typeof fingerprints;
  "lib/effectiveUser": typeof lib_effectiveUser;
  posts: typeof posts;
  security: typeof security;
  subscribers: typeof subscribers;
  supportAccess: typeof supportAccess;
  userProfiles: typeof userProfiles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
