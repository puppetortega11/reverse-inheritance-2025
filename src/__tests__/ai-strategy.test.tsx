import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import { useWallet } from '@solana/wallet-adapter-react';

// Mock the Solana wallet adapter
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

const mockUseWallet = useWallet as jest.Mock;

describe('AI Strategy Generator Frontend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWallet.mockReturnValue({
      publicKey: { toBase58: () => 'mock-wallet-address' },
      connected: true,
      sendTransaction: jest.fn(),
      connection: {},
    });
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders AI Strategy Generator section', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByText('AI Strategy Generator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe your trading strategy in natural language/)).toBeInTheDocument();
    expect(screen.getByText('Generate Strategy')).toBeInTheDocument();
  });

  it('allows user to input strategy prompt', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const textarea = screen.getByPlaceholderText(/Describe your trading strategy in natural language/);
    const user = userEvent.setup();
    
    await act(async () => {
      await user.type(textarea, 'Buy SOL when it drops 5% and sell when it rises 3%');
    });

    expect(textarea).toHaveValue('Buy SOL when it drops 5% and sell when it rises 3%');
  });

  it('calls strategy generation API when Generate Strategy is clicked', async () => {
    const mockStrategyResponse = {
      success: true,
      strategy: 'AI Generated Strategy: Buy SOL when price drops 5%, sell when price rises 3%. Use stop loss at 10% down.',
      timestamp: new Date().toISOString()
    };

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      if (url.includes('/api/strategy/generate')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockStrategyResponse),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const textarea = screen.getByPlaceholderText(/Describe your trading strategy in natural language/);
    const generateButton = screen.getByText('Generate Strategy');
    const user = userEvent.setup();

    await act(async () => {
      await user.type(textarea, 'Buy SOL when it drops 5%');
      await user.click(generateButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/strategy/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'Buy SOL when it drops 5%' }),
        })
      );
    });
  });

  it('displays generated strategy after successful generation', async () => {
    const mockStrategyResponse = {
      success: true,
      strategy: 'AI Generated Strategy:\n\n1. Entry: Buy when price drops 5%\n2. Exit: Sell when price rises 3%\n3. Stop Loss: 10% down\n4. Position Size: 10% of portfolio',
      timestamp: new Date().toISOString()
    };

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      if (url.includes('/api/strategy/generate')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockStrategyResponse),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const textarea = screen.getByPlaceholderText(/Describe your trading strategy in natural language/);
    const generateButton = screen.getByText('Generate Strategy');
    const user = userEvent.setup();

    await act(async () => {
      await user.type(textarea, 'Test strategy prompt');
      await user.click(generateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Generated Strategy:')).toBeInTheDocument();
      expect(screen.getByText(/AI Generated Strategy:/)).toBeInTheDocument();
      expect(screen.getByText(/Entry: Buy when price drops 5%/)).toBeInTheDocument();
    });
  });

  it('shows Start Bot button when strategy is generated', async () => {
    const mockStrategyResponse = {
      success: true,
      strategy: 'AI Generated Strategy: Test strategy',
      timestamp: new Date().toISOString()
    };

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      if (url.includes('/api/strategy/generate')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockStrategyResponse),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const textarea = screen.getByPlaceholderText(/Describe your trading strategy in natural language/);
    const generateButton = screen.getByText('Generate Strategy');
    const user = userEvent.setup();

    await act(async () => {
      await user.type(textarea, 'Test strategy');
      await user.click(generateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Start Bot with This Strategy')).toBeInTheDocument();
    });
  });

  it('calls bot start API when Start Bot button is clicked', async () => {
    const mockStrategyResponse = {
      success: true,
      strategy: 'AI Generated Strategy: Test strategy',
      timestamp: new Date().toISOString()
    };

    const mockBotStartResponse = {
      success: true,
      message: 'Bot started with ai_generated strategy',
      timestamp: new Date().toISOString()
    };

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      if (url.includes('/api/strategy/generate')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockStrategyResponse),
        });
      }
      if (url.includes('/api/bot/start')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockBotStartResponse),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const textarea = screen.getByPlaceholderText(/Describe your trading strategy in natural language/);
    const generateButton = screen.getByText('Generate Strategy');
    const user = userEvent.setup();

    // Generate strategy first
    await act(async () => {
      await user.type(textarea, 'Test strategy');
      await user.click(generateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Start Bot with This Strategy')).toBeInTheDocument();
    });

    // Click start bot button
    const startBotButton = screen.getByText('Start Bot with This Strategy');
    await act(async () => {
      await user.click(startBotButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bot/start'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy: 'ai_generated',
            walletAddress: 'user-wallet-address',
            strategyDetails: 'AI Generated Strategy: Test strategy'
          }),
        })
      );
    });
  });

  it('disables Generate Strategy button when generating', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      if (url.includes('/api/strategy/generate')) {
        // Simulate slow API response
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              json: () => Promise.resolve({
                success: true,
                strategy: 'Test strategy',
                timestamp: new Date().toISOString()
              }),
            });
          }, 100);
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const textarea = screen.getByPlaceholderText(/Describe your trading strategy in natural language/);
    const generateButton = screen.getByText('Generate Strategy');
    const user = userEvent.setup();

    await act(async () => {
      await user.type(textarea, 'Test strategy');
      await user.click(generateButton);
    });

    // Button should be disabled and show "Generating Strategy..."
    expect(screen.getByText('Generating Strategy...')).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });

  it('handles strategy generation error gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      if (url.includes('/api/strategy/generate')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: false,
            error: 'Failed to generate strategy',
            timestamp: new Date().toISOString()
          }),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const textarea = screen.getByPlaceholderText(/Describe your trading strategy in natural language/);
    const generateButton = screen.getByText('Generate Strategy');
    const user = userEvent.setup();

    await act(async () => {
      await user.type(textarea, 'Test strategy');
      await user.click(generateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to generate strategy')).toBeInTheDocument();
    });
  });

  it('disables Generate Strategy button when prompt is empty', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const generateButton = screen.getByText('Generate Strategy');
    expect(generateButton).toBeDisabled();
  });

  it('enables Generate Strategy button when prompt has content', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/bot/status')) {
        return Promise.resolve({
          json: () => Promise.resolve({ 
            status: 'ready', 
            strategies: ['ai_generated'], 
            timestamp: new Date().toISOString() 
          }),
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    await act(async () => {
      render(<Home />);
    });

    const textarea = screen.getByPlaceholderText(/Describe your trading strategy in natural language/);
    const generateButton = screen.getByText('Generate Strategy');
    const user = userEvent.setup();

    await act(async () => {
      await user.type(textarea, 'Test strategy');
    });

    expect(generateButton).not.toBeDisabled();
  });
});
