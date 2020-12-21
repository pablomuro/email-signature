import express from 'express'
import fs from 'fs'
import path from 'path'
import { generateEmailSignature } from './generateEmailSignature'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import dotenv from 'dotenv'
dotenv.config()

const server = express()
const port = 3000

const templateData: object = (function () {
  const {
    name, profession, company, location, phone, email,
    website_url, linkedin_url, github_url, twitter_url, instagram_url
  } = process.env
  return {
    name, profession, company, location, phone, email,
    website_url, linkedin_url, github_url, twitter_url, instagram_url
  }
}())

const templatePath = path.join(__dirname, 'signature_templates')
const defaultTemplateFile = path.join(templatePath, 'index.html')

server.use('/img', express.static(path.join(__dirname, 'img')))

let templateHtml: string
const generateTemplateHtml = async (fileName: string | null = null) => {

  if (fileName) {
    try {
      templateHtml = fs.readFileSync(path.join(templatePath, `${fileName}.html`), 'utf-8').toString()
    } catch (error) {
      templateHtml = fs.readFileSync(defaultTemplateFile, 'utf-8').toString()
    }
  } else {
    templateHtml = fs.readFileSync(defaultTemplateFile, 'utf-8').toString()
  }

  const vueApp = createSSRApp({
    data: () => ({ ...templateData }),
    template: templateHtml
  })

  const renderHtml = await renderToString(vueApp)

  generateEmailSignature.init(renderHtml)
  generateEmailSignature.createImageFiles()

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

server.listen(3000, () => {
  console.log(`Example server listening at http://localhost:3000`)
})