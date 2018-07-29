
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
        if (typeof child === 'function') {
          elm.appendChild(child())
        } else if (typeof child === 'string') {
          elm.appendChild(document.createTextNode(child))
        } else {
          elm.appendChild(child)
        }
      }
    }
  }
  return elm
}

// -- Event Bus

const createBus = () => {
  let state = {}
  return {
    msg (name, data) {
      if (state[name]) {
        for (const sub of state[name]) {
          sub(data)
        }
      }
    },
    on (name, fn) {
      if (!state[name]) {
        state[name] = []
      }
      state[name].push(fn)
    },
  }
}

// -- Framework

const mount = (rootComp, root) => {
  const components = {}
  const bus = createBus()
  const createChild = (name, builderFn) => {
    if (!components[name]) {
      const view =
        builderFn(name, bus, (childName, builderFn) => createChild(`${name}$${childName}`, builderFn))
      const container = view()
      components[name] = {
        view,
        container,
      }
    }
    return components[name].container
  }
  const container = createChild('root', rootComp)
  root.parentNode.replaceChild(container, root)
  // detect DOM changes and manage component removing
  var observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const removedElm of mutation.removedNodes) {
        for (const id in components) {
          if (removedElm === components[id].container && !document.contains(removedElm)) {
            delete components[id]
            if (id === 'root') {
              observer.disconnect()
            }
          }
        }
      }
    }
  })
  observer.observe(container.parentNode, {
    childList: true,
    subtree: true,
  })
  // react to state changes
  bus.on('_render', data => {
    const view = components[data.id].view()
    const lastContainer = components[data.id].container
    components[data.id].container = view
    lastContainer.parentNode.replaceChild(
      view,
      lastContainer
    )
  })
  return bus
}

// App

// -- UI

const main = (id, bus, child) => {
  return () => h('div', [
    child('header', header),
    child('counter', counter),
  ])
}

const header = (id, bus) => {
  return () => h('div', 'HEADER')
}

const counter = (id, bus, child) => {
  let count = 0

  bus.on('IncrementCounter', data => bus.msg('CounterIncremented', data))

  bus.on('CounterIncremented', data => {
    count++
    bus.msg('_render', data)
  })

  setInterval(() => {
    // bus.msg('IncrementCounter', { id })
  }, 1000)

  return () => h('div', {
    style: { fontSize: '24px' },
    onClick: ev => bus.msg('IncrementCounter', { id }),
  }, [
    `Count: ${count}`,
    child('header', header),
  ])
}

mount(main, document.getElementById('app'))
