import React from "react";

export const TeamHeader: React.FC<{
  title: string;
  subTitle: string;
  children?: React.ReactNode;
}> = ({ title, subTitle, children }) => {
  return (
    <div className="flex flex-row justify-between mb-8 border-b border-b-border py-4">
      <div>
        <h1>Team - {title}</h1>
        <p className="text-muted-foreground mt-2">Manage your team&apos;s {subTitle}</p>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
};
