import Container from "@/components/container";
import SettingsSubnav from "@/components/subnav/settings";
import TeamSubnav from "@/components/subnav/team";
import React from "react";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  return (
    <Container subnav={<TeamSubnav />}>
      <div className="max-w-5xl m-auto mt-8 lg:mt-16 flex gap-8">
        <SettingsSubnav />
        <div className="flex-1 max-w-5xl mx-auto">{children}</div>
      </div>
    </Container>
  );
};

export default SettingsLayout;
