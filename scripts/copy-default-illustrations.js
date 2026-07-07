const fs = require('fs');
const path = require('path');

/**
 * Script to copy default illustration.svg to all course version directories
 * Run: node scripts/copy-default-illustrations.js
 */

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');
const DEFAULT_SVG_PATH = path.join(__dirname, '..', 'content', 'courses', 'default-illustration.svg');

function findCourseVersionDirs(dir, dirList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Check if this is a version directory (contains course.json)
      const courseJsonPath = path.join(filePath, 'course.json');
      if (fs.existsSync(courseJsonPath)) {
        dirList.push(filePath);
      } else {
        // Continue searching deeper
        findCourseVersionDirs(filePath, dirList);
      }
    }
  });
  
  return dirList;
}

function copyDefaultIllustration(versionDir) {
  try {
    const illustrationPath = path.join(versionDir, 'illustration.svg');
    
    // Skip if illustration.svg already exists (like arithmetic which has custom one)
    if (fs.existsSync(illustrationPath)) {
      console.log(`✓ ${versionDir} - already has illustration.svg`);
      return;
    }
    
    // Copy default illustration
    fs.copyFileSync(DEFAULT_SVG_PATH, illustrationPath);
    console.log(`✅ Copied to: ${versionDir}`);
  } catch (error) {
    console.error(`❌ Error copying to ${versionDir}:`, error.message);
  }
}

function main() {
  console.log('📋 Copying default illustration.svg to all course directories...\n');
  
  const versionDirs = findCourseVersionDirs(CONTENT_DIR);
  
  console.log(`Found ${versionDirs.length} version directories\n`);
  
  versionDirs.forEach(dirPath => {
    copyDefaultIllustration(dirPath);
  });
  
  console.log('\n✨ Done!');
}

main();
