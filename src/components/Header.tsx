type Tab = 'practice' | 'dashboard' | 'weak' | 'settings';

interface HeaderProps {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'practice', label: 'Practice' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'weak', label: 'Weak Questions' },
  { id: 'settings', label: 'Settings' },
];

export default function Header({ activeTab, onChangeTab }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <h1>DGI/DIL English Trainer</h1>
          <p>UK tax and valuation Q&A practice for restructuring discussions</p>
        </div>
        <nav className="tabs" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onChangeTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
