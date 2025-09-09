# Welcome to your Lovable project

> **Note**: This project includes enhanced TypeScript strictness and organized module imports. See [Strict TS & Aliases Status](docs/strictness-waiver.md) for current configuration constraints and migration plans.

## Project info

**URL**: https://lovable.dev/projects/13452b89-7869-4e83-ae74-a7186c6ae8d6

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/13452b89-7869-4e83-ae74-a7186c6ae8d6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/13452b89-7869-4e83-ae74-a7186c6ae8d6) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Environment Variables / Secrets

### Frontend (Vite)
- `VITE_SUPABASE_URL` - Supabase project URL (required for frontend app)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (required for frontend app)

### Edge Functions / AI Services
- `ANTHROPIC_API_KEY` - Claude API key for AI-powered features (required for AI functions)
- `NEEDAGENT_IQ_SYSTEM_PROMPT` - System prompt for NeedAgent IQ analysis (required for ai_needagentiq function)
- `SKILLSCOPE_SYSTEM_PROMPT` - System prompt for SkillScope insights (required for ai_skillscope function)  
- `VOICEFIT_SYSTEM_PROMPT` - System prompt for VoiceFit report generation (required for ai_generate_report function)

Note: Edge functions will return 500 error if required environment variables are missing.
