const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');

function updateAvailableLanguages() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('Content directory not found:', CONTENT_DIR);
    process.exit(1);
  }

  let updatedCount = 0;
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

            const mainTopicJsonPath = path.join(topicPath, 'topic.json');
            if (!fs.existsSync(mainTopicJsonPath)) return;

            // Base languages always includes English ('en')
            const availableLanguages = ['en'];

            // Check translation directories
            const langsDirPath = path.join(topicPath, 'langs');
            if (fs.existsSync(langsDirPath) && fs.statSync(langsDirPath).isDirectory()) {
              const langDirs = fs.readdirSync(langsDirPath);
              langDirs.forEach(langCode => {
                const langPath = path.join(langsDirPath, langCode);
                if (fs.statSync(langPath).isDirectory()) {
                  // A language is available if it contains topic.json
                  const langTopicJson = path.join(langPath, 'topic.json');
                  if (fs.existsSync(langTopicJson)) {
                    availableLanguages.push(langCode);
                  }
                }
              });
            }

            try {
              const fileContent = fs.readFileSync(mainTopicJsonPath, 'utf8');
              const topicData = JSON.parse(fileContent);
              
              // Only write if there's a change to prevent unnecessary git updates
              const existingLangs = topicData.availableLanguages || [];
              const isSame = existingLangs.length === availableLanguages.length && 
                             existingLangs.every(l => availableLanguages.includes(l));

              if (!isSame) {
                topicData.availableLanguages = availableLanguages;
                fs.writeFileSync(mainTopicJsonPath, JSON.stringify(topicData, null, 2) + '\n', 'utf8');
                updatedCount++;
              }

              // Also write availableLanguages to all localized topic.json files if they exist!
              availableLanguages.forEach(langCode => {
                if (langCode === 'en') return;
                const localizedJsonPath = path.join(langsDirPath, langCode, 'topic.json');
                if (fs.existsSync(localizedJsonPath)) {
                  try {
                    const locContent = fs.readFileSync(localizedJsonPath, 'utf8');
                    const locData = JSON.parse(locContent);
                    const locLangs = locData.availableLanguages || [];
                    const isLocSame = locLangs.length === availableLanguages.length &&
                                      locLangs.every(l => availableLanguages.includes(l));
                    if (!isLocSame) {
                      locData.availableLanguages = availableLanguages;
                      fs.writeFileSync(localizedJsonPath, JSON.stringify(locData, null, 2) + '\n', 'utf8');
                      updatedCount++;
                    }
                  } catch (e) {
                    console.error(`Error processing localized topic ${localizedJsonPath}:`, e);
                  }
                }
              });
            } catch (err) {
              console.error(`Error processing topic ${mainTopicJsonPath}:`, err);
            }
          });
        });
      });
    });
  });

  console.log(`\n✅ Done! Updated availableLanguages in ${updatedCount} topic.json files.`);
}

updateAvailableLanguages();
