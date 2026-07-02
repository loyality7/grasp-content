const fs = require('fs');
const path = require('path');

const NOTES = 'D:\\Projects\\Grasp\\notes\\physics.txt';
const OUT = 'D:\\Projects\\Grasp\\grasp-content\\content';

function slugify(s) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
}

function parseNotes(content) {
  const lines = content.split('\n');
  const courses = [];
  let cur = null, ch = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t || /^[-*_=]+$/.test(t)) continue;

    const cm = t.match(/^#+\s*Course\s+\d+:\s*(.+)$/);
    if (cm) {
      if (cur) courses.push(cur);
      cur = { title: cm[1].trim(), chapters: [] };
      ch = null;
      continue;
    }

    const chm = t.match(/^##?\s*Chapter\s+\d+:\s*(.+)$/);
    if (chm && cur) {
      ch = { title: chm[1].trim(), topics: [] };
      cur.chapters.push(ch);
      continue;
    }

    if (t.startsWith('*') && ch) {
      const topic = t.replace(/^\*\s*/, '').trim();
      if (topic) ch.topics.push(topic);
    }
  }
  if (cur) courses.push(cur);
  return courses;
}

function buildCourse(domain, course, courseIdx) {
  const courseId = slugify(course.title);
  const base = path.join(OUT, 'courses', domain, courseId);
  const ver = path.join(base, 'versions', '1.0.0');
  const chaptersDir = path.join(ver, 'chapters');

  fs.mkdirSync(ver, { recursive: true });
  fs.mkdirSync(chaptersDir, { recursive: true });

  const chapters = [];

  course.chapters.forEach((ch, ci) => {
    const chId = `chapter-${String(ci + 1).padStart(2, '0')}`;
    const topicsDir = path.join(chaptersDir, chId, 'topics');
    fs.mkdirSync(topicsDir, { recursive: true });

    const topics = ch.topics.map((name, ti) => {
      const tId = `topic-${String(ti + 1).padStart(2, '0')}`;
      const topicDir = path.join(topicsDir, tId);
      fs.mkdirSync(topicDir, { recursive: true });

      const conceptId = `${domain}.${courseId}.${chId}.${tId}`;
      const concept = {
        id: conceptId,
        name: name,
        subject: domain,
        definition: `${name} is a fundamental concept in ${domain}.`,
        explanation: `Learn about ${name} and its applications.`,
        prerequisites: [],
        relatedConcepts: [],
        visualizationIds: [],
        quizIds: [],
        flashcardIds: [],
        exampleIds: [],
        exerciseIds: [],
        difficulty: 'beginner',
        estimatedMinutes: 10,
        tags: [domain, slugify(name)]
      };
      fs.writeFileSync(path.join(topicsDir, tId, 'concept.json'), JSON.stringify(concept, null, 2));

      // topic.json
      const topic = { id: tId, name, description: `Learn about ${name}`, conceptId };
      fs.writeFileSync(path.join(topicsDir, tId, 'topic.json'), JSON.stringify(topic, null, 2));

      return { id: tId, name, conceptId };
    });

    const chapter = { id: chId, name: ch.title, description: ch.title, topics };
    fs.writeFileSync(path.join(chaptersDir, chId, 'chapter.json'), JSON.stringify(chapter, null, 2));

    chapters.push({ id: chId, name: ch.title, topics });
  });

  // course.json
  const courseData = {
    id: courseId,
    name: course.title,
    description: course.title,
    version: '1.0.0',
    domain,
    chapters: chapters.map(c => ({
      id: c.id,
      name: c.name,
      topics: c.topics.map(t => ({ id: t.id, name: t.name, conceptId: t.conceptId }))
    })),
    metadata: { difficulty: 'beginner', estimatedHours: chapters.length * 2, prerequisites: [], tags: [domain, slugify(course.title)] }
  };
  fs.writeFileSync(path.join(ver, 'course.json'), JSON.stringify(courseData, null, 2));

  // latest.json
  fs.writeFileSync(path.join(base, 'latest.json'), JSON.stringify({ latest: '1.0.0', minimumSupported: '1.0.0', schemaVersion: '1.0.0', releasedAt: new Date().toISOString() }, null, 2));

  // index.json
  fs.writeFileSync(path.join(base, 'index.json'), JSON.stringify({ id: courseId, title: course.title, version: '1.0.0', difficulty: 'beginner', estimatedHours: chapters.length * 2, chapters: chapters.length, updatedAt: new Date().toISOString() }, null, 2));

  const conceptCount = chapters.reduce((s, c) => s + c.topics.length, 0);
  return { courseId, chapters: chapters.length, concepts: conceptCount };
}

// MAIN - physics only first
const content = fs.readFileSync(NOTES, 'utf-8');
const courses = parseNotes(content);
console.log(`Physics: ${courses.length} courses`);

courses.forEach((c, i) => {
  const r = buildCourse('physics', c, i);
  console.log(`  ${r.courseId}: ${r.chapters} chapters, ${r.concepts} concepts`);
});

console.log('\nDone - PHYSICS ONLY');
