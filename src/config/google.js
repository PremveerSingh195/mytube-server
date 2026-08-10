import { OAuth2Client } from "google-auth-library";

export const googlClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);