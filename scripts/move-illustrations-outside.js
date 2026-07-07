const fs = require('fs');
const path = require('path');

/**
 * Script to move illustration.svg files from version folders to course root
 * Run: node scripts/move-illustrations-outside.js
 */

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');

function findCourseDirectories(dir, courseList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'versions') {
      // Check if this directory has a versions subdirectory
      const versionsPath = path.join(filePath, 'versions');
      if (fs.existsSync(versionsPath)) {
        courseList.push(filePath);
      } else {
        // Keep searching deeper
        findCourseDirectories(filePath, courseList);
      }
    }
  });
  
  return courseList;
}

function moveIllustration(courseDir) {
  try {
    const courseName = path.basename(courseDir);
    const versionPath = path.join(courseDir, 'versions', '1.0.0');
    const sourceSvg = path.join(versionPath, 'illustration.svg');
    const destSvg = path.join(courseDir, 'illustration.svg');
    
    // Check if source exists
    if (!fs.existsSync(sourceSvg)) {
      console.log(`⚠️  No illustration.svg found in ${versionPath}`);
      return;
    }
    
    // Check if destination already exists
    if (fs.existsSync(destSvg)) {
      console.log(`✓ ${courseName} - already has illustration.svg in root`);
      return;
    }
    
    // Move the file
    fs.copyFileSync(sourceSvg, destSvg);
    fs.unlinkSync(sourceSvg);
    
    console.log(`✅ Moved: ${courseName}/illustration.svg`);
  } catch (error) {
    console.error(`❌ Error moving illustration for ${path.basename(courseDir)}:`, error.message);
  }
}

function main() {
  console.log('📦 Moving illustration.svg files from versions to course root...\n');
  
  const courseDirs = findCourseDirectories(CONTENT_DIR);
  
  console.log(`Found ${courseDirs.length} course directories\n`);
  
  courseDirs.forEach(dirPath => {
    moveIllustration(dirPath);
  });
  
  console.log('\n✨ Done!');
}

main();
