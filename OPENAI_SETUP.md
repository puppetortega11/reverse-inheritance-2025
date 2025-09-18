# OpenAI API Setup for AI Strategy Generator

## 🔑 **Required Environment Variables**

To use the AI strategy generator, you need to set up the OpenAI API key:

### **For Railway (Backend)**
1. Go to your Railway project dashboard
2. Navigate to **Variables** tab
3. Add environment variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-openai-api-key-here`

### **For Local Development**
Create a `.env` file in the `/backend` directory:
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 🚀 **How to Get OpenAI API Key**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)
6. Add it to your Railway environment variables

## 💡 **Usage Example**

1. **Open the trading bot interface**
2. **In the "AI Strategy Generator" section**, type something like:
   ```
   Buy SOL when it drops 5% and sell when it rises 3%. 
   Use stop loss at 10% down and take profit at 8% up.
   ```
3. **Click "Generate Strategy"**
4. **Review the AI-generated strategy**
5. **Click "Start Bot with This Strategy"**

## 🎯 **What the AI Does**

The AI converts your natural language into a structured trading strategy including:
- **Entry conditions** (when to buy)
- **Exit conditions** (when to sell)
- **Risk management** (stop loss, take profit)
- **Position sizing** recommendations
- **Trading pairs** to focus on

## ⚠️ **Important Notes**

- **API Key Required**: The AI strategy generator won't work without a valid OpenAI API key
- **Cost**: OpenAI API calls have a small cost (usually < $0.01 per request)
- **Rate Limits**: OpenAI has rate limits, but they're generous for normal usage
- **Privacy**: Your prompts are sent to OpenAI's servers

## 🔧 **Troubleshooting**

If the AI strategy generator isn't working:
1. Check that `OPENAI_API_KEY` is set in Railway
2. Verify the API key is valid and has credits
3. Check the Railway logs for error messages
4. Ensure your OpenAI account has sufficient credits
