const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');
const SEARCH_DIR = path.join(__dirname, '..', 'search');

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return null;
  }
}

function buildSearchIndexes() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('Content directory not found:', CONTENT_DIR);
    process.exit(1);
  }

  fs.mkdirSync(SEARCH_DIR, { recursive: true });

  const searchItems = [];
  const coursesList = [];
  const conceptsList = [];
  const tagsSet = new Set();
  const keywordsSet = new Set();

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

        const courseJsonPath = path.join(versionPath, 'course.json');
        const courseData = safeReadJson(courseJsonPath);
        if (!courseData) return;

        // Add Course Item (for search.json schema compliance)
        const courseItemSchema = {
          id: courseData.id,
          type: 'course',
          title: courseData.name || courseData.title || '',
          tags: (courseData.metadata && courseData.metadata.tags) || [],
          difficulty: courseData.difficulty || 'intermediate',
          estimatedMinutes: (courseData.estimatedHours || 0) * 60,
          subject: courseData.domain || '',
        };
        searchItems.push(courseItemSchema);

        // Add Course Item (legacy for courses.json compatibility)
        const courseItemLegacy = {
          id: courseData.id,
          type: 'course',
          name: courseData.name,
          description: courseData.description,
          domain: courseData.domain,
          version: courseData.version,
          path: `/course/${courseData.id}`
        };
        coursesList.push(courseItemLegacy);

        if (courseData.metadata && Array.isArray(courseData.metadata.tags)) {
          courseData.metadata.tags.forEach(tag => {
            tagsSet.add(tag);
            tag.split('-').forEach(kw => keywordsSet.add(kw));
          });
        }

        // Add Concept Items
        const chaptersDir = path.join(versionPath, 'chapters');
        if (!fs.existsSync(chaptersDir)) return;

        courseData.chapters.forEach(chRef => {
          const chId = chRef.id;
          const chPath = path.join(chaptersDir, chId);
          const chJsonPath = path.join(chPath, 'chapter.json');
          const chData = safeReadJson(chJsonPath);
          if (!chData || !chData.topics) return;

          const topicsDir = path.join(chPath, 'topics');
          chData.topics.forEach(topicRef => {
            const tId = topicRef.id;
            const topicPath = path.join(topicsDir, tId);
            const topicJsonPath = path.join(topicPath, 'topic.json');
            const topicData = safeReadJson(topicJsonPath);

            if (!topicData) return;

            // Concept Item (for search.json schema compliance)
            const conceptItemSchema = {
              id: topicData.topicId,
              type: 'concept',
              title: topicData.name || '',
              tags: topicData.tags || [],
              difficulty: topicData.difficulty || 'intermediate',
              estimatedMinutes: topicData.estimatedMinutes || 15,
              subject: courseData.domain || '',
              course: courseData.id,
              chapter: chId,
              topic: tId,
            };
            searchItems.push(conceptItemSchema);

            // Concept Item (legacy for concepts.json compatibility)
            const conceptItemLegacy = {
              id: topicData.topicId,
              type: 'concept',
              name: topicData.name,
              description: topicData.description,
              courseId: courseData.id,
              chapterId: chId,
              topicId: tId,
              domain: courseData.domain,
              path: `/course/${courseData.id}/player?topic=${topicData.topicId}`
            };
            conceptsList.push(conceptItemLegacy);

            // Add examples/exercises tags to keyword set
            const examplesData = safeReadJson(path.join(topicPath, 'examples.json'));
            if (examplesData && Array.isArray(examplesData.examples)) {
              examplesData.examples.forEach(ex => {
                if (ex.tags) {
                  ex.tags.forEach(t => {
                    tagsSet.add(t);
                    t.split('-').forEach(kw => keywordsSet.add(kw));
                  });
                }
              });
            }
          });
        });
      });
    });
  });

  // Write outputs
  const searchIndexData = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    totalItems: searchItems.length,
    items: searchItems
  };

  fs.writeFileSync(path.join(SEARCH_DIR, 'search.json'), JSON.stringify(searchIndexData, null, 2));
  fs.writeFileSync(path.join(SEARCH_DIR, 'courses.json'), JSON.stringify(coursesList, null, 2));
  fs.writeFileSync(path.join(SEARCH_DIR, 'concepts.json'), JSON.stringify(conceptsList, null, 2));
  fs.writeFileSync(path.join(SEARCH_DIR, 'tags.json'), JSON.stringify(Array.from(tagsSet), null, 2));
  fs.writeFileSync(path.join(SEARCH_DIR, 'keywords.json'), JSON.stringify(Array.from(keywordsSet), null, 2));

  console.log(`\n✅ Generated search index targets in "${SEARCH_DIR}":`);
  console.log(`   - search.json (${searchItems.length} items schema-compliant)`);
  console.log(`   - courses.json (${coursesList.length} courses)`);
  console.log(`   - concepts.json (${conceptsList.length} concepts)`);
}

buildSearchIndexes();
