import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import LinkedAccountsClient from "./linked-accounts-client";
import { ProfileClient } from "./profile-client";

const UserSettingsPage: AsyncComponent = async () => {
  return (
    <Container>
      <div className="space-y-8">
        <ProfileClient />
        <LinkedAccountsClient />
      </div>
    </Container>
  );
};

export default UserSettingsPage;
