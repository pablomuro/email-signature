import juice from 'juice';
import fs from 'fs';
import dotenv from 'dotenv'
import {
  getCheerioEmailTemplate, getThemeColorsMap, replaceVarsForColorAndPutCdnOnUrls,
  generatePngFromSvgFiles,
  generateBackgroundPng, changeSvgImgSourceFromHtml
} from './utils'

dotenv.config()

const IS_TO_COMMIT_FILES = true

const templateData = (function () {
  const {
    name, profession, company, location, phone, email,
    linkedin_url, github_url, twitter_url, instagram_url
  } = process.env
  return {
    name, profession, company, location, phone, email,
    linkedin_url, github_url, twitter_url, instagram_url
  }
}())
console.log(templateData)


const GIT_CDN_NAME = 'https://ghcdn.rawgit.org/'
const REPOSITORIE = 'pablomuro/email-signature/main/'
const BACKGROUND_SIZE = 35
const DEFAULT_THEME_COLOR = '#34495E'  //azul-default: #6192de    azul-escuro: #34495E
const OVERRIDE_CSS_THEME_COLOR = false

const $ = getCheerioEmailTemplate('./stamp_email_out.html')
const cssText = $('html head style').contents().get(0).data
const cdnUrl = GIT_CDN_NAME + REPOSITORIE
const colorsMap = getThemeColorsMap(cssText)
const themeColor = (!OVERRIDE_CSS_THEME_COLOR) ? (colorsMap.get('--theme-color')) ? colorsMap.get('--theme-color') : DEFAULT_THEME_COLOR : DEFAULT_THEME_COLOR

const newCss = replaceVarsForColorAndPutCdnOnUrls(cssText, colorsMap, cdnUrl)

juice.inlineDocument($, newCss)

generatePngFromSvgFiles(themeColor, IS_TO_COMMIT_FILES)
generateBackgroundPng(themeColor, BACKGROUND_SIZE)

changeSvgImgSourceFromHtml($, cdnUrl)

fs.writeFileSync('out.html', $.html())

