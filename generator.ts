import { generateEmailSignature } from './generateEmailSignature'
import consola from 'consola'
import open from 'open'

main();
async function main() {


  try {
    consola.info("Generating email signature in out.html")
    await generateEmailSignature.init()
    generateEmailSignature.build()
    consola.success("Success")
    open(`file:///${process.cwd()}/out.html`)
  } catch (error) {
    consola.error(error)
  }
}