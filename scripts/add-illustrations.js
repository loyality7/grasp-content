const fs = require('fs');
const path = require('path');

/**
 * Script to add illustration field to all course.json files
 * Run: node scripts/add-illustrations.js
 */

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');
const DEFAULT_ILLUSTRATION = 'illustration.svg';

function findCourseJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findCourseJsonFiles(filePath, fileList);
    } else if (file === 'course.json') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function addIllustrationField(courseJsonPath) {
  try {
    const content = fs.readFileSync(courseJsonPath, 'utf8');
    const courseData = JSON.parse(content);
    
    // Check if illustration field already exists
    if (courseData.illustration) {
      console.log(`✓ ${courseJsonPath} - already has illustration`);
      return;
    }
    
    // Add illustration field after domain
    courseData.illustration = DEFAULT_ILLUSTRATION;
    
    // Write back with proper formatting
    const updatedContent = JSON.stringify(courseData, null, 2);
    fs.writeFileSync(courseJsonPath, updatedContent, 'utf8');
    
    console.log(`✅ Added illustration to: ${courseJsonPath}`);
  } catch (error) {
    console.error(`❌ Error processing ${courseJsonPath}:`, error.message);
  }
}

function main() {
  console.log('🎨 Adding illustration fields to all course.json files...\n');
  
  const courseJsonFiles = findCourseJsonFiles(CONTENT_DIR);
  
  console.log(`Found ${courseJsonFiles.length} course.json files\n`);
  
  courseJsonFiles.forEach(filePath => {
    addIllustrationField(filePath);
  });
  
  console.log('\n✨ Done!');
}

main();
