import SettingsSidebar from "@/components/settings";

const SettingsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col max-w-6xl m-auto">
      <div className="border-b border-b-neutral-800 py-4">
        <h1>Settings</h1>
      </div>
      <div className="flex flex-row py-10 gap-10">
        <SettingsSidebar />
        <div className="grow">{children}</div>
      </div>
    </div>
  );
};

export default SettingsLayout;
