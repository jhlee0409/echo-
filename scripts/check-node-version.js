#!/usr/bin/env node

/**
 * Node.js 버전 검증 스크립트 (preinstall 훅용)
 * Node.js Version Validation Script (for preinstall hook)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const REQUIRED_MAJOR_VERSION = 18;
const RECOMMENDED_VERSION = '18.19.0';

async function checkNodeVersion() {
  try {
    const { stdout } = await execAsync('node --version');
    const currentVersion = stdout.trim().replace('v', '');
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    console.log(`${colors.blue}🔍 Current Node.js version: ${currentVersion}${colors.reset}`);
    console.log(`${colors.blue}📋 Required minimum version: ${REQUIRED_MAJOR_VERSION}.0.0${colors.reset}`);
    console.log(`${colors.blue}⭐ Recommended version: ${RECOMMENDED_VERSION}${colors.reset}`);

    if (major < REQUIRED_MAJOR_VERSION) {
      console.error(`\n${colors.red}❌ Node.js version ${currentVersion} is not supported!${colors.reset}`);
      console.error(`${colors.red}   Soulmate requires Node.js ${REQUIRED_MAJOR_VERSION}.0.0 or higher.${colors.reset}`);
      console.error(`\n${colors.yellow}📥 Please upgrade Node.js:${colors.reset}`);
      console.error(`${colors.yellow}   • Download from: https://nodejs.org/${colors.reset}`);
      console.error(`${colors.yellow}   • Use nvm: nvm install ${RECOMMENDED_VERSION}${colors.reset}`);
      console.error(`${colors.yellow}   • Use volta: volta install node@${RECOMMENDED_VERSION}${colors.reset}`);
      
      process.exit(1);
    }

    if (major === REQUIRED_MAJOR_VERSION && currentVersion !== RECOMMENDED_VERSION) {
      console.log(`\n${colors.yellow}⚠️  Warning: Using Node.js ${currentVersion}${colors.reset}`);
      console.log(`${colors.yellow}   For best compatibility, consider upgrading to ${RECOMMENDED_VERSION}${colors.reset}`);
      console.log(`${colors.yellow}   However, your version should work fine.${colors.reset}`);
    }

    console.log(`\n${colors.green}✅ Node.js version is compatible!${colors.reset}`);
    
    // Check npm version as well
    try {
      const { stdout: npmVersion } = await execAsync('npm --version');
      const npmVer = npmVersion.trim();
      console.log(`${colors.green}📦 npm version: ${npmVer}${colors.reset}`);
      
      const [npmMajor] = npmVer.split('.').map(Number);
      if (npmMajor < 9) {
        console.log(`${colors.yellow}⚠️  npm version ${npmVer} detected. Consider upgrading to 9+ for better performance.${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠️  Could not detect npm version: ${error.message}${colors.reset}`);
    }

    return true;
  } catch (error) {
    console.error(`\n${colors.red}❌ Error checking Node.js version:${colors.reset}`);
    console.error(`${colors.red}   ${error.message}${colors.reset}`);
    console.error(`\n${colors.yellow}🔧 Troubleshooting:${colors.reset}`);
    console.error(`${colors.yellow}   • Make sure Node.js is installed and in your PATH${colors.reset}`);
    console.error(`${colors.yellow}   • Try running: node --version${colors.reset}`);
    console.error(`${colors.yellow}   • Install Node.js from: https://nodejs.org/${colors.reset}`);
    
    process.exit(1);
  }
}

// Display system information
async function displaySystemInfo() {
  console.log(`${colors.blue}🖥️  System Information:${colors.reset}`);
  
  try {
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Architecture: ${process.arch}`);
    
    if (process.platform !== 'win32') {
      try {
        const { stdout: osInfo } = await execAsync('uname -a');
        console.log(`   OS: ${osInfo.trim()}`);
      } catch {
        // Ignore if uname is not available
      }
    }
  } catch (error) {
    console.log(`   ${colors.yellow}Could not gather system info${colors.reset}`);
  }
  
  console.log('');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`${colors.blue}🚀 Soulmate Project - Node.js Version Check${colors.reset}`);
  console.log('='.repeat(50));
  
  displaySystemInfo()
    .then(() => checkNodeVersion())
    .then(() => {
      console.log(`\n${colors.green}🎉 All checks passed! Proceeding with installation...${colors.reset}\n`);
    })
    .catch((error) => {
      console.error(`\n${colors.red}💥 Version check failed:${colors.reset}`, error);
      process.exit(1);
    });
}