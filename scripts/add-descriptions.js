const fs = require('fs');
const path = require('path');

const NOTES_DIR = 'D:\\Projects\\Grasp\\notes';
const CONTENT_DIR = 'D:\\Projects\\Grasp\\grasp-content\\content';

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

function slugify(s) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
}

function isValidDescription(desc, courseTitle) {
  if (!desc) return false;
  const d = desc.toLowerCase().trim();
  if (/^\d+\./.test(d)) return false; // starts with "1.", "2.", etc.
  if (d.startsWith('perfect') || d.startsWith('great') || d.startsWith('good')) return false;
  if (d.includes("i'd build") || d.includes("let's do") || d.includes("next comes") || d.includes("next course")) return false;
  if (d.length < 15) return false;
  if (d.includes('this completes the') || d.includes('this is a complete')) return false;
  return true;
}

function parseNotes(content) {
  const courses = [];
  let cur = null;
  let lastLines = [];
  
  for (const raw of content.split('\n')) {
    const t = raw.trim();
    if (!t) continue;
    
    // Match course headers
    const cm = t.match(/^#+\s*Course\s+\d+:\s*(.+)$/i);
    if (cm) {
      if (cur) {
        // Resolve description fallback for the finished course before pushing
        if (!cur.description) {
          let desc = '';
          for (let i = cur.precedingLines.length - 1; i >= 0; i--) {
            const line = cur.precedingLines[i];
            if (line.startsWith('*') || line.startsWith('#') || /^[-*_=]+$/.test(line)) {
              continue;
            }
            desc = line;
            break;
          }
          cur.description = desc;
        }
        delete cur.precedingLines;
        courses.push(cur);
      }
      
      cur = { 
        title: cm[1].trim(), 
        chaptersCount: 0, 
        description: '', 
        precedingLines: [...lastLines] 
      };
      lastLines = [];
      continue;
    }
    
    // Match chapter headers to stop description capture
    const chm = t.match(/^#+\s*Chapter\s+\d+:\s*(.+)$/i);
    if (chm && cur) {
      cur.chaptersCount++;
      continue;
    }
    
    // Match topics: lines starting with *
    if (t.startsWith('*') && cur) {
      continue;
    }
    
    // If we have a course but no chapters yet, and it's not a list, header, or divider, it's the description after the header
    if (cur && cur.chaptersCount === 0 && !t.startsWith('*') && !t.startsWith('#') && !/^[-*_=]+$/.test(t)) {
      if (!cur.description) {
        cur.description = t;
      }
    }
    
    // Accumulate other text lines to help find description for the next course
    if (!t.startsWith('*') && !t.startsWith('#') && !/^[-*_=]+$/.test(t)) {
      lastLines.push(t);
    }
  }
  
  if (cur) {
    if (!cur.description) {
      let desc = '';
      for (let i = cur.precedingLines.length - 1; i >= 0; i--) {
        const line = cur.precedingLines[i];
        if (line.startsWith('*') || line.startsWith('#') || /^[-*_=]+$/.test(line)) {
          continue;
        }
        desc = line;
        break;
      }
      cur.description = desc;
    }
    delete cur.precedingLines;
    courses.push(cur);
  }
  
  return courses;
}

// Process notes and update JSON files
files.forEach(({ file, domain }) => {
  const fp = path.join(NOTES_DIR, file);
  if (!fs.existsSync(fp)) {
    console.log(`Skip: ${file} (not found)`);
    return;
  }

  console.log(`Parsing ${file} for domain: ${domain}...`);
  const content = fs.readFileSync(fp, 'utf-8');
  const courses = parseNotes(content);

  courses.forEach(course => {
    const courseId = slugify(course.title);
    let desc = course.description || '';

    if (!isValidDescription(desc, course.title)) {
      desc = `Learn and master the concepts of ${course.title} with structured lessons, interactive visualizations, and practice exercises.`;
      console.log(`  💡 Fallback description for "${course.title}"`);
    } else {
      console.log(`  ✅ Parsed description for "${course.title}" -> "${desc.substring(0, 60)}..."`);
    }

    // 1. Update index.json
    const indexPath = path.join(CONTENT_DIR, 'courses', domain, courseId, 'index.json');
    if (fs.existsSync(indexPath)) {
      const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      data.description = desc;
      fs.writeFileSync(indexPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    // 2. Update course.json
    const coursePath = path.join(CONTENT_DIR, 'courses', domain, courseId, 'versions', '1.0.0', 'course.json');
    if (fs.existsSync(coursePath)) {
      const data = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
      data.description = desc;
      fs.writeFileSync(coursePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  });

  // 3. Update compiled courses.json for this domain
  const domainCoursesPath = path.join(CONTENT_DIR, 'courses', domain, 'courses.json');
  if (fs.existsSync(domainCoursesPath)) {
    const coursesList = JSON.parse(fs.readFileSync(domainCoursesPath, 'utf-8'));
    let updatedCount = 0;
    coursesList.forEach(c => {
      const parsedCourse = courses.find(pc => slugify(pc.title) === c.id);
      if (parsedCourse) {
        let desc = parsedCourse.description;
        if (!isValidDescription(desc, parsedCourse.title)) {
          desc = `Learn and master the concepts of ${parsedCourse.title} with structured lessons, interactive visualizations, and practice exercises.`;
        }
        c.description = desc;
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      fs.writeFileSync(domainCoursesPath, JSON.stringify(coursesList, null, 2), 'utf-8');
      console.log(`  ✅ Updated ${updatedCount} courses in ${domainCoursesPath}`);
    }
  }
});

console.log('🎉 Done adding descriptions to courses!');
