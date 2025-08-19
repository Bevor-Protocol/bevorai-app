"use client";

const ErrorPage: React.FC<{ error: Error & { digest?: string } }> = ({ error }) => {
  return <p>There is no project within this team. {error.message}</p>;
};

export default ErrorPage;
