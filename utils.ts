const mensch = require('mensch')
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import cheerio from 'cheerio'
import { createCanvas, loadImage } from 'canvas'
import { commitPngFiles } from './commitPngFiles'

const readdir = promisify(fs.readdir)

const SVG_COLOR_DIR = `${__dirname}/img/svg_color/`
const SVG_SOCIAL_DIR = `${__dirname}/img/svg/social/`

const svgToPngPath = (svgImgPath: string) => svgImgPath.replace(/svg.*?\//g, 'png/')

export function getCheerioEmailTemplate(emailTemplate: string) {
  return cheerio.load(emailTemplate);
}
export function getThemeColorsMap(cssText: string) {
  const colorMap = new Map()
  const css_parsed = mensch.parse(cssText);
  const root_attr = css_parsed.stylesheet.rules[0]
  root_attr.declarations.map((_var: any) => {
    if (_var.name.includes('--')) {
      colorMap.set(_var.name, _var.value)
    }
  })
  return colorMap
}

export function replaceVarsForColorAndPutCdnOnUrls(cssText: string, colorsMap: Map<string, string>, cdnUrl: string) {
  const lex = mensch.lex(cssText);

  for (let x in lex) {
    let css = lex[x]
    if (css.type == 'property') {
      if (css.value.includes('var(')) {
        const nameIndexInit = css.value.indexOf('var(')
        const nameIndexEnd = css.value.indexOf(')', nameIndexInit)
        const colorName = css.value.slice(nameIndexInit + 4, nameIndexEnd)
        if (colorsMap.get(colorName)) {
          lex[x].value = css.value.replace(css.value.slice(nameIndexInit, nameIndexEnd + 1), colorsMap.get(colorName))
        }
      }
      if (css.value.includes("url(../")) {
        lex[x].value = css.value.replace("url(../", `url(${cdnUrl}`)
      }
    }
  }

  return mensch.stringify(mensch.parse(lex));
}


export function generateBackgroundPng(themeColor: string, backgroundSize: number) {
  const width = backgroundSize
  const height = 1
  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')
  context.fillStyle = themeColor
  context.fillRect(0, 0, width, height)

  const png_buffer = canvas.toBuffer('image/png')
  fs.writeFileSync('./img/png/bg.png', png_buffer)
}

export async function generatePngFromSvgFiles(themeColor: string, commitFiles: boolean = false) {

  await generateFromDir(SVG_COLOR_DIR, themeColor)
  await generateFromDir(SVG_SOCIAL_DIR)
  async function generateFromDir(dir: string, _themeColor: null | string = null) {
    try {
      const files = await readdir(dir)
      for (let i in files) {
        const file = files[i]
        if (path.extname(file) == '.svg') {
          const svgFile: Buffer = fs.readFileSync(`${dir}${file}`)
          const $: cheerio.Root = cheerio.load(svgFile);
          if (_themeColor) {
            $('svg').children('path').attr('fill', themeColor)
          }
          const svgString: string | null = $('svg').parent().html()
          if (svgString) {
            const svgBuffer: Buffer = Buffer.from(svgString);
            fs.writeFileSync(`${dir}${file}`, svgBuffer)
            await generatePngFromSvg(file, dir)
          }
        }
      }
      if (commitFiles) {
        await commitPngFiles();
      }

    } catch (error) {
      console.error(error)
    }
  }


}
export async function generatePngFromSvg(fileName: string, dir: string) {
  const IMAGE_SCALE = 3
  const IMAGE_SIZE = 14

  const svgFilePath: string = `${dir}${fileName}`
  const pngFilePath: string = `${svgToPngPath(dir)}${fileName.replace('.svg', '.png')}`;

  const width = IMAGE_SIZE * IMAGE_SCALE
  const height = width
  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')

  try {
    const svgImage = await loadImage(svgFilePath)
    context.drawImage(svgImage, 0, 0, svgImage.width, svgImage.height, 0, 0, width, height);
    const pngBuffer = canvas.toBuffer('image/png')
    fs.writeFileSync(pngFilePath, pngBuffer)
  } catch (error) {
    console.log('Error: ', error)
  }

}

export function changeSvgImgSourceFromHtml($: cheerio.Root, cdnUrl: string) {
  const imagesNodeList = $('img')
  imagesNodeList.each((index: number, element: cheerio.Element) => {
    if (element.type == 'tag' && element.attribs.src) {
      const imgSrc = element.attribs.src
      if (imgSrc.includes('.svg')) {
        const pngPath = svgToPngPath(imgSrc).replace('../', '').replace('.svg', '.png')
        $(element).attr('src', `${cdnUrl}${pngPath}`)
      } else if (!imgSrc.includes('http')) {
        const newSrc = imgSrc.replace('../', cdnUrl)
        $(element).attr('src', newSrc)
      }
    }

  })
}