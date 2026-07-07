const fs = require('fs');
const path = require('path');

/**
 * Script to add illustration field to all domain courses.json listing files
 * Run: node scripts/add-illustrations-to-listings.js
 */

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');
const DOMAINS = ['biology', 'chemistry', 'computer-science', 'economics', 'game-theory', 'mathematics', 'philosophy', 'physics', 'psychology'];

function addIllustrationToListing(domainPath) {
  const coursesJsonPath = path.join(domainPath, 'courses.json');
  
  if (!fs.existsSync(coursesJsonPath)) {
    console.log(`⚠️  No courses.json found in ${domainPath}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(coursesJsonPath, 'utf8');
    const courses = JSON.parse(content);
    
    let updated = false;
    courses.forEach(course => {
      if (!course.illustration) {
        course.illustration = 'illustration.svg';
        updated = true;
      }
    });
    
    if (updated) {
      const updatedContent = JSON.stringify(courses, null, 2);
      fs.writeFileSync(coursesJsonPath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${coursesJsonPath}`);
    } else {
      console.log(`✓ ${coursesJsonPath} - already has illustrations`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${coursesJsonPath}:`, error.message);
  }
}

function main() {
  console.log('🎨 Adding illustration fields to domain courses.json files...\n');
  
  DOMAINS.forEach(domain => {
    const domainPath = path.join(CONTENT_DIR, domain);
    if (fs.existsSync(domainPath)) {
      addIllustrationToListing(domainPath);
    }
  });
  
  console.log('\n✨ Done!');
}

main();
