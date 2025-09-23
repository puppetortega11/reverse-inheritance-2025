import { render, screen } from '@testing-library/react';
import Home from '../app/page';

// Mock the wallet components
jest.mock('../components/WalletProvider', () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../components/WalletButton', () => ({
  WalletButton: ({ onWalletChange }: { onWalletChange: (addr: string | null) => void }) => (
    <div data-testid="wallet-button">
      <button onClick={() => onWalletChange('test-wallet-123')}>
        Connect Wallet
      </button>
    </div>
  )
}));

jest.mock('../components/BotControls', () => ({
  BotControls: ({ onStart, onStop, loading, strategies }: any) => (
    <div data-testid="bot-controls">
      <button onClick={() => onStart('momentum', 'test-wallet-123')}>
        Start Bot
      </button>
      <button onClick={onStop}>Stop Bot</button>
      <div>Loading: {loading.toString()}</div>
      <div>Strategies: {strategies.join(', ')}</div>
    </div>
  )
}));

jest.mock('../components/TradeHistory', () => ({
  TradeHistory: ({ trades }: { trades: any[] }) => (
    <div data-testid="trade-history">
      <div>Trades: {trades.length}</div>
    </div>
  )
}));

// Mock fetch
global.fetch = jest.fn();

describe('Home Page', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the main interface', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({
        status: 'ready',
        strategies: ['momentum', 'market_making'],
        timestamp: new Date().toISOString()
      })
    });

    render(<Home />);
    
    expect(screen.getByText('Reverse Inheritance Trading Bot')).toBeInTheDocument();
    expect(screen.getByText('Simple Solana Trading Interface')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-button')).toBeInTheDocument();
    expect(screen.getByTestId('bot-controls')).toBeInTheDocument();
    expect(screen.getByTestId('trade-history')).toBeInTheDocument();
  });

  it('fetches bot status on load', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({
        status: 'ready',
        strategies: ['momentum'],
        timestamp: new Date().toISOString()
      })
    });

    render(<Home />);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bot/status')
    );
  });

  it('handles bot start request', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'ready',
          strategies: ['momentum'],
          timestamp: new Date().toISOString()
        })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Bot started'
        })
      });

    render(<Home />);
    
    // Wait for initial load
    await screen.findByText('Strategies: momentum');
    
    // The bot controls should be rendered
    expect(screen.getByTestId('bot-controls')).toBeInTheDocument();
  });
});
