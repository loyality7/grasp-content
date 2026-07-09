const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');

function createResourcesFiles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('Content directory not found:', CONTENT_DIR);
    process.exit(1);
  }

  let createdCount = 0;
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

            // Define path to resources.json at the English root of the topic
            const resourcesPath = path.join(topicPath, 'resources.json');
            
            // Only create if it doesn't already exist
            const template = {
              resources: [
                {
                  id: "resource-01",
                  title: "Sample Resource Title",
                  url: "https://example.com/resource",
                  type: "website",
                  description: "Replace this template. Supported types: 'video', 'pdf', 'article', 'website'.",
                  source: "Grasp Academy"
                }
              ]
            };
            fs.writeFileSync(resourcesPath, JSON.stringify(template, null, 2));
            createdCount++;
          });
        });
      });
    });
  });

  console.log(`\n✅ Successfully created ${createdCount} new resources.json files across all courses!`);
}

createResourcesFiles();
