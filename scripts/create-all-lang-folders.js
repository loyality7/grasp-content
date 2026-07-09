const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');

function setupLangFolders() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('Content directory not found:', CONTENT_DIR);
    process.exit(1);
  }

  const domains = fs.readdirSync(CONTENT_DIR);
  domains.forEach(domain => {
    const domainPath = path.join(CONTENT_DIR, domain);
    if (!fs.statSync(domainPath).isDirectory()) return;

    const courses = fs.readdirSync(domainPath);
    courses.forEach(courseId => {
      const coursePath = path.join(domainPath, courseId);
      if (!fs.statSync(coursePath).isDirectory()) return;

      const versionsPath = path.join(coursePath, 'versions');
      if (!fs.existsSync(versionsPath)) return;

      const versions = fs.readdirSync(versionsPath);
      versions.forEach(version => {
        const versionPath = path.join(versionsPath, version);
        if (!fs.statSync(versionPath).isDirectory()) return;

        const chaptersDir = path.join(versionPath, 'chapters');
        if (!fs.existsSync(chaptersDir)) return;

        const chapters = fs.readdirSync(chaptersDir);
        chapters.forEach(chapterId => {
          const chapterPath = path.join(chaptersDir, chapterId);
          if (!fs.statSync(chapterPath).isDirectory()) return;

          const topicsDir = path.join(chapterPath, 'topics');
          if (!fs.existsSync(topicsDir)) return;

          const topics = fs.readdirSync(topicsDir);
          topics.forEach(topicId => {
            const topicPath = path.join(topicsDir, topicId);
            if (!fs.statSync(topicPath).isDirectory()) return;

            const langsDir = path.join(topicPath, 'langs');
            
            // Clean up any old bad/foreign dirs if they exist
            const badDirs = ['es', 'fr', 'de', '$_', '$\\$', '$_'];
            badDirs.forEach(bad => {
              const badPath = path.join(langsDir, bad);
              if (fs.existsSync(badPath)) {
                fs.rmSync(badPath, { recursive: true, force: true });
              }
            });

            // Create hi, te, ta, kn, ml dirs and .gitkeep files
            const targetLangs = ['hi', 'te', 'ta', 'kn', 'ml'];
            targetLangs.forEach(lang => {
              const langPath = path.join(langsDir, lang);
              fs.mkdirSync(langPath, { recursive: true });
              
              const gitkeepPath = path.join(langPath, '.gitkeep');
              if (!fs.existsSync(gitkeepPath)) {
                fs.writeFileSync(gitkeepPath, '');
              }
            });
          });
        });
      });
    });
  });

  console.log('✅ Successfully set up empty langs folders (hi, te, ta, kn, ml) with .gitkeeps for all topics!');
}

setupLangFolders();
