#!/usr/bin/env node

/**
 * 설치 후 처리 스크립트 (postinstall 훅)
 * Post-installation setup script (postinstall hook)
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const icons = {
  check: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  rocket: '🚀',
  gear: '⚙️',
  sparkles: '✨'
};

class PostInstaller {
  constructor() {
    this.tasks = [];
    this.errors = [];
  }

  log(level, message, details = null) {
    const levelColors = {
      success: colors.green,
      error: colors.red,
      warning: colors.yellow,
      info: colors.blue
    };

    const levelIcons = {
      success: icons.check,
      error: icons.error,
      warning: icons.warning,
      info: icons.info
    };

    console.log(
      `${levelColors[level]}${levelIcons[level]} ${message}${colors.reset}`
    );

    if (details) {
      console.log(`   ${colors.cyan}${details}${colors.reset}`);
    }
  }

  async ensureDirectoriesExist() {
    this.log('info', 'Creating project directory structure...');
    
    const directories = [
      'src/components/ui',
      'src/components/game',
      'src/components/chat',
      'src/store',
      'src/api',
      'src/hooks',
      'src/utils',
      'src/types',
      'src/assets/images',
      'src/assets/sounds',
      'src/assets/icons',
      'scripts',
      'public/images',
      'public/sounds',
      'public/icons',
      'docs'
    ];

    for (const dir of directories) {
      const dirPath = path.join(rootDir, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        // Don't log every directory creation to keep output clean
      } catch (error) {
        this.errors.push(`Failed to create directory ${dir}: ${error.message}`);
      }
    }

    this.log('success', `Created ${directories.length} project directories`);
  }

  async setupGitHooks() {
    try {
      // Check if git is available and repository is initialized
      await execAsync('git --version');
      await fs.access(path.join(rootDir, '.git'));
      
      // Check if husky is installed
      const huskyPath = path.join(rootDir, 'node_modules', '.bin', 'husky');
      try {
        await fs.access(huskyPath);
        
        this.log('info', 'Setting up Git hooks with Husky...');
        
        // Install husky hooks
        await execAsync('npx husky install', { cwd: rootDir });
        
        // Add pre-commit hook
        await execAsync(
          'npx husky add .husky/pre-commit "npx lint-staged"',
          { cwd: rootDir }
        );
        
        // Add commit-msg hook
        await execAsync(
          'npx husky add .husky/commit-msg "npx commitlint --edit $1"',
          { cwd: rootDir }
        );
        
        this.log('success', 'Git hooks configured');
        
      } catch (error) {
        this.log('info', 'Husky not installed, skipping Git hooks setup');
      }
      
    } catch (error) {
      this.log('info', 'Git not available or repository not initialized');
    }
  }

  async setupEnvironmentFile() {
    const envLocalPath = path.join(rootDir, '.env.local');
    const envExamplePath = path.join(rootDir, '.env.example');
    
    try {
      // Check if .env.local already exists
      await fs.access(envLocalPath);
      this.log('info', '.env.local already exists');
    } catch {
      // .env.local doesn't exist, create it
      try {
        // Try to copy from .env.example
        await fs.access(envExamplePath);
        await fs.copyFile(envExamplePath, envLocalPath);
        this.log('success', 'Created .env.local from .env.example');
      } catch {
        // Create basic .env.local
        const basicEnv = `# Soulmate AI Companion Game - Environment Variables
# Configure these values before starting development

# API Keys (Required)
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Settings
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000

# Game Configuration
VITE_MAX_DAILY_MESSAGES=50
VITE_ENABLE_DEBUG_MODE=true

# Feature Flags
VITE_ENABLE_VOICE_CHAT=false
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PAYMENT=false

# Optional: Analytics & Monitoring
# VITE_SENTRY_DSN=your_sentry_dsn_here
# VITE_GA_TRACKING_ID=your_google_analytics_id
`;

        await fs.writeFile(envLocalPath, basicEnv, 'utf8');
        this.log('success', 'Created basic .env.local file');
      }
    }
  }

  async generateIndexFiles() {
    this.log('info', 'Generating index files...');
    
    const indexFiles = [
      {
        path: 'src/components/index.ts',
        content: `// Component exports - Auto-generated by postinstall
// Add your component exports here

// Example:
// export { default as Button } from './ui/Button'
// export { default as ChatWindow } from './chat/ChatWindow'
// export { default as GameScreen } from './game/GameScreen'
`
      },
      {
        path: 'src/hooks/index.ts',
        content: `// Hook exports - Auto-generated by postinstall
// Add your custom hook exports here

// Example:
// export { default as useGameStore } from './useGameStore'
// export { default as useAIChat } from './useAIChat'
`
      },
      {
        path: 'src/utils/index.ts',
        content: `// Utility exports - Auto-generated by postinstall
// Add your utility function exports here

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind CSS class merger utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Example:
// export { formatDate } from './dateUtils'
// export { validateInput } from './validation'
`
      }
    ];

    for (const file of indexFiles) {
      const filePath = path.join(rootDir, file.path);
      
      try {
        // Only create if file doesn't exist
        await fs.access(filePath);
        // File exists, skip
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, file.content, 'utf8');
        this.log('success', `Created ${file.path}`);
      }
    }
  }

  async checkCriticalDependencies() {
    this.log('info', 'Verifying critical dependencies...');
    
    const criticalDeps = [
      'react',
      'react-dom',
      'typescript',
      'vite',
      'tailwindcss',
      'zustand',
      'axios',
      '@supabase/supabase-js'
    ];

    const nodeModulesPath = path.join(rootDir, 'node_modules');
    const missing = [];

    for (const dep of criticalDeps) {
      try {
        await fs.access(path.join(nodeModulesPath, dep));
      } catch {
        missing.push(dep);
      }
    }

    if (missing.length === 0) {
      this.log('success', 'All critical dependencies are installed');
    } else {
      this.log('error', `Missing dependencies: ${missing.join(', ')}`);
      this.errors.push(`Missing critical dependencies: ${missing.join(', ')}`);
    }
  }

  async runTypeCheck() {
    this.log('info', 'Running TypeScript type check...');
    
    try {
      await execAsync('npx tsc --noEmit', { 
        cwd: rootDir,
        timeout: 30000 
      });
      this.log('success', 'TypeScript type check passed');
    } catch (error) {
      // Type errors are common after fresh install, don't treat as critical
      this.log('warning', 'TypeScript type check found issues (this is normal for a fresh install)');
    }
  }

  async displayWelcomeMessage() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.magenta}${icons.sparkles} WELCOME TO SOULMATE AI COMPANION GAME! ${icons.sparkles}${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log(`${colors.cyan}🎮 Your AI companion RPG is almost ready!${colors.reset}`);
    console.log('');
    
    console.log(`${colors.yellow}📝 Next Steps:${colors.reset}`);
    console.log(`${colors.green}1.${colors.reset} Configure API keys in .env.local`);
    console.log(`   ${colors.cyan}• Get Claude API key from: https://console.anthropic.com/${colors.reset}`);
    console.log(`   ${colors.cyan}• Set up Supabase project: https://supabase.com/${colors.reset}`);
    console.log('');
    
    console.log(`${colors.green}2.${colors.reset} Start development server`);
    console.log(`   ${colors.cyan}npm run dev${colors.reset}`);
    console.log('');
    
    console.log(`${colors.green}3.${colors.reset} Open in browser`);
    console.log(`   ${colors.cyan}http://localhost:5173${colors.reset}`);
    console.log('');
    
    console.log(`${colors.yellow}🛠️  Available Commands:${colors.reset}`);
    console.log(`   ${colors.cyan}npm run dev${colors.reset}          # Start development server`);
    console.log(`   ${colors.cyan}npm run build${colors.reset}        # Build for production`);
    console.log(`   ${colors.cyan}npm run type-check${colors.reset}   # Check TypeScript types`);
    console.log(`   ${colors.cyan}npm run lint${colors.reset}         # Check code quality`);
    console.log(`   ${colors.cyan}npm run health-check${colors.reset} # Run project health check`);
    console.log('');
    
    if (this.errors.length > 0) {
      console.log(`${colors.red}⚠️  Issues found:${colors.reset}`);
      this.errors.forEach(error => {
        console.log(`   ${colors.red}•${colors.reset} ${error}`);
      });
      console.log('');
    }
    
    console.log(`${colors.green}🚀 Ready to build your AI companion! Happy coding!${colors.reset}`);
    console.log('='.repeat(60));
  }

  async run() {
    console.log(`${colors.blue}${icons.gear} Running post-installation setup...${colors.reset}\n`);

    try {
      await this.ensureDirectoriesExist();
      await this.setupEnvironmentFile();
      await this.generateIndexFiles();
      await this.setupGitHooks();
      await this.checkCriticalDependencies();
      await this.runTypeCheck();
      await this.displayWelcomeMessage();
      
      if (this.errors.length === 0) {
        this.log('success', 'Post-installation setup completed successfully!');
        process.exit(0);
      } else {
        this.log('warning', `Setup completed with ${this.errors.length} issues`);
        process.exit(0); // Don't fail the installation for non-critical issues
      }
    } catch (error) {
      this.log('error', 'Post-installation setup failed', error.message);
      process.exit(0); // Don't fail the installation
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const installer = new PostInstaller();
  installer.run();
}

export default PostInstaller;