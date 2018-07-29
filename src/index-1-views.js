
const h = (name, param1, param2) => {
  const haveOptions = param1 && param2 !== undefined
  let options = haveOptions ? param1 : undefined
  let content = haveOptions ? param2 : param1
  const elm = document.createElement(name)
  if (options) {
    for (const opName in options) {
      if (opName === 'style') {
        const style = options.style
        for (const prop in style) {
          elm.style[prop] = style[prop]
        }
      } else if (opName.startsWith('on')) {
        elm[opName.toLowerCase()] = options[opName]
      } else {
        elm[opName] = options[opName]
      }
    }
  }
  if (content) {
    if (typeof content === 'string') {
      elm.innerText = content
    } else {
      for (const child of content) {
        elm.appendChild(child)
      }
    }
  }
  return elm
}

const render = (root, view) => {
  root.parentNode.replaceChild(view,root)
  return view
}

// App

let root = document.getElementById('app')

const counter = count => h('div', { style: { fontSize: '24px' } }, `Count: ${count}`)

let count = 0

setInterval(() => {
  const view = counter(count)
  root = render(root, view)
  count++
}, 1000)
