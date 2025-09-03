import React from "react";

export const TeamHeader: React.FC<{ title: string; subTitle: string }> = ({ title, subTitle }) => {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-neutral-100 mb-2">Team - {title}</h1>
      <p className="text-neutral-400">Manage your team&apos;s {subTitle}</p>
    </div>
  );
};
