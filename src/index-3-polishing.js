import { clone } from './utils.js'

// View helper

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

// Event Bus creator

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
  const createChild = (id, compDef) => {
    if (!components[id]) {
       const ctx = {
        id,
        def: compDef,
        state: clone(compDef.state || {}),
        child: (childName, childCompDef) => createChild(`${id}$${childName}`, childCompDef),
        view: compDef.view,
        ev: (evName, data) => bus.msg(evName, {
          id,
          type: 'ev',
          data,
        }),
        cmd: (cmdName, data) => bus.msg(cmdName, {
          id,
          type: 'cmd',
          data,
        }),
      }
      components[id] = ctx
      ctx.container = compDef.view(ctx.state, ctx)
      // listen to commands
      if (compDef.cmds) {
        for (const cmdName in compDef.cmds) {
          bus.on(cmdName, data => compDef.cmds[cmdName](ctx.state, ctx, data))
        }
      }
      // listen to events
      if (compDef.evs) {
        for (const evName in compDef.evs) {
          bus.on(evName, data => compDef.evs[evName](ctx.state, ctx, data))
        }
      }
      // listen to events for aggregating state
      if (compDef.reducers) {
        for (const reducerName in compDef.reducers) {
          bus.on(reducerName, data => {
            compDef.reducers[reducerName](ctx.state, data)
            bus.msg('_render', id)
          })
        }
      }
      // Lifecycle: onInit
      if (components[id].def.onInit) {
        components[id].def.onInit(components[id].state, components[id])
      }
    }
    return components[id].container
  }
  const container = createChild('root', rootComp)
  root.parentNode.replaceChild(container, root)
  // detect DOM changes and manage component removing
  var observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const removedElm of mutation.removedNodes) {
        for (const id in components) {
          if (removedElm === components[id].container && !document.contains(removedElm)) {
            // Lifecycle: onDestroy
            if (components[id].def.onDestroy) {
              components[id].def.onDestroy(components[id].state, components[id])
            }
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
  bus.on('_render', id => {
    const view = components[id].view(components[id].state, components[id])
    const lastContainer = components[id].container
    components[id].container = view
    lastContainer.parentNode.replaceChild(
      view,
      lastContainer
    )
  })
  return { components, bus }
}

// App

// -- UI

const main = {
  view: (s, ctx) => h('div', [
    ctx.child('header', header),
    ctx.child('counter', counter),
  ])
}

const header = {
  view: () => h('div', 'HEADER')
}

const counter = {
  state: {
    count: 0,
  },
  onInit: (s, ctx) => {
    setInterval(() => {
      ctx.ev('CounterIncremented')
    }, 1000)
  },
  cmds: {
    CounterIncrement: (s, ctx) => {
      ctx.ev('CounterIncremented')
    },
  },
  reducers: {
    CounterIncremented: s => {
      s.count++
    },
    CounterDecremented: s => {
      s.count--
    },
  },
  view: (s, ctx) => h('div', {
    style: { fontSize: '24px' },
  }, [
    h('button', {
      onClick: () => ctx.ev('CounterDecremented'),
    }, '-'),
    `Count: ${s.count}`,
    h('button', {
      onClick: () => ctx.cmd('CounterIncrement'),
    }, '+'),
  ]),
}

const appCtx = mount(main, document.getElementById('app'))
