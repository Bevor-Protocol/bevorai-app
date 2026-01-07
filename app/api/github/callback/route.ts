import { githubActions } from "@/actions/bevor";
import { NextRequest, NextResponse } from "next/server";

/*
This route is the callback from installation of the github app.
We coupled in oauth, which is why a "code" is sent.

This oauth is completely different from stytch. This oauth is still with respect to our github app.

This callback can be for BOTH oauth OR installation.
*/

export async function GET(request: NextRequest): Promise<NextResponse> {
  // the State can encode arbitrary information for us, which we have control over. We'll conditionally
  // include the team_slug into it, so that we can appropriately route.
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

  let url = "/user/github/manage";

  return await githubActions
    .handleCallback({ code, state, installation_id, setup_action })
    .then((response) => {
      if (!response.ok) throw new Error(response.error);
      url += "?success=github_connected";
      if (response.data.team_slug) {
        url += `&teamSlug=${response.data.team_slug}`;
      }
      return NextResponse.redirect(new URL(url, request.url));
    })
    .catch((error) => {
      console.log(error);
      url += "?error=github_connection_failed";
      return NextResponse.redirect(new URL(url, request.url));
    });
}
