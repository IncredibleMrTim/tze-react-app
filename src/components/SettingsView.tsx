import type { ISettings } from "@/interfaces";
import { saveApiKey } from "@/lib/storage";

interface SettingsViewProps {
  settings: ISettings;
  onUpdateSettings: (settings: ISettings) => void;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onShowToast
}) => {
  const handleSave = () => {
    saveApiKey(settings.apiKey);
    onShowToast('Settings saved');
  };

  const updateSetting = <K extends keyof ISettings>(key: K, value: ISettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Settings</h2>

      {/* API Key */}
      <div className="mb-4">
        <label className="text-[13px] font-medium text-gray-600 mb-1.5 block">
          Anthropic API Key
        </label>
        <input
          type="password"
          value={settings.apiKey}
          onChange={(e) => updateSetting('apiKey', e.target.value)}
          placeholder="sk-ant-..."
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          Required for PO scanning. Get your key from{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="text-primary">
            console.anthropic.com
          </a>
        </p>
      </div>

      {/* Rate Card */}
      <div className="border-t pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Rate Card</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Silver $/kg</label>
            <input
              type="number"
              value={settings.silverKg}
              onChange={(e) => updateSetting('silverKg', parseFloat(e.target.value) || 0)}
              step="0.1"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Gold $/kg</label>
            <input
              type="number"
              value={settings.goldKg}
              onChange={(e) => updateSetting('goldKg', parseFloat(e.target.value) || 0)}
              step="0.1"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Silver JIG $</label>
            <input
              type="number"
              value={settings.silverJig}
              onChange={(e) => updateSetting('silverJig', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Gold JIG $</label>
            <input
              type="number"
              value={settings.goldJig}
              onChange={(e) => updateSetting('goldJig', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">String Rate $</label>
            <input
              type="number"
              value={settings.stringRate}
              onChange={(e) => updateSetting('stringRate', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Due Days</label>
            <input
              type="number"
              value={settings.dueDays}
              onChange={(e) => updateSetting('dueDays', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* JIG Configuration */}
      <div className="border-t pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">JIG Configuration</h3>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Number of JIGs</label>
          <input
            type="number"
            value={settings.jigCount}
            onChange={(e) => updateSetting('jigCount', Math.min(20, Math.max(1, parseInt(e.target.value) || 6)))}
            min="1"
            max="20"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Between 1 and 20 JIGs</p>
        </div>
      </div>

      {/* Invoice Configuration */}
      <div className="border-t pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Invoice Configuration</h3>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Starting Invoice #</label>
          <input
            type="number"
            value={settings.invSeqStart}
            onChange={(e) => updateSetting('invSeqStart', parseInt(e.target.value) || 1)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-primary text-white rounded-xl py-3 text-base font-semibold"
      >
        Save Settings
      </button>
    </div>
  );
};
