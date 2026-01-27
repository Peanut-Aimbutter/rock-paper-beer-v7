# VS Code OpenCode Setup Guide

## Quick Setup After Extension Installation

### 1. Install OpenCode CLI (Required)

Open VS Code terminal and run:

```bash
npm install -g @opencode/cli
```

### 2. Authenticate with GitHub

```bash
opencode auth login
```
- Choose "GitHub" as provider
- Follow browser prompts to authenticate
- This enables GitHub Copilot models if you have subscription

### 3. Optional: Enable Advanced Models

For access to Gemini and Claude models:

```bash
# Install Antigravity plugin
opencode plugin install antigravity-auth

# Authenticate with Google OAuth
opencode antigravity-auth
```

### 4. Start OpenCode in Project

From your rock-paper-beer-local directory:

```bash
cd rock-paper-beer-local
opencode start
```

### 5. VS Code Integration Tips

**Keyboard Shortcuts:**
- `Ctrl+Shift+P` → "OpenCode: Start Assistant"
- `Ctrl+Shift+P` → "OpenCode: Change Model"
- `Ctrl+Shift+P` → "OpenCode: Add to Context"

**Inline Chat:**
- Select code → Right-click → "OpenCode: Ask About Selection"

**Status Bar:**
- Click OpenCode status icon to see current model
- Click to quickly switch models

### 6. Recommended Settings for This Project

In VS Code settings (`.vscode/settings.json`):

```json
{
  "opencode.defaultModel": "opencode-big-pickle",
  "opencode.maxTokens": 8000,
  "opencode.temperature": 0.7,
  "opencode.autoIncludeContext": true,
  "opencode.focusFiles": [
    "packages/game-logic/src/types.ts",
    "apps/server/src/room-manager.ts",
    "apps/client/src/components/Game.tsx"
  ]
}
```

### 7. Test Your Setup

1. **Start the assistant:**
   ```bash
   opencode start
   ```

2. **Test basic functionality:**
   ```
   Can you explain the Rock Paper Beer game rules based on the code?
   ```

3. **Try model switching:**
   ```bash
   # For complex reasoning
   /model antigravity-claude-3-sonnet
   
   # For quick coding
   /model opencode-big-pickle
   ```

### 8. Troubleshooting

**Extension Not Working:**
- Restart VS Code
- Check that CLI is installed: `opencode --version`
- Verify authentication: `opencode auth status`

**Models Not Available:**
- Run `opencode models list` to see available models
- Re-authenticate: `opencode auth login`

**Context Issues:**
- Use `.opencode/workspace.json` in project root
- Manually add files: `/context packages/game-logic/src`

## Next Steps for Rock Paper Beer Project

Once OpenCode is set up, you can use these prompts:

**For Game Development:**
```
Review the game logic in packages/game-logic/src and suggest improvements
```

**For UI Enhancement:**
```
Add animations to the move buttons in the Game component while keeping the GameBoy theme
```

**For Architecture:**
```
Suggest how we could add game persistence without breaking the offline-first approach
```

You're now ready for AI-assisted development on your Rock Paper Beer project! 🍺