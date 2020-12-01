const juice = require('juice');
const cheerio = require('cheerio')
const mensch = require('mensch');
const fs = require('fs');
const { createCanvas } = require('canvas')
// https://gitcdn.link/repo/pablomuro/email-signature/main/img/bg.png
const email_template = fs.readFileSync('./stamp_email.html')
const $ = cheerio.load(email_template);

let COLORS = {}
let css_text = $('html head style').contents().get(0).data
const new_css = parse_colors_and_background(css_text)
const THEME_COLOR = COLORS.get('--theme-color')


juice.inlineDocument($, new_css)

// console.log(new_css)
// console.log($.html())
console.log('')
fs.writeFileSync('out.html', $.html())
makeBase64Png(THEME_COLOR)
console.log('FIM')

function img_from_svg(){
  const svg_list = $('svg')
  svg_list.each(function(i, elem) {
    const img_container = $(this).parent()

    $(this).children('path').attr('fill', THEME_COLOR)

    const svgHtmlString = img_container.html()
    const base64_svg = new Buffer.from(svgHtmlString).toString('base64');
    const base64ImgSrc = `data:image/svg+xml;base64,${base64_svg}`;

    const new_img = $(`<img src="${base64ImgSrc}">`)
    $(this).replaceWith(new_img)

  });
}

function parse_colors_and_background(css_text){
  const color_map = new Map()
  const lex = mensch.lex(css_text);
  const css_parsed = mensch.parse(css_text);
  const root_attr = css_parsed.stylesheet.rules[0]
  root_attr.declarations.map(function(_var){
    if(_var.name.includes('--')){
      color_map.set(_var.name, _var.value)
    }
  })
  COLORS = color_map

  let isBase64 = false
  for(let x in lex){
    let css = lex[x]
    if(css.type == 'selector' && css.text == '.custom-background') {
      // isBase64 = true
    }
    if(css.type == 'property'){
      if(isBase64 && css.name == 'background-image') {
        const base64Png = makeBase64Png(color_map.get('--theme-color'), true)
        lex[x].value = base64Png
        isBase64 = false
      }

      if(css.value.includes('var(')){
        const nameIndexInit = css.value.indexOf('var(')
        const nameIndexEnd = css.value.indexOf(')', nameIndexInit)
        const color_name = css.value.slice(nameIndexInit+4, nameIndexEnd)
        if(color_map.get(color_name)){
          lex[x].value = css.value.replace(css.value.slice(nameIndexInit, nameIndexEnd+1),color_map.get(color_name))
        }

      }
    }
  }

  return mensch.stringify(mensch.parse(lex));
}

function makeBase64Png(color, isCss = false){
  const width = 35
  const height = 1
  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')
  context.fillStyle = color
  context.fillRect(0, 0, width, height)

  const png_buffer = canvas.toBuffer('image/png')
  fs.writeFileSync('_bg.out.png', png_buffer)


  // =========================================SAVE SVG_COLOR FILE =========================================
  // load SVG file from img src, find on img, change fill and save on svg/color
  const svg_file = fs.readFileSync('./stamp_email.html')
  const $_svg = cheerio.load(svg_file);
  // _svg find path and change fill for theme-color
  const svgHtmlString = $_svg.html()
  const svg_buffer = new Buffer.from(svgHtmlString);
  fs.writeFileSync('a.out.svg', svg_buffer)
  // =======================================================================================================


  // const base64_png = png_buffer.toString('base64');

  // return isCss ? `url('data:image/png;base64,${base64_png}')` : `data:image/png;base64,${base64_png}`
}
