import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTypeCheck() {
    try {
        const { stdout, stderr } = await execAsync('npx tsc --noEmit');
        if (stderr) {
            console.error('Type check errors:', stderr);
            return false;
        }
        console.log('Type check passed:', stdout);
        return true;
    } catch (error) {
        console.error('Type check failed:', error);
        return false;
    }
}

// 5秒ごとに型チェックを実行
setInterval(runTypeCheck, 5000);

// 初回実行
runTypeCheck(); 