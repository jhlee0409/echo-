#!/usr/bin/env node

/**
 * 의존성 유지보수 및 업데이트 스크립트
 * Dependency Maintenance and Update Script
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
  package: '📦',
  security: '🔒',
  update: '🔄',
  clean: '🧹'
};

class DependencyMaintainer {
  constructor() {
    this.packageJsonPath = path.join(rootDir, 'package.json');
    this.results = {
      updated: [],
      vulnerabilities: [],
      outdated: [],
      errors: []
    };
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

  async getPackageJson() {
    try {
      const content = await fs.readFile(this.packageJsonPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.log('error', 'Could not read package.json', error.message);
      throw error;
    }
  }

  async checkOutdatedDependencies() {
    this.log('info', 'Checking for outdated dependencies...');
    
    try {
      const { stdout } = await execAsync('npm outdated --json', { 
        cwd: rootDir,
        timeout: 30000 
      });
      
      if (stdout.trim()) {
        const outdated = JSON.parse(stdout);
        this.results.outdated = Object.entries(outdated).map(([name, info]) => ({
          name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          type: info.type
        }));

        this.log('warning', `Found ${this.results.outdated.length} outdated packages`);
        
        // Show summary of outdated packages
        this.results.outdated.forEach(pkg => {
          console.log(`   ${colors.yellow}${pkg.name}${colors.reset}: ${pkg.current} → ${colors.green}${pkg.latest}${colors.reset}`);
        });
      } else {
        this.log('success', 'All dependencies are up to date');
      }
    } catch (error) {
      if (error.stdout && error.stdout.trim()) {
        // npm outdated returns exit code 1 when outdated packages exist
        try {
          const outdated = JSON.parse(error.stdout);
          this.results.outdated = Object.entries(outdated).map(([name, info]) => ({
            name,
            current: info.current,
            wanted: info.wanted,
            latest: info.latest,
            type: info.type
          }));

          this.log('warning', `Found ${this.results.outdated.length} outdated packages`);
        } catch (parseError) {
          this.log('error', 'Could not parse outdated packages', parseError.message);
        }
      } else {
        this.log('error', 'Could not check outdated packages', error.message);
      }
    }
  }

  async runSecurityAudit() {
    this.log('info', 'Running security audit...');
    
    try {
      const { stdout } = await execAsync('npm audit --json', { 
        cwd: rootDir,
        timeout: 30000 
      });
      
      const audit = JSON.parse(stdout);
      
      if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
        const vulnCount = Object.values(audit.vulnerabilities).length;
        this.log('warning', `Found ${vulnCount} vulnerabilities`);
        
        // Categorize vulnerabilities by severity
        const severityCounts = { low: 0, moderate: 0, high: 0, critical: 0 };
        
        Object.values(audit.vulnerabilities).forEach(vuln => {
          if (vuln.severity) {
            severityCounts[vuln.severity]++;
          }
        });

        console.log(`   ${colors.cyan}Breakdown:${colors.reset}`);
        Object.entries(severityCounts).forEach(([severity, count]) => {
          if (count > 0) {
            const color = severity === 'critical' ? colors.red : 
                         severity === 'high' ? colors.yellow : colors.blue;
            console.log(`   ${color}${severity}: ${count}${colors.reset}`);
          }
        });

        this.results.vulnerabilities = Object.entries(audit.vulnerabilities);
      } else {
        this.log('success', 'No security vulnerabilities found');
      }
    } catch (error) {
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          if (audit.vulnerabilities) {
            const vulnCount = Object.keys(audit.vulnerabilities).length;
            this.log('warning', `Found ${vulnCount} vulnerabilities`);
            this.results.vulnerabilities = Object.entries(audit.vulnerabilities);
          }
        } catch (parseError) {
          this.log('error', 'Could not parse security audit', parseError.message);
        }
      } else {
        this.log('error', 'Could not run security audit', error.message);
      }
    }
  }

  async fixSecurityVulnerabilities() {
    if (this.results.vulnerabilities.length === 0) {
      this.log('info', 'No vulnerabilities to fix');
      return;
    }

    this.log('info', 'Attempting to fix security vulnerabilities...');
    
    try {
      const { stdout } = await execAsync('npm audit fix --json', { 
        cwd: rootDir,
        timeout: 60000 
      });
      
      const result = JSON.parse(stdout);
      
      if (result.audit && result.audit.fixed > 0) {
        this.log('success', `Fixed ${result.audit.fixed} vulnerabilities`);
      } else {
        this.log('info', 'No automatic fixes available');
      }
    } catch (error) {
      this.log('error', 'Could not fix vulnerabilities automatically', error.message);
    }
  }

  async updateDependencies(type = 'minor') {
    const packageJson = await this.getPackageJson();
    const outdated = this.results.outdated;
    
    if (outdated.length === 0) {
      this.log('info', 'No dependencies to update');
      return;
    }

    this.log('info', `Updating ${type} version dependencies...`);
    
    const updates = [];
    const criticalPackages = [
      'react',
      'react-dom',
      'typescript',
      'vite',
      '@vitejs/plugin-react'
    ];

    for (const pkg of outdated) {
      const isCritical = criticalPackages.includes(pkg.name);
      const targetVersion = type === 'major' ? pkg.latest : pkg.wanted;
      
      if (type === 'patch' || type === 'minor' || (type === 'major' && !isCritical)) {
        updates.push(`${pkg.name}@${targetVersion}`);
      }
    }

    if (updates.length === 0) {
      this.log('info', 'No safe updates available');
      return;
    }

    try {
      this.log('info', `Installing ${updates.length} updates...`);
      console.log(`   ${colors.cyan}Packages: ${updates.join(', ')}${colors.reset}`);
      
      const command = `npm install ${updates.join(' ')}`;
      await execAsync(command, { 
        cwd: rootDir,
        timeout: 120000 
      });
      
      this.results.updated = updates;
      this.log('success', `Successfully updated ${updates.length} packages`);
      
    } catch (error) {
      this.log('error', 'Could not update dependencies', error.message);
      this.results.errors.push(`Update failed: ${error.message}`);
    }
  }

  async cleanupDependencies() {
    this.log('info', 'Cleaning up dependencies...');
    
    try {
      // Clean npm cache
      await execAsync('npm cache clean --force', { cwd: rootDir });
      this.log('success', 'npm cache cleaned');
      
      // Remove node_modules and reinstall
      const nodeModulesPath = path.join(rootDir, 'node_modules');
      const lockFilePath = path.join(rootDir, 'package-lock.json');
      
      try {
        await fs.rm(nodeModulesPath, { recursive: true, force: true });
        await fs.rm(lockFilePath, { force: true });
        this.log('success', 'Removed old node_modules and lock file');
      } catch (error) {
        this.log('info', 'Old files already cleaned');
      }
      
      // Fresh install
      await execAsync('npm install --legacy-peer-deps', { 
        cwd: rootDir,
        timeout: 180000 
      });
      this.log('success', 'Fresh installation completed');
      
    } catch (error) {
      this.log('error', 'Could not cleanup dependencies', error.message);
      this.results.errors.push(`Cleanup failed: ${error.message}`);
    }
  }

  async validateInstallation() {
    this.log('info', 'Validating installation...');
    
    try {
      // Check if critical packages are installed
      const criticalPackages = [
        'react',
        'react-dom',
        'typescript',
        'vite',
        'tailwindcss',
        'zustand',
        'axios'
      ];

      const nodeModulesPath = path.join(rootDir, 'node_modules');
      const missing = [];

      for (const pkg of criticalPackages) {
        try {
          await fs.access(path.join(nodeModulesPath, pkg));
        } catch {
          missing.push(pkg);
        }
      }

      if (missing.length === 0) {
        this.log('success', 'All critical packages are installed');
      } else {
        this.log('error', `Missing packages: ${missing.join(', ')}`);
        this.results.errors.push(`Missing packages: ${missing.join(', ')}`);
      }

      // Try to run type check
      try {
        await execAsync('npx tsc --noEmit', { 
          cwd: rootDir,
          timeout: 30000 
        });
        this.log('success', 'TypeScript compilation check passed');
      } catch (error) {
        this.log('warning', 'TypeScript issues detected');
      }
      
    } catch (error) {
      this.log('error', 'Could not validate installation', error.message);
      this.results.errors.push(`Validation failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.magenta}${icons.package} DEPENDENCY MAINTENANCE REPORT${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log(`${colors.blue}📊 Summary:${colors.reset}`);
    console.log(`   Updated packages: ${colors.green}${this.results.updated.length}${colors.reset}`);
    console.log(`   Outdated packages: ${colors.yellow}${this.results.outdated.length}${colors.reset}`);
    console.log(`   Vulnerabilities: ${colors.red}${this.results.vulnerabilities.length}${colors.reset}`);
    console.log(`   Errors: ${colors.red}${this.results.errors.length}${colors.reset}`);
    
    if (this.results.updated.length > 0) {
      console.log(`\n${colors.green}${icons.update} Updated Packages:${colors.reset}`);
      this.results.updated.forEach(pkg => {
        console.log(`   ${colors.green}✓${colors.reset} ${pkg}`);
      });
    }
    
    if (this.results.outdated.length > 0) {
      console.log(`\n${colors.yellow}${icons.warning} Still Outdated:${colors.reset}`);
      this.results.outdated.forEach(pkg => {
        if (!this.results.updated.some(updated => updated.startsWith(pkg.name))) {
          console.log(`   ${colors.yellow}!${colors.reset} ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
        }
      });
    }
    
    if (this.results.vulnerabilities.length > 0) {
      console.log(`\n${colors.red}${icons.security} Security Issues:${colors.reset}`);
      console.log(`   ${colors.red}${this.results.vulnerabilities.length} vulnerabilities need attention${colors.reset}`);
      console.log(`   ${colors.cyan}Run 'npm audit fix' to attempt automatic fixes${colors.reset}`);
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n${colors.red}${icons.error} Errors:${colors.reset}`);
      this.results.errors.forEach(error => {
        console.log(`   ${colors.red}✗${colors.reset} ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.errors.length === 0) {
      console.log(`${colors.green}${icons.check} Maintenance completed successfully!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}${icons.warning} Maintenance completed with some issues.${colors.reset}`);
    }
  }

  async run(options = {}) {
    console.log(`${colors.cyan}${icons.rocket} Starting dependency maintenance...${colors.reset}\n`);
    
    const {
      update = false,
      updateType = 'minor',
      cleanup = false,
      audit = true,
      fix = false
    } = options;

    // Always check what's outdated
    await this.checkOutdatedDependencies();
    
    // Run security audit if requested
    if (audit) {
      await this.runSecurityAudit();
    }
    
    // Fix vulnerabilities if requested
    if (fix && this.results.vulnerabilities.length > 0) {
      await this.fixSecurityVulnerabilities();
    }
    
    // Update dependencies if requested
    if (update) {
      await this.updateDependencies(updateType);
    }
    
    // Clean up if requested
    if (cleanup) {
      await this.cleanupDependencies();
    }
    
    // Always validate at the end
    await this.validateInstallation();
    
    // Generate final report
    await this.generateReport();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    update: args.includes('--update'),
    updateType: args.includes('--major') ? 'major' : 
                args.includes('--patch') ? 'patch' : 'minor',
    cleanup: args.includes('--cleanup'),
    audit: !args.includes('--no-audit'),
    fix: args.includes('--fix')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}Soulmate Dependency Maintenance Script${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node deps-maintenance.js [options]

${colors.yellow}Options:${colors.reset}
  --update          Update outdated dependencies
  --major           Include major version updates (use with caution)
  --patch           Only patch version updates
  --cleanup         Clean node_modules and reinstall
  --fix             Attempt to fix security vulnerabilities
  --no-audit        Skip security audit
  --help, -h        Show this help message

${colors.yellow}Examples:${colors.reset}
  node deps-maintenance.js                    # Check status only
  node deps-maintenance.js --update           # Update minor versions
  node deps-maintenance.js --update --major   # Update including major versions
  node deps-maintenance.js --cleanup          # Clean reinstall
  node deps-maintenance.js --fix              # Fix vulnerabilities
    `);
    return;
  }

  const maintainer = new DependencyMaintainer();
  
  try {
    await maintainer.run(options);
  } catch (error) {
    console.error(`${colors.red}${icons.error} Maintenance failed:${colors.reset}`, error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DependencyMaintainer;