import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import LinkedAccountsClient from "./linked-accounts-client";
import { ProfileClient } from "./profile-client";

const UserSettingsPage: AsyncComponent = async () => {
  return (
    <Container>
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-b pb-6 mb-8">
          <h1 className="text-2xl font-semibold mb-1">User Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="space-y-8">
          <ProfileClient />
          <LinkedAccountsClient />
        </div>
      </div>
    </Container>
  );
};

export default UserSettingsPage;
