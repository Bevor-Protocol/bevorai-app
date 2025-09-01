import { AsyncComponent } from "@/utils/types";
import LinkedAccountsClient from "./linked-accounts-client";

const UserSettingsPage: AsyncComponent = async () => {
  return (
    <div className="px-6 py-8 bg-neutral-950 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100 mb-2">Account Settings</h1>
          <p className="text-neutral-400">
            Manage your authentication methods and account preferences
          </p>
        </div>

        <LinkedAccountsClient />
      </div>
    </div>
  );
};

export default UserSettingsPage;
