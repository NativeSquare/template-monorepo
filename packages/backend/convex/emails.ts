"use node";

import { Resend } from "@convex-dev/resend";
import { render } from "@react-email/render";
import { internalAction } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { APP_DOMAIN, APP_NAME } from "@packages/shared/constants";

// Initialize the Resend component
// Set testMode: false when ready for production
export const resend = new Resend(components.resend, {
  testMode: process.env.IS_DEV === "true",
});

// Default sender address
const DEFAULT_FROM = `${APP_NAME} <no-reply@${APP_DOMAIN}>`;

/**
 * Generic email sending action that accepts pre-rendered HTML.
 * Use this as a base for specific email actions.
 */
export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
    replyTo: v.optional(v.array(v.string())),
  },
  returns: v.string(), // Returns EmailId
  handler: async (ctx, args) => {
    const emailId = await resend.sendEmail(ctx, {
      from: args.from ?? DEFAULT_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
    return emailId;
  },
});

// =============================================================================
// Example: Add your custom email actions below
// =============================================================================

// Example: Welcome email (uncomment and customize when needed)
// import { WelcomeEmail } from "@packages/transactional";
//
// export const sendWelcomeEmail = internalAction({
//   args: {
//     to: v.string(),
//     name: v.string(),
//   },
//   returns: v.string(),
//   handler: async (ctx, args) => {
//     const html = await render(WelcomeEmail({ name: args.name }));
//     const emailId = await resend.sendEmail(ctx, {
//       from: DEFAULT_FROM,
//       to: args.to,
//       subject: `Welcome to ${APP_NAME}!`,
//       html,
//     });
//     return emailId;
//   },
// });
