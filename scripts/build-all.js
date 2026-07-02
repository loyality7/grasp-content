const fs = require('fs');
const path = require('path');

const NOTES_DIR = 'D:\\Projects\\Grasp\\notes';
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

function buildCourse(domain, course) {
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
      fs.writeFileSync(path.join(topicDir, 'concept.json'), JSON.stringify(concept, null, 2));

      const topic = { id: tId, name, description: `Learn about ${name}`, conceptId };
      fs.writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify(topic, null, 2));

      return { id: tId, name, conceptId };
    });

    const chapter = { id: chId, name: ch.title, description: ch.title, topics };
    fs.writeFileSync(path.join(chaptersDir, chId, 'chapter.json'), JSON.stringify(chapter, null, 2));

    chapters.push({ id: chId, name: ch.title, topics });
  });

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

  fs.writeFileSync(path.join(base, 'latest.json'), JSON.stringify({ latest: '1.0.0', minimumSupported: '1.0.0', schemaVersion: '1.0.0', releasedAt: new Date().toISOString() }, null, 2));

  fs.writeFileSync(path.join(base, 'index.json'), JSON.stringify({ id: courseId, title: course.title, version: '1.0.0', difficulty: 'beginner', estimatedHours: chapters.length * 2, chapters: chapters.length, updatedAt: new Date().toISOString() }, null, 2));

  const conceptCount = chapters.reduce((s, c) => s + c.topics.length, 0);
  return { courseId, chapters: chapters.length, concepts: conceptCount };
}

// MAIN
const files = [
  { file: 'physics.txt', domain: 'physics' },
  { file: 'Maths.txt', domain: 'mathematics' },
  { file: 'chemistry.txt', domain: 'chemistry' },
  { file: 'biology.txt', domain: 'biology' },
  { file: 'ComputerScience.txt', domain: 'computer-science' },
  { file: 'economics.txt', domain: 'economics' },
  { file: 'philosphy.txt', domain: 'philosophy' },
  { file: 'psycology.txt', domain: 'psychology' },
  { file: 'gamethoery.txt', domain: 'game-theory' }
];

let totalConcepts = 0;
let totalCourses = 0;

files.forEach(({ file, domain }) => {
  const filePath = path.join(NOTES_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP ${file}: not found`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const courses = parseNotes(content);
  console.log(`\n${domain}: ${courses.length} courses`);

  courses.forEach(c => {
    const r = buildCourse(domain, c);
    totalConcepts += r.concepts;
    totalCourses++;
    console.log(`  ${r.courseId}: ${r.chapters} chapters, ${r.concepts} concepts`);
  });
});

console.log(`\n✅ Total: ${totalCourses} courses, ${totalConcepts} concepts`);
