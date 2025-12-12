import { ProfileClient } from "@/app/(core)/user/profile-client";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import LinkedAccountsClient from "./linked-accounts-client";

const UserSettingsPage: AsyncComponent = async () => {
  return (
    <Container>
      <div className="max-w-5xl mx-auto mt-8 lg:mt-16">
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
