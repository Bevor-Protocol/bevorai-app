import { githubActions } from "@/actions/bevor";
import { NextRequest, NextResponse } from "next/server";

/*
This route is the callback from installation of the github app.
We coupled in oauth, which is why a "code" is sent.

This oauth is completely different from stytch. This oauth is still with respect to our github app.

This callback can be for BOTH oauth OR installation.
*/

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code"); // we bundle in the oauth flow into our app connection.
  const state = searchParams.get("state");
  const installation_id = searchParams.get("installation_id");
  const setup_action = searchParams.get("setup_action");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/user/github/manage?error=missing_github_code", request.url),
    );
  }

  return await githubActions
    .handleCallback({ code, state, installation_id, setup_action })
    .then(() => {
      return NextResponse.redirect(
        new URL("/user/github/manage?success=github_connected", request.url),
      );
    })
    .catch((error) => {
      console.log(error);
      return NextResponse.redirect(
        new URL("/user/github/manage?error=github_connection_failed", request.url),
      );
    });
}
