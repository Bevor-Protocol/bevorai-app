import { redirect } from "next/navigation";
import React from "react";

const MainPage: React.FC = () => {
  redirect("/sign-in");
};

export default MainPage;
