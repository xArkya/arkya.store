// Deploy de dist/ a la rama gh-pages usando un git worktree temporal.
// Reemplaza al paquete `gh-pages`, que falla en Windows (ENAMETOOLONG)
// con miles de archivos en public/images/products.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const BRANCH = 'gh-pages';
const REMOTE = 'origin';
const worktree = path.join(os.tmpdir(), `arkya-${BRANCH}-${Date.now()}`);

const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' });
const ok = (cmd, cwd = root) => {
  try { execSync(cmd, { cwd, stdio: 'pipe' }); return true; }
  catch { return false; }
};

if (!fs.existsSync(dist)) {
  console.error('No existe dist/. Corré "npm run build" primero.');
  process.exit(1);
}

let attached = false;
try {
  run('git worktree prune');
  ok(`git worktree remove --force "${worktree}"`);

  if (ok(`git ls-remote --exit-code ${REMOTE} ${BRANCH}`)) {
    run(`git fetch ${REMOTE} ${BRANCH}`);
    run(`git worktree add --force --detach "${worktree}" FETCH_HEAD`);
    attached = true;
    run(`git checkout -B ${BRANCH}`, worktree);
  } else {
    run(`git worktree add --detach "${worktree}"`);
    attached = true;
    run(`git checkout --orphan ${BRANCH}`, worktree);
  }

  // Vaciar el worktree (excepto .git) y copiar el build nuevo
  for (const entry of fs.readdirSync(worktree)) {
    if (entry === '.git') continue;
    fs.rmSync(path.join(worktree, entry), { recursive: true, force: true });
  }
  fs.cpSync(dist, worktree, { recursive: true });

  run('git add -A', worktree);
  if (ok('git diff --cached --quiet', worktree)) {
    console.log('Sin cambios: dist/ ya está publicado.');
  } else {
    run(`git commit -m "Deploy ${new Date().toISOString()}"`, worktree);
    run(`git push ${REMOTE} ${BRANCH}`, worktree);
    console.log('Deploy completado.');
  }
} finally {
  if (attached) ok(`git worktree remove --force "${worktree}"`);
}
