import express from 'express'
import fs from 'fs'
import path from 'path'
// import { generator } from './generateEmailSgnature'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import dotenv from 'dotenv'
dotenv.config()

const server = express()
const port = 3000

const templateData: object = (function () {
  const {
    name, profession, company, location, phone, email,
    linkedin_url, github_url, twitter_url, instagram_url
  } = process.env
  return {
    name, profession, company, location, phone, email,
    linkedin_url, github_url, twitter_url, instagram_url
  }
}())

const templateFile = path.join(__dirname, 'signature_templates', 'index.html')

server.use('/img', express.static(path.join(__dirname, 'img')))

const generateTemplateHtml = async () => {
  const templateHtml = fs.readFileSync(templateFile, 'utf-8').toString()

  const vueApp = createSSRApp({
    data: () => ({ ...templateData }),
    template: templateHtml
  })

  const renderHtml = await renderToString(vueApp)
  return renderHtml
}

server.get('/out', async (req: any, res: any) => {
  const renderHtml = await generateTemplateHtml()
  res.send('teste')
})
server.get('*', async (req: any, res: any) => {
  const renderHtml = await generateTemplateHtml()
  res.send(renderHtml);
})

server.listen(3000, () => {
  console.log(`Example server listening at http://localhost:3000`)
})