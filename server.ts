import express from 'express'
import path from 'path'
import { generateEmailSignature } from './generateEmailSignature'

const server = express()
const port = 3000

server.use('/img', express.static(path.join(__dirname, 'img')))


const generateTemplateHtml = async (fileName: string | null = null) => {

  const renderHtml = await generateEmailSignature.init(fileName)

  return renderHtml
}

server.get('/out', async (req: any, res: any) => {
  let buildedHtml = generateEmailSignature.build()
  if (!buildedHtml) {
    await generateTemplateHtml()
    buildedHtml = generateEmailSignature.build()
  }

  res.send(buildedHtml)

})
server.get('*/:template', async (req: any, res: any) => {
  const templateFileName = req.params.template
  const renderHtml = await generateTemplateHtml(templateFileName)
  res.end(renderHtml);
})

server.get('/', async (req: any, res: any) => {
  const renderHtml = await generateTemplateHtml()
  res.end(renderHtml);
})


const listener = server.listen(0, () => {
  console.log(`Example server listening at http://localhost:${listener.address().port}`)
})
