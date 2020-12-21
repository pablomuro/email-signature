import juice from 'juice';
import fs from 'fs';
import path from 'path'
import sass from 'node-sass'
import {
  getCheerioEmailTemplate, getThemeColorsMap, replaceVarsForColorAndPutCdnOnUrls,
  generatePngFromSvgFiles,
  generateBackgroundPng, changeSvgImgSourceFromHtml
} from './utils'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import dotenv from 'dotenv'
dotenv.config()


const IS_TO_COMMIT_FILES = false


class GenerateEmailSignature {
  BACKGROUND_SIZE = 35
  DEFAULT_THEME_COLOR = '#34495E'  //azul-default: #6192de    azul-escuro: #34495E

  gitCdnName = 'https://ghcdn.rawgit.org/'
  gitRepository = 'pablomuro/email-signature/main/'
  templatePath = path.join(__dirname, 'signature_templates')
  defaultTemplateFile = path.join(this.templatePath, 'index.html')

  _html: string | null;
  themeColor: string | null;
  cdnUrl = this.gitCdnName + this.gitRepository

  constructor() {
    this._html = null;
    this.themeColor = null;
  }

  templateData() {
    const {
      name, profession, company, location, phone, email,
      website_url, linkedin_url, github_url, twitter_url, instagram_url
    } = process.env
    return {
      name, profession, company, location, phone, email,
      website_url, linkedin_url, github_url, twitter_url, instagram_url
    }
  }

  async init(fileName: string | null = null) {
    let templateHtml: string
    let templateCss: string

    try {
      templateHtml = fs.readFileSync(path.join(this.templatePath, `${fileName}.html`), 'utf-8').toString()
      templateCss = fs.readFileSync(path.join(this.templatePath, `${fileName}.scss`), 'utf-8').toString()
    } catch (error) {
      templateHtml = fs.readFileSync(this.defaultTemplateFile, 'utf-8').toString()
      templateCss = fs.readFileSync(this.defaultTemplateFile.replace('html', 'scss'), 'utf-8').toString()
    }

    const sassResult = sass.renderSync({
      data: templateCss
    });

    templateCss = sassResult.css.toString()

    const vueApp = createSSRApp({
      data: () => ({ templateCss, ...this.templateData() }),
      template: templateHtml
    })

    const renderHtml = await renderToString(vueApp)

    generateEmailSignature.createImageFiles()

    const matchGroup = renderHtml.match(/(--theme-color)(.*)(#.*)(;)/m)
    if (matchGroup && matchGroup[0].includes('--theme-color') && matchGroup[0].includes('#')) {
      this.themeColor = matchGroup[3]
    }

    this.createImageFiles()
    this._html = renderHtml

    return renderHtml
  }

  get html() {
    return (this._html) ? this._html : ''
  }

  build() {
    if (!this._html) return null
    console.log('generating')

    const $ = getCheerioEmailTemplate(this._html)
    const cssText = $('html head style').contents().get(0).data
    const colorsMap = getThemeColorsMap(cssText)
    const themeColor = (colorsMap.get('--theme-color')) ? colorsMap.get('--theme-color') : this.DEFAULT_THEME_COLOR

    const newCss = replaceVarsForColorAndPutCdnOnUrls(cssText, colorsMap, this.cdnUrl)

    juice.inlineDocument($, newCss)

    this.createImageFiles(themeColor, IS_TO_COMMIT_FILES)

    changeSvgImgSourceFromHtml($, this.cdnUrl)

    const buildedHtml = $.html()

    fs.writeFileSync('out.html', buildedHtml)

    return buildedHtml;
  }

  createImageFiles(_themeColor = null, isToCommitFile = false) {
    const themeColor = (_themeColor) ? _themeColor : this.themeColor
    if (themeColor) {
      generatePngFromSvgFiles(themeColor, isToCommitFile)
      generateBackgroundPng(themeColor, this.BACKGROUND_SIZE)
    }
  }

}

export const generateEmailSignature = new GenerateEmailSignature()




