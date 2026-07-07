const fs = require('fs');
const path = require('path');

const contentDir = path.resolve(__dirname, '../content');
const domainsDir = path.join(contentDir, 'domains');
const coursesDir = path.join(contentDir, 'courses');

function cleanJsonText(raw) {
  return raw
    .replace(/^\uFEFF/, '')
    .replace(/[\u00A0\u2000-\u200F\u2028\u2029\u202F\u205F\u3000]/g, ' ');
}

function buildManifests() {
  console.log('Starting metadata compilation...');
  if (!fs.existsSync(domainsDir)) {
    console.error('Domains directory not found:', domainsDir);
    process.exit(1);
  }

  const domainDirs = fs.readdirSync(domainsDir).filter(f => {
    return fs.statSync(path.join(domainsDir, f)).isDirectory();
  });

  const domainsCombined = [];

  for (const domainId of domainDirs) {
    const domainJsonPath = path.join(domainsDir, domainId, 'domain.json');
    if (!fs.existsSync(domainJsonPath)) continue;

    const rawDomain = fs.readFileSync(domainJsonPath, 'utf8');
    const domainData = JSON.parse(cleanJsonText(rawDomain));
    console.log(`Processing domain: ${domainId}`);

    // Read all courses inside this domain
    const coursesCombined = [];
    const courseIds = domainData.courses || [];

    for (const courseId of courseIds) {
      const indexJsonPath = path.join(coursesDir, domainId, courseId, 'index.json');
      const latestJsonPath = path.join(coursesDir, domainId, courseId, 'latest.json');

      if (fs.existsSync(indexJsonPath)) {
        const rawIndex = fs.readFileSync(indexJsonPath, 'utf8');
        const indexData = JSON.parse(cleanJsonText(rawIndex));
        let version = indexData.version || '1.0.0';

        if (fs.existsSync(latestJsonPath)) {
          const rawLatest = fs.readFileSync(latestJsonPath, 'utf8');
          const latestData = JSON.parse(cleanJsonText(rawLatest));
          version = latestData.latest || version;
        }

        coursesCombined.push({
          id: courseId,
          title: indexData.title || courseId,
          description: indexData.description || '',
          version: version,
          difficulty: indexData.difficulty || 'intermediate',
          estimatedHours: indexData.estimatedHours || 10,
          chaptersCount: indexData.chapters || 0
        });
      }
    }

    // Write domain-specific courses.json
    const domainCoursesPath = path.join(coursesDir, domainId, 'courses.json');
    fs.writeFileSync(domainCoursesPath, JSON.stringify(coursesCombined, null, 2), 'utf8');
    console.log(`  - Wrote ${coursesCombined.length} courses to ${domainCoursesPath}`);

    domainsCombined.push({
      id: domainData.id,
      name: domainData.name,
      description: domainData.description,
      courseCount: coursesCombined.length,
      icon: domainData.metadata?.icon || 'book',
      color: domainData.metadata?.color || '#3B82F6',
      order: domainData.metadata?.order || 99
    });
  }

  // Sort domains by order metadata
  domainsCombined.sort((a, b) => (a.order || 99) - (b.order || 99));

  // Write combined domains.json in content/domains.json
  const combinedDomainsPath = path.join(contentDir, 'domains.json');
  fs.writeFileSync(combinedDomainsPath, JSON.stringify(domainsCombined, null, 2), 'utf8');
  console.log(`Successfully compiled combined domains metadata to ${combinedDomainsPath}`);
}

buildManifests();
