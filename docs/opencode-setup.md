# OpenCode Setup Guide

## Installation

### 1. Install OpenCode CLI

Choose your preferred installation method:

**npm (recommended):**
```bash
npm install -g @opencode/cli
```

**Homebrew (macOS):**
```bash
brew tap opencode/opencode
brew install opencode
```

**Download Binary:**
Visit https://opencode.ai and download for your platform.

### 2. Authenticate

```bash
opencode auth login
```

Follow the prompts to authenticate with your preferred provider.

## Project Configuration

### OpenCode Configuration File

Create or update `~/.config/opencode/opencode.json`:

```json
{
  "defaultModel": "opencode-big-pickle",
  "providers": {
    "antigravity": {
      "enabled": true,
      "apiKey": "your_antigravity_api_key",
      "models": [
        "antigravity-gemini-3-pro",
        "antigravity-gemini-3-flash",
        "antigravity-claude-3-sonnet",
        "antigravity-claude-3-opus"
      ]
    },
    "github": {
      "enabled": true,
      "models": [
        "github-copilot",
        "github-copilot-chat"
      ]
    }
  }
}
```

### Getting Antigravity Access

1. **Install the Antigravity Plugin:**
   ```bash
   opencode plugin install antigravity-auth
   ```

2. **Authenticate with Google OAuth:**
   ```bash
   opencode antigravity-auth
   ```

3. **Follow the browser prompt** to grant access to Gemini and Claude models.

### GitHub Copilot Integration

If you have a GitHub Copilot subscription:

1. **Authenticate with GitHub:**
   ```bash
   opencode auth login --provider github
   ```

2. **Enable Copilot models:** The authentication will automatically make Copilot models available.

## Usage

### Starting an Assistant Session

From the project root:

```bash
cd rock-paper-beer-local
opencode start
```

This will:
- Scan the entire codebase
- Load all TypeScript, React, and configuration files
- Make the full context available to the assistant

### Recommended Models

**General Development:**
```bash
opencode start --model opencode-big-pickle
```

**Complex Reasoning:**
```bash
opencode start --model antigravity-gemini-3-pro
```

**Code Generation & Refactoring:**
```bash
opencode start --model antigravity-claude-3-sonnet
```

**Quick Autocomplete (with Copilot):**
```bash
opencode start --model github-copilot
```

## Project-Specific Tips

### Best Model Uses

**Code Architecture:**
- Use `antigravity-claude-3-sonnet` for refactoring and architectural decisions
- The model excels at understanding complex TypeScript relationships

**Game Logic Development:**
- Use `antigravity-gemini-3-pro` for rule implementation and edge cases
- Strong reasoning capabilities for game mechanics

**UI/UX Work:**
- Use `opencode-big-pickle` for React component development
- Good balance of speed and quality for frontend work

**Testing:**
- Use `antigravity-gemini-3-flash` for quick test generation
- Fast and cost-effective for test code

### Prompt Examples

**For Game Logic:**
```
Review the game logic in packages/game-logic/src/game-logic.ts and suggest improvements for the decideWinner function. Consider edge cases and performance.
```

**For UI Development:**
```
Update the Game component to show a countdown timer when waiting for opponent moves. Use the existing GameBoy theme and animations.
```

**For Architecture:**
```
Analyze the room management system in apps/server/src/room-manager.ts and suggest how we could add persistence without breaking the current offline-first approach.
```

## Offline Mode

When working offline:

1. **Core functionality works** - local models don't require internet
2. **Limitations:**
   - Antigravity models unavailable (need API access)
   - GitHub Copilot requires authentication
   - Auto-updates disabled

3. **Fallback:**
   ```bash
   # Use local models when offline
   opencode start --model opencode-big-pickle --offline
   ```

## Configuration for This Project

### workspace.json

Create `.opencode/workspace.json` in the project root:

```json
{
  "context": {
    "include": [
      "apps/**/*",
      "packages/**/*",
      "docs/**/*",
      "*.md",
      "*.json"
    ],
    "exclude": [
      "node_modules/**",
      "dist/**",
      "*.log"
    ],
    "focus": [
      "packages/game-logic/src/types.ts",
      "apps/server/src/room-manager.ts",
      "apps/client/src/components/Game.tsx"
    ]
  },
  "preferences": {
    "defaultModel": "opencode-big-pickle",
    "maxTokens": 8000,
    "temperature": 0.7
  }
}
```

## Troubleshooting

### Common Issues

**"Model not found":**
```bash
opencode models list
# Verify available models
```

**"Authentication failed":**
```bash
opencode auth logout
opencode auth login
# Re-authenticate
```

**"Context too large":**
- Use `.opencode/workspace.json` to limit context
- Focus on specific directories or files

**Performance Issues:**
- Use smaller models for quick tasks
- Limit context with workspace configuration
- Clear cache: `opencode cache clear`

### Getting Help

- **Documentation:** https://docs.opencode.ai
- **Community:** https://github.com/opencode/opencode/discussions
- **Issues:** https://github.com/opencode/opencode/issues

## Advanced Configuration

### Custom Prompts

Create `.opencode/prompts/` for reusable prompts:

```
.review-game-logic.md
.generate-tests.md
.refactor-component.md
```

### Model Switching

Quick model switching during session:
```bash
/model antigravity-claude-3-sonnet
/model opencode-big-pickle
```

### Context Management

```bash
# Add to context
/context packages/game-logic/src

# Remove from context  
/remove apps/client/src/styles

# Show current context
/context
```

## Integration with Development Workflow

### Pre-commit Hooks

Add OpenCode to your workflow:

```bash
# Review changes before commit
opencode review --files staged

# Auto-generate tests for new logic
opencode test-generate --packages game-logic

# Check architecture consistency  
opencode lint-architecture
```

### IDE Integration

**VS Code:**
- Install OpenCode extension
- Use inline commands with `opencode://` protocol

**Neovim/Vim:**
- Add keybindings for common commands
- Use floating windows for AI assistance

This configuration gives you the full power of OpenCode for Rock Paper Beer development, with both online and offline capabilities.