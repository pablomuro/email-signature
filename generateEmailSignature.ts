import juice from 'juice';
import fs from 'fs';
import {
  getCheerioEmailTemplate, getThemeColorsMap, replaceVarsForColorAndPutCdnOnUrls,
  generatePngFromSvgFiles,
  generateBackgroundPng, changeSvgImgSourceFromHtml
} from './utils'


const IS_TO_COMMIT_FILES = false


class GenerateEmailSignature {
  GIT_CDN_NAME = 'https://ghcdn.rawgit.org/'
  REPOSITORY = 'pablomuro/email-signature/main/'
  BACKGROUND_SIZE = 35
  DEFAULT_THEME_COLOR = '#34495E'  //azul-default: #6192de    azul-escuro: #34495E
  OVERRIDE_CSS_THEME_COLOR = false

  _html: string | null;
  themeColor: string | null;
  cdnUrl = this.GIT_CDN_NAME + this.REPOSITORY

  constructor() {
    this._html = null;
    this.themeColor = null;
  }

  init(html: string) {
    this._html = html
    const matchGroup = html.match(/(--theme-color)(.*)(#.*)(;)/m)
    if (matchGroup && matchGroup[0].includes('--theme-color') && matchGroup[0].includes('#')) {
      this.themeColor = matchGroup[3]
    }

    this.createImageFiles()
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
    const themeColor = (!this.OVERRIDE_CSS_THEME_COLOR) ? (colorsMap.get('--theme-color')) ? colorsMap.get('--theme-color') : this.DEFAULT_THEME_COLOR : this.DEFAULT_THEME_COLOR

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




