import { promisify } from 'util'
import child_process from 'child_process'
const exec = promisify(child_process.exec)

export async function commitPngFiles() {
  const command =
    "git add img/png/* ; git commit -m 'automated commit new png images'; git push";

  try {
    const { stdout, stderr } = await exec(command);
    if(stderr.includes('Everything up-to-date')){
      console.log('stderr:', stderr);
    } else {
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
    }

  } catch (err){
    console.error(err);
  }
}
