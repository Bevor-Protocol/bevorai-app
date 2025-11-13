import { AsyncComponent } from "@/utils/types";
import SignInClient from "./sign-in-client";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SignInPage: AsyncComponent<PageProps> = async ({ searchParams }) => {
  const params = await searchParams;
  const hasError = params.error !== undefined;

  return <SignInClient hasError={hasError} />;
};

export default SignInPage;
