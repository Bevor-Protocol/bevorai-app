import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import LinkedAccountsClient from "./linked-accounts-client";

const UserSettingsPage: AsyncComponent = async () => {
  return (
    <Container>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your authentication methods and account preferences
        </p>
      </div>

      <LinkedAccountsClient />
    </Container>
  );
};

export default UserSettingsPage;
