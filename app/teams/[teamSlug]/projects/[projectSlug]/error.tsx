"use client";

import { useEffect } from "react";

const ErrorPage: React.FC<{ error: Error & { digest?: string } }> = ({ error }) => {
  useEffect(() => {
    console.log(error);
  }, [error]);
  return <p>There is no project within this team.</p>;
};

export default ErrorPage;
