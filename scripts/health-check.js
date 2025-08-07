#!/usr/bin/env node

/**
 * 소울메이트 프로젝트 건강 상태 검사 스크립트
 * Soulmate Project Health Check Script
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

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Emojis for better UX
const icons = {
  check: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  rocket: '🚀',
  gear: '⚙️',
  package: '📦',
  security: '🔒'
};

class HealthChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
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

    this.results.details.push({
      timestamp,
      level,
      message,
      details
    });

    if (level === 'success') this.results.passed++;
    if (level === 'error') this.results.failed++;
    if (level === 'warning') this.results.warnings++;
  }

  async checkNodeVersion() {
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim().replace('v', '');
      const [major] = version.split('.').map(Number);

      if (major >= 18) {
        this.log('success', `Node.js version: ${version}`, 'Compatible version');
        return true;
      } else {
        this.log('error', `Node.js version: ${version}`, 'Required: 18.0.0 or higher');
        return false;
      }
    } catch (error) {
      this.log('error', 'Node.js not found', 'Please install Node.js 18+');
      return false;
    }
  }

  async checkPackageManager() {
    const managers = ['npm', 'yarn', 'pnpm'];
    const available = [];

    for (const manager of managers) {
      try {
        await execAsync(`${manager} --version`);
        available.push(manager);
      } catch {
        // Manager not available
      }
    }

    if (available.length > 0) {
      this.log('success', `Package managers available: ${available.join(', ')}`);
      return true;
    } else {
      this.log('error', 'No package manager found', 'Install npm, yarn, or pnpm');
      return false;
    }
  }

  async checkPackageJson() {
    try {
      const packagePath = path.join(rootDir, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);

      // Check required fields
      const requiredFields = ['name', 'version', 'dependencies', 'devDependencies'];
      const missing = requiredFields.filter(field => !packageData[field]);

      if (missing.length === 0) {
        this.log('success', 'package.json structure valid');
      } else {
        this.log('warning', `package.json missing fields: ${missing.join(', ')}`);
      }

      // Check critical dependencies
      const criticalDeps = [
        'react',
        'react-dom',
        'typescript',
        'vite',
        'tailwindcss',
        'zustand',
        'axios'
      ];

      const missingDeps = criticalDeps.filter(dep => 
        !packageData.dependencies[dep] && !packageData.devDependencies[dep]
      );

      if (missingDeps.length === 0) {
        this.log('success', 'All critical dependencies declared');
      } else {
        this.log('error', `Missing critical dependencies: ${missingDeps.join(', ')}`);
      }

      return missingDeps.length === 0;
    } catch (error) {
      this.log('error', 'package.json not found or invalid', error.message);
      return false;
    }
  }

  async checkNodeModules() {
    try {
      const nodeModulesPath = path.join(rootDir, 'node_modules');
      await fs.access(nodeModulesPath);

      // Check if critical packages are installed
      const criticalPackages = [
        'react',
        'react-dom',
        'typescript',
        'vite',
        'tailwindcss',
        'zustand',
        'axios',
        '@supabase/supabase-js'
      ];

      const missing = [];
      for (const pkg of criticalPackages) {
        try {
          await fs.access(path.join(nodeModulesPath, pkg));
        } catch {
          missing.push(pkg);
        }
      }

      if (missing.length === 0) {
        this.log('success', 'All critical packages installed');
        return true;
      } else {
        this.log('error', `Missing packages: ${missing.join(', ')}`, 'Run npm install');
        return false;
      }
    } catch (error) {
      this.log('error', 'node_modules not found', 'Run npm install');
      return false;
    }
  }

  async checkEnvironmentFiles() {
    const envFiles = ['.env.example', '.env.local'];
    let hasExample = false;
    let hasLocal = false;

    for (const file of envFiles) {
      try {
        await fs.access(path.join(rootDir, file));
        if (file === '.env.example') hasExample = true;
        if (file === '.env.local') hasLocal = true;
        this.log('success', `Found ${file}`);
      } catch {
        this.log('warning', `Missing ${file}`, 
          file === '.env.local' ? 'Copy from .env.example and configure' : 'Create example file'
        );
      }
    }

    if (hasLocal) {
      // Check if .env.local has placeholder values
      try {
        const envContent = await fs.readFile(path.join(rootDir, '.env.local'), 'utf8');
        const hasPlaceholders = envContent.includes('your_') || envContent.includes('_here');
        
        if (hasPlaceholders) {
          this.log('warning', 'Environment variables contain placeholders', 
            'Configure real API keys in .env.local'
          );
        } else {
          this.log('success', 'Environment variables configured');
        }
      } catch {
        // File might not exist, already handled above
      }
    }

    return hasExample;
  }

  async checkTypeScriptConfig() {
    const tsConfigs = ['tsconfig.json', 'tsconfig.node.json'];
    
    for (const config of tsConfigs) {
      try {
        await fs.access(path.join(rootDir, config));
        this.log('success', `Found ${config}`);
      } catch {
        this.log('warning', `Missing ${config}`, 'TypeScript configuration needed');
      }
    }

    // Try to run type check
    try {
      await execAsync('npx tsc --noEmit');
      this.log('success', 'TypeScript compilation check passed');
      return true;
    } catch (error) {
      this.log('warning', 'TypeScript issues found', 'Run npm run type-check for details');
      return false;
    }
  }

  async checkTailwindConfig() {
    const tailwindFiles = ['tailwind.config.js', 'postcss.config.js'];
    let allFound = true;

    for (const file of tailwindFiles) {
      try {
        await fs.access(path.join(rootDir, file));
        this.log('success', `Found ${file}`);
      } catch {
        this.log('warning', `Missing ${file}`, 'Tailwind CSS configuration needed');
        allFound = false;
      }
    }

    return allFound;
  }

  async checkGitConfiguration() {
    try {
      await fs.access(path.join(rootDir, '.git'));
      this.log('success', 'Git repository initialized');

      // Check for .gitignore
      try {
        await fs.access(path.join(rootDir, '.gitignore'));
        this.log('success', 'Found .gitignore');
      } catch {
        this.log('warning', 'Missing .gitignore', 'Create .gitignore file');
      }

      return true;
    } catch {
      this.log('info', 'Git repository not initialized', 'Run git init if needed');
      return false;
    }
  }

  async checkViteConfig() {
    try {
      await fs.access(path.join(rootDir, 'vite.config.ts'));
      this.log('success', 'Found vite.config.ts');
      return true;
    } catch {
      try {
        await fs.access(path.join(rootDir, 'vite.config.js'));
        this.log('success', 'Found vite.config.js');
        return true;
      } catch {
        this.log('warning', 'Missing Vite configuration', 'Create vite.config.ts');
        return false;
      }
    }
  }

  async checkProjectStructure() {
    const requiredDirs = [
      'src',
      'src/components',
      'src/store',
      'src/api',
      'src/types',
      'src/hooks',
      'src/utils',
      'public'
    ];

    let allDirsExist = true;

    for (const dir of requiredDirs) {
      try {
        await fs.access(path.join(rootDir, dir));
        // Don't log every directory to keep output clean
      } catch {
        this.log('warning', `Missing directory: ${dir}`, 'Create directory structure');
        allDirsExist = false;
      }
    }

    if (allDirsExist) {
      this.log('success', 'Project directory structure complete');
    }

    return allDirsExist;
  }

  async checkNetworkConnectivity() {
    try {
      // Test connectivity to npm registry
      await execAsync('npm ping', { timeout: 5000 });
      this.log('success', 'Network connectivity to npm registry');
      return true;
    } catch {
      this.log('warning', 'Cannot reach npm registry', 'Check internet connection');
      return false;
    }
  }

  async generateReport() {
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

    console.log('\n' + '='.repeat(60));
    console.log(`${colors.magenta}${icons.rocket} SOULMATE HEALTH CHECK REPORT${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.results.warnings}${colors.reset}`);
    console.log(`${colors.blue}📊 Success Rate: ${successRate}%${colors.reset}`);
    console.log('='.repeat(60));

    if (this.results.failed > 0) {
      console.log(`\n${colors.red}${icons.error} Critical issues found. Please resolve them before continuing.${colors.reset}`);
      process.exit(1);
    } else if (this.results.warnings > 0) {
      console.log(`\n${colors.yellow}${icons.warning} Some issues found but project can run. Consider fixing warnings.${colors.reset}`);
    } else {
      console.log(`\n${colors.green}${icons.check} All checks passed! Project is ready for development.${colors.reset}`);
    }

    console.log(`\n${colors.cyan}${icons.info} Next steps:${colors.reset}`);
    console.log(`${colors.cyan}  1. Configure API keys in .env.local${colors.reset}`);
    console.log(`${colors.cyan}  2. Run 'npm run dev' to start development server${colors.reset}`);
    console.log(`${colors.cyan}  3. Open http://localhost:5173 in your browser${colors.reset}`);
  }

  async run() {
    console.log(`${colors.cyan}${icons.gear} Starting Soulmate project health check...${colors.reset}\n`);

    // Run all checks
    await this.checkNodeVersion();
    await this.checkPackageManager();
    await this.checkPackageJson();
    await this.checkNodeModules();
    await this.checkEnvironmentFiles();
    await this.checkTypeScriptConfig();
    await this.checkTailwindConfig();
    await this.checkViteConfig();
    await this.checkProjectStructure();
    await this.checkGitConfiguration();
    await this.checkNetworkConnectivity();

    // Generate final report
    await this.generateReport();
  }
}

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  checker.run().catch(error => {
    console.error(`${colors.red}${icons.error} Health check failed:${colors.reset}`, error);
    process.exit(1);
  });
}

export default HealthChecker;