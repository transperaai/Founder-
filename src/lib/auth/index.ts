import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { db } from "@/lib/db";
import { encryptJson } from "@/lib/crypto";
import { canSignIn, hasCalendarScope, parseAllowlist } from "./access";

/** Demo mode adds a password-less "Continue as the demo founder" sign-in. Never enable it with real client data. */
export const demoMode = () => process.env.DEMO_MODE === "true";

export const GOOGLE_SCOPES = "openid email profile https://www.googleapis.com/auth/calendar.readonly";
export const MICROSOFT_SCOPES = "openid profile email offline_access User.Read https://graph.microsoft.com/Calendars.Read";

function providers(): Provider[] {
  const list: Provider[] = [];
  if (process.env.AUTH_GOOGLE_ID) {
    list.push(
      Google({
        // Calendar read is requested in the same consent; Google lets the user untick it.
        authorization: { params: { scope: GOOGLE_SCOPES, access_type: "offline", prompt: "consent", include_granted_scopes: "true" } },
      }),
    );
  }
  if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID) {
    list.push(MicrosoftEntraID({ authorization: { params: { scope: MICROSOFT_SCOPES } } }));
  }
  if (demoMode()) {
    list.push(
      Credentials({
        id: "demo",
        name: "Demo founder",
        credentials: {},
        async authorize() {
          const founder = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
          return founder ? { id: founder.id, email: founder.email, name: founder.name } : null;
        },
      }),
    );
  }
  return list;
}

export const configuredProviders = () =>
  providers().map((p) => {
    const provider = typeof p === "function" ? p() : p;
    // Options (like the demo provider's id) are merged in by Auth.js later.
    const options = (provider as { options?: { id?: string; name?: string } }).options;
    return { id: options?.id ?? provider.id, name: options?.name ?? provider.name };
  });

const config: NextAuthConfig = {
  providers: providers(),
  session: { strategy: "jwt" },
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (!account || account.provider === "demo") return true;
      const email = (profile?.email ?? user.email ?? (profile as { preferred_username?: string } | undefined)?.preferred_username)?.toLowerCase();
      if (!email) return false;

      const existing = await db.user.findUnique({ where: { email } });
      const allowed = canSignIn({
        email,
        userCount: await db.user.count(),
        existingUser: Boolean(existing),
        allowlist: parseAllowlist(process.env.FOUNDER_EMAILS),
      });
      if (!allowed) return false;

      const calendarAccessGranted = hasCalendarScope(account.provider, account.scope);
      const calendarTokens = calendarAccessGranted
        ? encryptJson({
            provider: account.provider,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            scope: account.scope,
          })
        : null;
      const fields = {
        name: user.name ?? profile?.name ?? email,
        image: user.image ?? null,
        authProvider: account.provider,
        calendarAccessGranted,
        calendarTokens,
      };
      await db.user.upsert({ where: { email }, create: { email, ...fields }, update: fields });
      return true;
    },
    async jwt({ token, user, profile }) {
      // On sign-in, pin the token to our user id (looked up by email for OAuth sign-ins).
      if (user) {
        const email = (profile?.email ?? user.email)?.toLowerCase();
        const dbUser = email ? await db.user.findUnique({ where: { email }, select: { id: true } }) : null;
        token.uid = dbUser?.id ?? user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
